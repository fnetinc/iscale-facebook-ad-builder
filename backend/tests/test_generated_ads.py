"""Tests for generated ads API with video support."""
import pytest
from unittest.mock import MagicMock, patch


class TestGeneratedAdsAPI:
    """Tests for /api/v1/generated-ads endpoint."""

    def test_get_generated_ads_empty(self, client, auth_headers):
        """Test getting ads when none exist."""
        response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_batch_save_image_ads(self, client, auth_headers, db_session):
        """Test batch saving image ads."""
        ads_data = {
            "ads": [
                {
                    "id": "test_ad_1",
                    "imageUrl": "https://example.com/image1.png",
                    "headline": "Test Headline 1",
                    "body": "Test body text",
                    "cta": "SHOP_NOW",
                    "sizeName": "Square",
                    "dimensions": "1080x1080",
                    "adBundleId": "bundle_123"
                },
                {
                    "id": "test_ad_2",
                    "imageUrl": "https://example.com/image2.png",
                    "headline": "Test Headline 2",
                    "body": "Another body",
                    "cta": "LEARN_MORE",
                    "sizeName": "Portrait",
                    "dimensions": "1080x1350",
                    "adBundleId": "bundle_123"
                }
            ]
        }

        response = client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2

        # Verify ads can be retrieved
        get_response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        ads = get_response.json()
        assert len(ads) == 2

    def test_batch_save_video_ads(self, client, auth_headers, db_session):
        """Test batch saving video ads with video fields."""
        ads_data = {
            "ads": [
                {
                    "id": "video_ad_1",
                    "mediaType": "video",
                    "videoUrl": "https://example.com/video1.mp4",
                    "videoId": "fb_video_123",
                    "thumbnailUrl": "https://example.com/thumb1.jpg",
                    "headline": "Video Ad Headline",
                    "body": "Video ad body text",
                    "cta": "WATCH_MORE",
                    "sizeName": "Square",
                    "dimensions": "1080x1080",
                    "adBundleId": "video_bundle_1"
                }
            ]
        }

        response = client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["count"] == 1

        # Verify video fields are returned
        get_response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        ads = get_response.json()
        assert len(ads) == 1

        video_ad = ads[0]
        assert video_ad["media_type"] == "video"
        assert video_ad["video_url"] == "https://example.com/video1.mp4"
        assert video_ad["video_id"] == "fb_video_123"
        assert video_ad["thumbnail_url"] == "https://example.com/thumb1.jpg"

    def test_batch_save_mixed_media(self, client, auth_headers, db_session):
        """Test batch saving both image and video ads."""
        ads_data = {
            "ads": [
                {
                    "id": "image_ad_mixed",
                    "mediaType": "image",
                    "imageUrl": "https://example.com/image.png",
                    "headline": "Image Ad",
                    "body": "Image body",
                    "cta": "SHOP_NOW",
                    "adBundleId": "mixed_bundle"
                },
                {
                    "id": "video_ad_mixed",
                    "mediaType": "video",
                    "videoUrl": "https://example.com/video.mp4",
                    "videoId": "fb_vid_456",
                    "thumbnailUrl": "https://example.com/thumb.jpg",
                    "headline": "Video Ad",
                    "body": "Video body",
                    "cta": "WATCH_MORE",
                    "adBundleId": "mixed_bundle"
                }
            ]
        }

        response = client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["count"] == 2

        # Verify both types are returned correctly
        get_response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )
        ads = get_response.json()

        image_ads = [a for a in ads if a["media_type"] == "image"]
        video_ads = [a for a in ads if a["media_type"] == "video"]

        assert len(image_ads) == 1
        assert len(video_ads) == 1

    def test_delete_generated_ad(self, client, auth_headers, db_session):
        """Test deleting a generated ad."""
        # First create an ad
        ads_data = {
            "ads": [{
                "id": "delete_me",
                "imageUrl": "https://example.com/image.png",
                "headline": "To Delete",
                "body": "Delete body",
                "cta": "SHOP_NOW"
            }]
        }

        client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        # Now delete it
        delete_response = client.delete(
            "/api/v1/generated-ads/delete_me",
            headers=auth_headers
        )

        assert delete_response.status_code == 200

        # Verify it's gone
        get_response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )
        ads = get_response.json()
        assert len(ads) == 0

    def test_delete_nonexistent_ad(self, client, auth_headers):
        """Test deleting an ad that doesn't exist."""
        response = client.delete(
            "/api/v1/generated-ads/nonexistent_id",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_export_csv_with_video_fields(self, client, auth_headers, db_session):
        """Test CSV export includes video fields."""
        # Create mixed ads
        ads_data = {
            "ads": [
                {
                    "id": "csv_image",
                    "mediaType": "image",
                    "imageUrl": "https://example.com/image.png",
                    "headline": "CSV Image",
                    "body": "Body",
                    "cta": "SHOP_NOW"
                },
                {
                    "id": "csv_video",
                    "mediaType": "video",
                    "videoUrl": "https://example.com/video.mp4",
                    "videoId": "fb_csv_vid",
                    "thumbnailUrl": "https://example.com/thumb.jpg",
                    "headline": "CSV Video",
                    "body": "Body",
                    "cta": "WATCH_MORE"
                }
            ]
        }

        client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        # Export to CSV
        export_response = client.post(
            "/api/v1/generated-ads/export-csv",
            json={"ids": ["csv_image", "csv_video"]},
            headers=auth_headers
        )

        assert export_response.status_code == 200
        assert export_response.headers["content-type"] == "text/csv; charset=utf-8"

        # Check CSV content includes video fields
        csv_content = export_response.text
        assert "Media Type" in csv_content
        assert "Video URL" in csv_content
        assert "Video ID" in csv_content
        assert "Thumbnail URL" in csv_content
        assert "video" in csv_content
        assert "fb_csv_vid" in csv_content

    def test_default_media_type_is_image(self, client, auth_headers, db_session):
        """Test that ads without mediaType default to 'image'."""
        ads_data = {
            "ads": [{
                "id": "default_type_ad",
                "imageUrl": "https://example.com/image.png",
                "headline": "No Type Set",
                "body": "Body",
                "cta": "SHOP_NOW"
            }]
        }

        client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        get_response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )
        ads = get_response.json()

        assert len(ads) == 1
        assert ads[0]["media_type"] == "image"

    def test_filter_by_brand(self, client, auth_headers, db_session):
        """Test filtering generated ads by brand_id."""
        from app.models import Brand

        # Create a brand
        brand = Brand(id="test_brand_1", name="Test Brand")
        db_session.add(brand)
        db_session.commit()

        # Create ads with and without brand
        ads_data = {
            "ads": [
                {
                    "id": "branded_ad",
                    "brandId": "test_brand_1",
                    "imageUrl": "https://example.com/image.png",
                    "headline": "Branded",
                    "body": "Body",
                    "cta": "SHOP_NOW"
                },
                {
                    "id": "unbranded_ad",
                    "imageUrl": "https://example.com/image2.png",
                    "headline": "Unbranded",
                    "body": "Body",
                    "cta": "SHOP_NOW"
                }
            ]
        }

        client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        # Filter by brand
        response = client.get(
            "/api/v1/generated-ads?brand_id=test_brand_1",
            headers=auth_headers
        )

        assert response.status_code == 200
        ads = response.json()
        assert len(ads) == 1
        assert ads[0]["id"] == "branded_ad"

    def test_skip_duplicate_ads(self, client, auth_headers, db_session):
        """Test that duplicate ad IDs are skipped."""
        ads_data = {
            "ads": [{
                "id": "dupe_ad",
                "imageUrl": "https://example.com/image.png",
                "headline": "Original",
                "body": "Body",
                "cta": "SHOP_NOW"
            }]
        }

        # First save
        client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        # Try to save same ID again
        ads_data["ads"][0]["headline"] = "Duplicate"
        response = client.post(
            "/api/v1/generated-ads/batch",
            json=ads_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["count"] == 0  # No new ads saved

        # Verify original wasn't overwritten
        get_response = client.get(
            "/api/v1/generated-ads",
            headers=auth_headers
        )
        ads = get_response.json()
        assert len(ads) == 1
        assert ads[0]["headline"] == "Original"
