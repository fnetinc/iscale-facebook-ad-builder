import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("VITE_FACEBOOK_ACCESS_TOKEN")
PAGE_ID = '800264876172017' # The ID from the logs

if not ACCESS_TOKEN:
    print("❌ VITE_FACEBOOK_ACCESS_TOKEN is missing in .env")
    exit(1)

def verify_page():
    print(f"Verifying Page ID: {PAGE_ID}")
    
    url = f"https://graph.facebook.com/v24.0/{PAGE_ID}"
    params = {
        "fields": "name,access_token,tasks,is_published",
        "access_token": ACCESS_TOKEN
    }

    try:
        response = httpx.get(url, params=params, timeout=30.0)
        data = response.json()

        if "error" in data:
            print(f"Error fetching page: {json.dumps(data['error'], indent=2)}")
            return

        print("Page Details:")
        print(f"- Name: {data.get('name')}")
        print(f"- Published: {data.get('is_published')}")
        print(f"- Tasks: {json.dumps(data.get('tasks'))}")
        print(f"- Has Access Token: {bool(data.get('access_token'))}")

        tasks = data.get("tasks", [])
        if not tasks or "ADVERTISE" not in tasks:
            print("WARNING: User does not have ADVERTISE permission on this page!")
        else:
            print("SUCCESS: User has ADVERTISE permission.")

    except Exception as e:
        print(f"Script error: {e}")

if __name__ == "__main__":
    verify_page()
