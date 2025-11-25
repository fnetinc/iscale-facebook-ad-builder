import os
import requests
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("VITE_FACEBOOK_ACCESS_TOKEN")
API_VERSION = os.getenv("VITE_FACEBOOK_API_VERSION", "v24.0")

if not ACCESS_TOKEN:
    print("Error: VITE_FACEBOOK_ACCESS_TOKEN not found in .env")
    exit(1)

print(f"Using Token: {ACCESS_TOKEN[:10]}... (Version: {API_VERSION})")

# 1. Test General Marketing API (Ad Accounts)
print("\n--- Testing General Marketing API (Ad Accounts) ---")
url_accounts = f"https://graph.facebook.com/{API_VERSION}/me/adaccounts"
params_accounts = {
    "access_token": ACCESS_TOKEN,
    "fields": "name,account_id",
    "limit": 1
}
try:
    resp = requests.get(url_accounts, params=params_accounts)
    if resp.status_code == 200:
        print("SUCCESS: Can access Ad Accounts.")
        print(resp.json())
    else:
        print(f"FAILURE: Cannot access Ad Accounts. Status: {resp.status_code}")
        print(resp.json())
except Exception as e:
    print(f"Error: {e}")

# 2. Test Ad Library API
print("\n--- Testing Ad Library API ---")
url_library = f"https://graph.facebook.com/{API_VERSION}/ads_archive"
params_library = {
    "access_token": ACCESS_TOKEN,
    "search_terms": "fitness",
    "ad_active_status": "ALL",
    "ad_reached_countries": "['US']",
    "limit": 1
}
try:
    resp = requests.get(url_library, params=params_library)
    if resp.status_code == 200:
        print("SUCCESS: Can access Ad Library.")
    else:
        print(f"FAILURE: Cannot access Ad Library. Status: {resp.status_code}")
        print(resp.json())
except Exception as e:
    print(f"Error: {e}")
