from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AdSearchRequest(BaseModel):
    query: str
    platform: str = "facebook"
    limit: int = 10

class ScrapedAdBase(BaseModel):
    brand_name: Optional[str] = None
    ad_copy: Optional[str] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    platform: str = "facebook"
    external_id: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None

class ScrapedAdCreate(ScrapedAdBase):
    pass

class ScrapedAdResponse(ScrapedAdBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
