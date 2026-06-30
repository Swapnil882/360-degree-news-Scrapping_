from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SourceBase(BaseModel):
    name: str
    url: str
    category: str = "general"
    is_active: bool = True
    frequency: str = "daily"

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    frequency: Optional[str] = None

class SourceResponse(SourceBase):
    id: int
    created_at: datetime
    last_scraped_at: Optional[datetime] = None

    class Config:
        from_attributes = True
