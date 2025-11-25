from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.research import AdSearchRequest, ScrapedAdResponse, ScrapedAdCreate
from app.services.research_service import ResearchService

router = APIRouter()

@router.post("/search", response_model=List[ScrapedAdResponse])
async def search_ads(request: AdSearchRequest, db: Session = Depends(get_db)):
    service = ResearchService(db)
    return await service.search_ads_async(request)

@router.get("/history", response_model=List[ScrapedAdResponse])
def get_history(db: Session = Depends(get_db)):
    service = ResearchService(db)
    return service.get_history()

@router.post("/save", response_model=ScrapedAdResponse)
def save_ad(ad: ScrapedAdCreate, db: Session = Depends(get_db)):
    service = ResearchService(db)
    return service.save_ad(ad)
