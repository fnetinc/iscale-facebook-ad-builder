from sqlalchemy.orm import Session
from app.models import ScrapedAd
from app.schemas.research import AdSearchRequest, ScrapedAdCreate
import uuid
import random

from datetime import datetime

class ResearchService:
    def __init__(self, db: Session):
        self.db = db

    def search_ads(self, request: AdSearchRequest):
        # Use the real scraper
        from app.services.scraper import scraper
        import asyncio
        
        # Since we are in a sync context (FastAPI default), we need to run the async scraper
        # This is a bit hacky for FastAPI, ideally the controller should be async.
        # But for now, let's try to run it.
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
            # We are likely in a uvicorn worker which has a running loop
            # We cannot use run_until_complete here easily without nesting loops
            # So we should make the controller async.
            # For now, let's return a message or try to use a thread.
            pass

        # BETTER APPROACH: Make the service method async and update the controller
        # But to minimize changes, let's assume we can update the controller.
        pass 
        
    async def search_ads_async(self, request: AdSearchRequest):
        from app.services.scraper import scraper
        return await scraper.search_ads(request.query, request.limit)

    def get_history(self):
        return self.db.query(ScrapedAd).order_by(ScrapedAd.created_at.desc()).all()

    def save_ad(self, ad_data: ScrapedAdCreate):
        db_ad = ScrapedAd(**ad_data.dict())
        self.db.add(db_ad)
        self.db.commit()
        self.db.refresh(db_ad)
        return db_ad
