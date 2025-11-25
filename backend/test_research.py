from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

def test_search_ads():
    response = client.post("/api/research/search", json={
        "query": "fitness",
        "platform": "facebook",
        "limit": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert "fitness" in data[0]["brand_name"] or "fitness" in data[0]["ad_copy"]

def test_get_history():
    # First search and save an ad (mocking save by just searching for now as save needs an ad object)
    # Actually, let's just check if history returns a list (might be empty initially)
    response = client.get("/api/research/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_save_ad():
    # Create a mock ad to save
    ad_data = {
        "brand_name": "Test Brand",
        "ad_copy": "Test Copy",
        "video_url": "http://example.com/video.mp4",
        "platform": "facebook"
    }
    response = client.post("/api/research/save", json=ad_data)
    assert response.status_code == 200
    data = response.json()
    assert data["brand_name"] == "Test Brand"
    assert "id" in data

    # Verify it's in history
    response = client.get("/api/research/history")
    history = response.json()
    assert len(history) > 0
    assert history[0]["brand_name"] == "Test Brand"
