"""Brand management unit tests."""
import pytest
from fastapi import status


class TestBrandCRUD:
    """Tests for brand CRUD operations."""

    def test_create_brand(self, client, auth_headers):
        """Test creating a new brand."""
        response = client.post(
            "/api/v1/brands/",
            json={
                "name": "Test Brand",
                "primary_color": "#FF0000",
                "secondary_color": "#00FF00",
                "highlight_color": "#0000FF",
                "voice": "Professional and friendly"
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Test Brand"
        assert data["primary_color"] == "#FF0000"
        assert "id" in data

    def test_create_brand_with_products(self, client, auth_headers):
        """Test creating a brand with products."""
        response = client.post(
            "/api/v1/brands/",
            json={
                "name": "Brand With Products",
                "primary_color": "#FF0000",
                "products": [
                    {
                        "name": "Product 1",
                        "description": "First product"
                    },
                    {
                        "name": "Product 2",
                        "description": "Second product"
                    }
                ]
            },
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data.get("products", [])) == 2

    def test_create_brand_unauthorized(self, client):
        """Test creating brand without auth returns 401."""
        response = client.post(
            "/api/v1/brands/",
            json={"name": "Unauthorized Brand"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_brands(self, client, auth_headers):
        """Test listing brands."""
        # Create a brand first
        client.post(
            "/api/v1/brands/",
            json={"name": "List Test Brand"},
            headers=auth_headers
        )

        response = client.get("/api/v1/brands", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_update_brand(self, client, auth_headers):
        """Test updating a brand."""
        # Create a brand
        create_response = client.post(
            "/api/v1/brands/",
            json={"name": "Original Name", "primary_color": "#000000"},
            headers=auth_headers
        )
        brand_id = create_response.json()["id"]

        # Update the brand
        response = client.put(
            f"/api/v1/brands/{brand_id}",
            json={"name": "Updated Name", "primary_color": "#FFFFFF"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["primary_color"] == "#FFFFFF"

    def test_delete_brand(self, client, auth_headers):
        """Test deleting a brand."""
        # Create a brand
        create_response = client.post(
            "/api/v1/brands/",
            json={"name": "To Delete"},
            headers=auth_headers
        )
        brand_id = create_response.json()["id"]

        # Delete the brand
        response = client.delete(
            f"/api/v1/brands/{brand_id}",
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_200_OK

        # Verify it's gone
        list_response = client.get("/api/v1/brands", headers=auth_headers)
        brand_ids = [b["id"] for b in list_response.json()]
        assert brand_id not in brand_ids

    def test_delete_brand_cascades_products(self, client, auth_headers, db_session):
        """Test that deleting a brand cascades to products."""
        # Create brand with products
        create_response = client.post(
            "/api/v1/brands/",
            json={
                "name": "Brand To Cascade",
                "products": [{"name": "Cascade Product", "description": "Will be deleted"}]
            },
            headers=auth_headers
        )
        brand_id = create_response.json()["id"]

        # Delete the brand
        client.delete(f"/api/v1/brands/{brand_id}", headers=auth_headers)

        # Products should also be gone
        from app.models import Product
        products = db_session.query(Product).filter(Product.brand_id == brand_id).all()
        assert len(products) == 0

    def test_brand_validation_missing_name(self, client, auth_headers):
        """Test brand creation fails without name."""
        response = client.post(
            "/api/v1/brands/",
            json={"primary_color": "#FF0000"},
            headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
