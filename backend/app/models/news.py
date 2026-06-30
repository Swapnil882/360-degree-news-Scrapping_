from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class ScrapedNews(Base):
    __tablename__ = "scraped_news"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_url = Column(String(2000), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, default="")
    article_url = Column(String(2000), default="")
    sentiment = Column(String(20), default="neutral")
    sentiment_score = Column(Float, default=0.0)
    is_harmful = Column(Boolean, default=False)
    harm_reason = Column(Text, default="")
    trust_score = Column(Float, default=85.0)
    trust_classification = Column(String(50), default="Credible")
    fake_reason = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
