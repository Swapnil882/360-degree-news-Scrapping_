from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AlertItem(BaseModel):
    id: int
    news_title: str
    news_id: int
    reason: str
    status: str
    reported_by_username: str
    admin_notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    alerts: list[AlertItem]
    total: int


class AlertUpdate(BaseModel):
    status: str
    admin_notes: str = ""
