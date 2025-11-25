import os
import requests
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("VITE_FACEBOOK_ACCESS_TOKEN")
API_VERSION = os.getenv("VITE_FACEBOOK_API_VERSION", "v24.0")

if not ACCESS_TOKEN:
    print("Error: VITE_FACEBOOK_ACCESS_TOKEN not found in .env")
    exit(1)

print(f"Testing API access with version {API_VERSION}...")

url = f"https://graph.facebook.com/{API_VERSION}/ads_archive"
params = {
    "access_token": ACCESS_TOKEN,
    "search_terms": "fitness",
    "ad_active_status": "ALL",
    "ad_reached_countries": "['US']",
    "limit": 1
}

try:
    response = requests.get(url, params=params)
    data = response.json()
    
    if response.status_code == 200:
        print("Success! API access verified.")
        print(f"Found {len(data.get('data', []))} ads.")
    else:
        print(f"Error: API request failed with status {response.status_code}")
        print(data)
except Exception as e:
    print(f"Exception occurred: {e}")
