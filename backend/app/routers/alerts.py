from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, ScrapedNews, Alert
from ..schemas.alert import AlertItem, AlertListResponse, AlertUpdate
from ..services.auth_service import get_current_user, require_staff

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=AlertListResponse)
def list_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_staff:
        alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    else:
        alerts = db.query(Alert).filter(Alert.reported_by == user.id).order_by(Alert.created_at.desc()).all()

    result = []
    for alert in alerts:
        news = db.query(ScrapedNews).filter(ScrapedNews.id == alert.news_id).first()
        reported = db.query(User).filter(User.id == alert.reported_by).first()
        result.append(AlertItem(
            id=alert.id,
            news_title=news.title if news else "Unknown",
            news_id=alert.news_id,
            reason=alert.reason,
            status=alert.status,
            reported_by_username=reported.username if reported else "Unknown",
            admin_notes=alert.admin_notes or "",
            created_at=alert.created_at,
        ))

    return AlertListResponse(alerts=result, total=len(result))


@router.get("/{alert_id}", response_model=AlertItem)
def get_alert(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if not user.is_staff and alert.reported_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    news = db.query(ScrapedNews).filter(ScrapedNews.id == alert.news_id).first()
    reported = db.query(User).filter(User.id == alert.reported_by).first()
    return AlertItem(
        id=alert.id,
        news_title=news.title if news else "Unknown",
        news_id=alert.news_id,
        reason=alert.reason,
        status=alert.status,
        reported_by_username=reported.username if reported else "Unknown",
        admin_notes=alert.admin_notes or "",
        created_at=alert.created_at,
    )


@router.put("/{alert_id}")
def update_alert(alert_id: int, data: AlertUpdate, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = data.status
    alert.admin_notes = data.admin_notes
    alert.reviewed_by = user.id
    db.commit()
    return {"message": "Alert updated"}
