import httpx as requests
import uuid
import json
import sys

BASE_URL = "http://localhost:8000/api"

def print_step(step):
    print(f"\n=== {step} ===")

def test_api():
    # 1. Create a Brand
    print_step("1. Create Brand")
    brand_id = str(uuid.uuid4())
    brand_data = {
        "id": brand_id,
        "name": "Test Brand",
        "logo": "http://example.com/logo.png",
        "voice": "Professional",
        "colors": {
            "primary": "#000000",
            "secondary": "#ffffff",
            "highlight": "#ff0000"
        },
        "products": [],
        "profileIds": []
    }
    
    response = requests.post(f"{BASE_URL}/brands/", json=brand_data)
    if response.status_code != 200:
        print(f"Failed to create brand: {response.text}")
        sys.exit(1)
    print("Brand created successfully")
    
    # 2. Create a Customer Profile
    print_step("2. Create Customer Profile")
    profile_id = str(uuid.uuid4())
    profile_data = {
        "id": profile_id,
        "name": "Test Profile",
        "demographics": "25-34 Male",
        "painPoints": "Lack of time",
        "goals": "Save time"
    }
    
    response = requests.post(f"{BASE_URL}/profiles/", json=profile_data)
    if response.status_code != 200:
        print(f"Failed to create profile: {response.text}")
        sys.exit(1)
    print("Profile created successfully")

    # 3. Update Brand (Add Product + Link Profile)
    print_step("3. Update Brand (Add Product + Link Profile)")
    product_id = str(uuid.uuid4())
    update_data = {
        "id": brand_id,
        "name": "Test Brand Updated",
        "logo": "http://example.com/logo.png",
        "voice": "Casual",
        "colors": {
            "primary": "#000000",
            "secondary": "#ffffff",
            "highlight": "#00ff00"
        },
        "products": [
            {
                "id": product_id,
                "name": "Test Product",
                "description": "A great product"
            }
        ],
        "profileIds": [profile_id]
    }
    
    response = requests.put(f"{BASE_URL}/brands/{brand_id}", json=update_data)
    if response.status_code != 200:
        print(f"Failed to update brand: {response.text}")
        sys.exit(1)
    
    updated_brand = response.json()
    # Verify updates
    if "colors" not in updated_brand or "primary" not in updated_brand["colors"]:
        print("Brand colors not returned correctly")
        sys.exit(1)
    if updated_brand["name"] != "Test Brand Updated":
        print("Brand name not updated")
        sys.exit(1)
    # Check products
    if len(updated_brand["products"]) != 1:
        print(f"Product not added. Got {len(updated_brand['products'])} products")
        sys.exit(1)
    if updated_brand["products"][0]["name"] != "Test Product":
        print("Product name incorrect")
        sys.exit(1)
    
    print("Brand updated successfully")

    # 4. Verify Relationships
    print_step("4. Verify Relationships")
    response = requests.get(f"{BASE_URL}/brands/")
    brands = response.json()
    target_brand = next((b for b in brands if b["id"] == brand_id), None)
    if not target_brand:
        print("Brand not found in list")
        sys.exit(1)
    
    # 5. Delete Brand
    print_step("5. Delete Brand")
    response = requests.delete(f"{BASE_URL}/brands/{brand_id}")
    if response.status_code != 200:
        print(f"Failed to delete brand: {response.text}")
        sys.exit(1)
    print("Brand deleted successfully")

    # 6. Delete Profile
    print_step("6. Delete Profile")
    response = requests.delete(f"{BASE_URL}/profiles/{profile_id}")
    if response.status_code != 200:
        print(f"Failed to delete profile: {response.text}")
        sys.exit(1)
    print("Profile deleted successfully")

    print("\n=== ALL TESTS PASSED ===")

if __name__ == "__main__":
    try:
        test_api()
    except requests.RequestError:
        print("Error: Could not connect to backend. Is it running on localhost:8000?")
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
