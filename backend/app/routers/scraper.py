from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, ScrapedNews, Alert
from ..schemas.news import ScrapeRequest, ScrapeResponse, ArticleResult, NewsHistoryResponse, NewsHistoryItem
from ..services.auth_service import get_current_user
from ..services.scraper_service import extract_articles_from_url, fetch_article_content
from ..services.sentiment_service import analyze_sentiment, check_harmful, analyze_with_gemini, check_fake_news
import os
import json
import glob
from datetime import datetime
from urllib.parse import urlparse

router = APIRouter(prefix="/api/scraper", tags=["scraper"])


@router.post("/scrape", response_model=ScrapeResponse)
def scrape_news(data: ScrapeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        articles = extract_articles_from_url(data.url)
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
            source_url=data.url,
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

    db.commit()

    # Save to JSON file inside exports/ folder
    try:
        domain = urlparse(data.url).netloc or "unknown_domain"
        if domain.startswith("www."):
            domain = domain[4:]
        domain = "".join(c for c in domain if c.isalnum() or c in ".-_")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{domain}_{timestamp}.json"
        
        EXPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "exports"))
        os.makedirs(EXPORTS_DIR, exist_ok=True)
        filepath = os.path.join(EXPORTS_DIR, filename)
        
        file_data = {
            "source_url": data.url,
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

    return ScrapeResponse(articles=results, total=len(results))


@router.get("/history", response_model=NewsHistoryResponse)
def get_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(ScrapedNews).filter(ScrapedNews.user_id == user.id)
    items = query.order_by(ScrapedNews.created_at.desc()).all()
    return NewsHistoryResponse(
        items=[NewsHistoryItem.model_validate(n) for n in items],
        total=len(items),
    )


# Root exports directory
EXPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "exports"))


def resolve_export_path(filename: str) -> str:
    exports_dir = os.path.abspath(EXPORTS_DIR)
    requested_path = os.path.abspath(os.path.join(exports_dir, filename))
    try:
        common_path = os.path.commonpath([exports_dir, requested_path])
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    if os.path.normcase(common_path) != os.path.normcase(exports_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    return requested_path


@router.get("/exports")
def list_exports(user: User = Depends(get_current_user)):
    os.makedirs(EXPORTS_DIR, exist_ok=True)
    files = glob.glob(os.path.join(EXPORTS_DIR, "*.json"))
    results = []
    for f in files:
        filename = os.path.basename(f)
        parts = filename.replace(".json", "").split("_")
        if len(parts) >= 2:
            domain = parts[0]
            timestamp_str = "_".join(parts[1:])
        else:
            domain = filename
            timestamp_str = "unknown"
        
        stat = os.stat(f)
        created_time = datetime.fromtimestamp(stat.st_mtime).isoformat()
        
        try:
            with open(f, "r", encoding="utf-8") as file_obj:
                data = json.load(file_obj)
                total_articles = len(data.get("articles", []))
                source_url = data.get("source_url", "")
        except Exception:
            total_articles = 0
            source_url = ""

        results.append({
            "filename": filename,
            "domain": domain,
            "timestamp": timestamp_str,
            "created_at": created_time,
            "total_articles": total_articles,
            "source_url": source_url,
            "size_bytes": stat.st_size
        })
    
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


@router.get("/exports/{filename}")
def get_export_content(filename: str, user: User = Depends(get_current_user)):
    filepath = resolve_export_path(filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


@router.delete("/exports/{filename}")
def delete_export(filename: str, user: User = Depends(get_current_user)):
    filepath = resolve_export_path(filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(filepath)
    return {"detail": "File deleted successfully"}
