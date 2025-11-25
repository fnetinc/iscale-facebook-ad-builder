import os
import time
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

FAL_KEY = os.getenv("FAL_AI_API_KEY")

if not FAL_KEY:
    print("❌ FAL_AI_API_KEY is missing in .env")
    exit(1)

print(f"✅ Found FAL_AI_API_KEY: {FAL_KEY[:5]}...")

def test_fal():
    print("🚀 Starting Fal.ai test...")
    url = "https://queue.fal.run/fal-ai/flux-pro/kontext/max/text-to-image"
    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": "A cute cat coding on a laptop, cartoon style",
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": True
    }

    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=30.0)
        
        if response.status_code != 200:
            print(f"API Request Failed: {response.status_code} - {response.text}")
            return

        data = response.json()
        print(f"✅ Request submitted. Full Response: {json.dumps(data, indent=2)}")

        request_id = data.get("request_id")
        if not request_id:
            print("❌ No request_id returned")
            return

        status = "IN_QUEUE"
        status_url = f"https://queue.fal.run/fal-ai/flux-pro/kontext/max/text-to-image/requests/{request_id}"

        while status not in ["COMPLETED", "FAILED"]:
            time.sleep(1)
            status_res = httpx.get(status_url, headers={"Authorization": f"Key {FAL_KEY}"}, timeout=30.0)
            status_data = status_res.json()
            status = status_data.get("status")
            print(f"Status: {status}")

            if status == "FAILED":
                print(f"❌ Generation failed: {status_data.get('error')}")
                return

            if status == "COMPLETED":
                print("✅ Generation successful!")
                images = status_data.get("images", [])
                if images:
                    print(f"Image URL: {images[0].get('url')}")
                return

    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_fal()
