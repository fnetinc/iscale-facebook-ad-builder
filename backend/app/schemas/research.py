from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AdSearchRequest(BaseModel):
    query: str
    platform: str = "facebook"
    limit: int = 10
    country: str = "US"
    offset: int = 0  # Pagination: controls scroll depth
    exclude_ids: List[str] = []  # IDs to skip (already fetched)

class ScrapedAdBase(BaseModel):
    brand_name: Optional[str] = None
    ad_copy: Optional[str] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    platform: str = "facebook"
    external_id: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None  # Stores impressions, spend, platforms, etc.

class ScrapedAdCreate(ScrapedAdBase):
    pass

# For search results (not saved to DB yet)
class ScrapedAdSearchResult(ScrapedAdBase):
    pass

class ScrapedAdResponse(ScrapedAdBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
