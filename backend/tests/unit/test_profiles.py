"""Customer profile unit tests."""
import pytest
from fastapi import status


class TestProfileCRUD:
    """Tests for customer profile CRUD operations."""

    def test_create_profile(self, client, auth_headers):
        """Test creating a new customer profile."""
        response = client.post(
            "/api/v1/profiles/",
            json={
                "name": "Test Profile",
                "demographics": "Adults 25-45",
                "pain_points": "Time management, productivity",
                "goals": "Work-life balance"
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Test Profile"
        assert "id" in data

    def test_create_profile_minimal(self, client, auth_headers):
        """Test creating profile with minimal data."""
        response = client.post(
            "/api/v1/profiles/",
            json={"name": "Minimal Profile"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK

    def test_create_profile_unauthorized(self, client):
        """Test creating profile without auth returns 401."""
        response = client.post(
            "/api/v1/profiles/",
            json={"name": "Unauthorized Profile"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_profiles(self, client, auth_headers):
        """Test listing profiles."""
        # Create a profile first
        client.post(
            "/api/v1/profiles/",
            json={"name": "List Test Profile"},
            headers=auth_headers
        )

        response = client.get("/api/v1/profiles", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_update_profile(self, client, auth_headers):
        """Test updating a profile."""
        # Create a profile
        create_response = client.post(
            "/api/v1/profiles/",
            json={
                "name": "Original Profile",
                "demographics": "Young adults"
            },
            headers=auth_headers
        )
        profile_id = create_response.json()["id"]

        # Update the profile
        response = client.put(
            f"/api/v1/profiles/{profile_id}",
            json={
                "name": "Updated Profile",
                "demographics": "Middle-aged adults",
                "pain_points": "Added pain points"
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Profile"
        assert data["demographics"] == "Middle-aged adults"

    def test_delete_profile(self, client, auth_headers):
        """Test deleting a profile."""
        # Create a profile
        create_response = client.post(
            "/api/v1/profiles/",
            json={"name": "To Delete Profile"},
            headers=auth_headers
        )
        profile_id = create_response.json()["id"]

        # Delete the profile
        response = client.delete(
            f"/api/v1/profiles/{profile_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK


def make_brand_payload(name):
    """Create a brand payload with required colors."""
    return {
        "name": name,
        "colors": {"primary": "#FF0000", "secondary": "#00FF00", "highlight": "#0000FF"},
        "voice": "Professional",
        "products": [],
        "profileIds": []
    }


class TestProfileBrandAssociation:
    """Tests for profile-brand many-to-many relationship."""

    @pytest.fixture
    def test_brand(self, client, auth_headers):
        """Create a test brand."""
        response = client.post(
            "/api/v1/brands/",
            json=make_brand_payload("Profile Assoc Test Brand"),
            headers=auth_headers
        )
        return response.json()

    @pytest.fixture
    def test_profile(self, client, auth_headers):
        """Create a test profile."""
        response = client.post(
            "/api/v1/profiles/",
            json={"name": "Profile Assoc Test Profile"},
            headers=auth_headers
        )
        return response.json()

    def test_associate_profile_with_brand(self, client, auth_headers, test_brand, test_profile):
        """Test associating a profile with a brand."""
        # Update brand with profile association
        payload = make_brand_payload(test_brand["name"])
        payload["profileIds"] = [test_profile["id"]]

        response = client.put(
            f"/api/v1/brands/{test_brand['id']}",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
