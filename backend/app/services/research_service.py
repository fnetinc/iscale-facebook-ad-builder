from sqlalchemy.orm import Session
from app.models import ScrapedAd
from app.schemas.research import AdSearchRequest, ScrapedAdCreate
from typing import Optional
import uuid
import httpx
import os
from datetime import datetime
from app.core.config import settings


class ResearchService:
    def __init__(self, db: Session):
        self.db = db

    async def search_ads_async(self, request: AdSearchRequest):
        from app.services.scraper import scraper
        return await scraper.search_ads(
            request.query,
            request.limit,
            request.country,
            request.offset,
            request.exclude_ids
        )

    def get_history(self):
        return self.db.query(ScrapedAd).order_by(ScrapedAd.created_at.desc()).all()

    async def save_ad_async(self, ad_data: ScrapedAdCreate):
        """Save ad with media download to R2 storage"""
        ad_dict = ad_data.dict()

        # Download and store media if URL is a Facebook CDN URL
        if ad_dict.get('image_url'):
            stored_url = await self._download_and_store_media(ad_dict['image_url'])
            if stored_url:
                ad_dict['image_url'] = stored_url

        db_ad = ScrapedAd(**ad_dict)
        self.db.add(db_ad)
        self.db.commit()
        self.db.refresh(db_ad)
        return db_ad

    async def _download_and_store_media(self, url: str) -> Optional[str]:
        """Download media from URL and upload to R2, return new URL"""
        # Only process Facebook CDN URLs
        if not url or 'fbcdn' not in url:
            return url

        try:
            # Determine file type from URL
            is_video = 'video' in url or '.mp4' in url
            extension = '.mp4' if is_video else '.jpg'
            content_type = 'video/mp4' if is_video else 'image/jpeg'

            # Download the file
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    print(f"Failed to download media: {response.status_code}")
                    return url  # Return original URL on failure

                file_content = response.content

                # Check file size (500MB limit for video, 10MB for image)
                max_size = 500 * 1024 * 1024 if is_video else 10 * 1024 * 1024
                if len(file_content) > max_size:
                    print(f"File too large: {len(file_content)} bytes")
                    return url

                # Generate filename
                filename = f"research/{uuid.uuid4()}{extension}"

                # Upload to R2 if configured
                if settings.r2_enabled:
                    return await self._upload_to_r2(file_content, filename, content_type)
                else:
                    return await self._upload_to_local(file_content, filename)

        except Exception as e:
            print(f"Error downloading/storing media: {e}")
            return url  # Return original URL on failure

    async def _upload_to_r2(self, content: bytes, filename: str, content_type: str) -> str:
        """Upload to Cloudflare R2"""
        import boto3

        client = boto3.client(
            's3',
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )

        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=filename,
            Body=content,
            ContentType=content_type
        )

        return f"{settings.R2_PUBLIC_URL}/{filename}"

    async def _upload_to_local(self, content: bytes, filename: str) -> str:
        """Upload to local filesystem"""
        from pathlib import Path

        upload_dir = Path(__file__).parent.parent.parent / "uploads" / "research"
        upload_dir.mkdir(parents=True, exist_ok=True)

        file_path = upload_dir / os.path.basename(filename)
        with open(file_path, "wb") as f:
            f.write(content)

        return f"/uploads/research/{os.path.basename(filename)}"
