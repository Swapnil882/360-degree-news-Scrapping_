from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_articles: int
    harmful_count: int
    pending_alerts: int
    total_users: int = 0
    sentiment_labels: list[str]
    sentiment_counts: list[int]
