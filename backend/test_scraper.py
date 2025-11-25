import asyncio
from app.services.scraper import scraper

async def test_scraper():
    print("Starting scraper test...")
    query = "fitness"
    try:
        ads = await scraper.search_ads(query, limit=5)
        print(f"Found {len(ads)} ads.")
        for ad in ads:
            print(f"Brand: {ad.brand_name}")
            print(f"ID: {ad.external_id}")
            print(f"Copy: {ad.ad_copy[:50]}...")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_scraper())
