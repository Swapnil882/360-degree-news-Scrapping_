from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, ScrapedNews, Alert
from ..schemas.dashboard import DashboardStats
from ..services.auth_service import get_current_user, require_staff

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_staff:
        total = db.query(func.count(ScrapedNews.id)).scalar() or 0
        harmful = db.query(func.count(ScrapedNews.id)).filter(ScrapedNews.is_harmful == True).scalar() or 0
        pending = db.query(func.count(Alert.id)).filter(Alert.status == "pending").scalar() or 0
        users = db.query(func.count(User.id)).scalar() or 0
    else:
        total = db.query(func.count(ScrapedNews.id)).filter(ScrapedNews.user_id == user.id).scalar() or 0
        harmful = db.query(func.count(ScrapedNews.id)).filter(ScrapedNews.user_id == user.id, ScrapedNews.is_harmful == True).scalar() or 0
        pending = db.query(func.count(Alert.id)).filter(Alert.reported_by == user.id, Alert.status == "pending").scalar() or 0
        users = 0

    sentiment_counts = {}
    sentiment_query = db.query(ScrapedNews.sentiment, func.count(ScrapedNews.id))
    if not user.is_staff:
        sentiment_query = sentiment_query.filter(ScrapedNews.user_id == user.id)
    sentiment_data = sentiment_query.group_by(ScrapedNews.sentiment).all()
    for s, c in sentiment_data:
        sentiment_counts[s] = c

    labels = ["positive", "negative", "neutral"]
    counts = [sentiment_counts.get(l, 0) for l in labels]

    return DashboardStats(
        total_articles=total,
        harmful_count=harmful,
        pending_alerts=pending,
        total_users=users,
        sentiment_labels=labels,
        sentiment_counts=counts,
    )


@router.get("/trends")
def get_trends(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=6)
    
    query = db.query(
        func.date(ScrapedNews.created_at).label("day"),
        func.count(ScrapedNews.id).label("articles_count"),
        func.sum(func.cast(ScrapedNews.is_harmful, Integer)).label("alerts_count")
    ).filter(ScrapedNews.created_at >= start_date)
    
    if not user.is_staff:
        query = query.filter(ScrapedNews.user_id == user.id)
        
    trends_data = query.group_by("day").order_by("day").all()
    
    trends_dict = {t[0]: {"articles": t[1] or 0, "alerts": int(t[2] or 0)} for t in trends_data if t[0] is not None}
    
    result = []
    current = start_date
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        day_label = current.strftime("%b %d")
        stats = trends_dict.get(date_str, {"articles": 0, "alerts": 0})
        result.append({
            "date": date_str,
            "week": day_label,
            "articles": stats["articles"],
            "alerts": stats["alerts"]
        })
        current += timedelta(days=1)
        
    return result
