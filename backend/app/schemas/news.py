from pydantic import BaseModel
from datetime import datetime


class ScrapeRequest(BaseModel):
    url: str


class ArticleResult(BaseModel):
    title: str
    url: str
    sentiment: str
    score: float
    is_harmful: bool
    harm_reason: str = ""
    trust_score: float = 85.0
    trust_classification: str = "Credible"
    fake_reason: str = ""


class ScrapeResponse(BaseModel):
    articles: list[ArticleResult]
    total: int


class NewsHistoryItem(BaseModel):
    id: int
    title: str
    source_url: str
    content: str = ""
    sentiment: str
    sentiment_score: float
    is_harmful: bool
    trust_score: float = 85.0
    trust_classification: str = "Credible"
    fake_reason: str = ""
    created_at: datetime

    class Config:
        from_attributes = True


class NewsHistoryResponse(BaseModel):
    items: list[NewsHistoryItem]
    total: int
