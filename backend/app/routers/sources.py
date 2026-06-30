from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os
import json
from urllib.parse import urlparse

from ..database import get_db
from ..models import User, Source, ScrapedNews, Alert
from ..schemas.source import SourceCreate, SourceUpdate, SourceResponse
from ..schemas.news import ArticleResult
from ..services.auth_service import get_current_user
from ..services.scraper_service import extract_articles_from_url, fetch_article_content
from ..services.sentiment_service import analyze_sentiment, check_harmful, analyze_with_gemini, check_fake_news

router = APIRouter(prefix="/api/sources", tags=["sources"])

@router.get("/", response_model=list[SourceResponse])
def get_sources(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Source).order_by(Source.created_at.desc()).all()

@router.post("/", response_model=SourceResponse)
def create_source(data: SourceCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = Source(
        name=data.name,
        url=data.url,
        category=data.category,
        is_active=data.is_active,
        frequency=data.frequency
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.put("/{id}", response_model=SourceResponse)
def update_source(id: int, data: SourceUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    if data.name is not None:
        source.name = data.name
    if data.url is not None:
        source.url = data.url
    if data.category is not None:
        source.category = data.category
    if data.is_active is not None:
        source.is_active = data.is_active
    if data.frequency is not None:
        source.frequency = data.frequency
        
    db.commit()
    db.refresh(source)
    return source

@router.delete("/{id}")
def delete_source(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    db.delete(source)
    db.commit()
    return {"detail": "Source deleted successfully"}

@router.post("/{id}/scrape")
def scrape_source(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    try:
        articles = extract_articles_from_url(source.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scraping failed: Unable to fetch/parse the URL. {str(e)}")
    
    results = []

    scraped_data_list = []
    for article in articles:
        content = fetch_article_content(article["url"])
        sentiment, score = analyze_sentiment(content)
        is_harmful, harm_reason = check_harmful(article["title"], content)
        trust_score, trust_class, fake_reason = check_fake_news(article["title"], content)

        gemini = analyze_with_gemini(article["title"], content)
        if gemini:
            sentiment = gemini.get("sentiment", sentiment)
            score = gemini.get("sentiment_score", score)
            is_harmful = gemini.get("is_harmful", is_harmful)
            if gemini.get("harm_reason"):
                harm_reason = gemini["harm_reason"]
            trust_score = gemini.get("trust_score", trust_score)
            trust_class = gemini.get("trust_classification", trust_class)
            fake_reason = gemini.get("fake_reason", fake_reason) or ""
            
        scraped_data_list.append({
            "title": article["title"],
            "url": article["url"],
            "content": content[:5000],
            "sentiment": sentiment,
            "score": score,
            "is_harmful": is_harmful,
            "harm_reason": harm_reason,
            "trust_score": trust_score,
            "trust_classification": trust_class,
            "fake_reason": fake_reason
        })

    for item in scraped_data_list:
        news = ScrapedNews(
            user_id=user.id,
            source_url=source.url,
            title=item["title"],
            content=item["content"],
            article_url=item["url"],
            sentiment=item["sentiment"],
            sentiment_score=item["score"],
            is_harmful=item["is_harmful"],
            harm_reason=item["harm_reason"],
            trust_score=item["trust_score"],
            trust_classification=item["trust_classification"],
            fake_reason=item["fake_reason"],
        )
        db.add(news)
        db.flush()

        if item["is_harmful"]:
            alert = Alert(
                news_id=news.id,
                reported_by=user.id,
                reason=item["harm_reason"] or "Potentially harmful content detected",
            )
            db.add(alert)

        results.append(ArticleResult(
            title=item["title"],
            url=item["url"],
            sentiment=item["sentiment"],
            score=item["score"],
            is_harmful=item["is_harmful"],
            harm_reason=item["harm_reason"],
            trust_score=item["trust_score"],
            trust_classification=item["trust_classification"],
            fake_reason=item["fake_reason"],
        ))

    source.last_scraped_at = datetime.now()
    db.commit()

    # Save to JSON file inside exports/ folder
    try:
        domain = urlparse(source.url).netloc or "unknown_domain"
        if domain.startswith("www."):
            domain = domain[4:]
        domain = "".join(c for c in domain if c.isalnum() or c in ".-_")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{domain}_{timestamp}.json"
        
        EXPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "exports"))
        os.makedirs(EXPORTS_DIR, exist_ok=True)
        filepath = os.path.join(EXPORTS_DIR, filename)
        
        file_data = {
            "source_url": source.url,
            "domain": domain,
            "scraped_at": datetime.now().isoformat(),
            "total": len(results),
            "articles": [
                {
                    "title": r.title,
                    "url": r.url,
                    "sentiment": r.sentiment,
                    "score": r.score,
                    "is_harmful": r.is_harmful,
                    "harm_reason": r.harm_reason,
                    "trust_score": r.trust_score,
                    "trust_classification": r.trust_classification,
                    "fake_reason": r.fake_reason,
                }
                for r in results
            ]
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(file_data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Failed to save JSON export file:", e)

    return {"detail": "Scraping completed successfully", "scraped_count": len(results)}
