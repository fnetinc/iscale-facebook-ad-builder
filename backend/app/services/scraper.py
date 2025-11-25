from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import asyncio
import urllib.parse
from app.schemas.research import ScrapedAdCreate
import uuid
from datetime import datetime

class FacebookAdScraper:
    def __init__(self):
        self.base_url = "https://www.facebook.com/ads/library/"

    async def search_ads(self, query: str, limit: int = 10):
        ads = []
        async with async_playwright() as p:
            # Launch browser (headless=True for server environment)
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = await context.new_page()

            # Construct URL
            # q=query, active_status=all, ad_type=all, country=US, media_type=all
            params = {
                "active_status": "all",
                "ad_type": "all",
                "country": "US",
                "q": query,
                "sort_data[direction]": "desc",
                "sort_data[mode]": "relevancy_monthly_grouped",
                "media_type": "all"
            }
            url = f"{self.base_url}?{urllib.parse.urlencode(params)}"
            
            print(f"Scraping URL: {url}")
            
            try:
                await page.goto(url, timeout=60000)
                await page.wait_for_load_state("networkidle")
                
                # Wait for ad cards to appear
                # Facebook Ad Library uses dynamic classes, but usually has some identifiable structure
                # We might need to wait for a specific element or just wait a bit
                await page.wait_for_timeout(5000) 

                # Scroll down to load more ads if needed
                for _ in range(max(1, limit // 10)):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(2000)

                content = await page.content()
                soup = BeautifulSoup(content, 'lxml')
                
                # Parse ads
                # Note: Class names are obfuscated (e.g., x1n2onr6), so we rely on structure or attributes if possible.
                # This is fragile and might need updates.
                
                # Strategy: Look for the main grid container or individual ad containers
                # Often ads are in divs with role="article" or specific aria-labels
                
                # Let's try to find all text content first to verify we got something
                # For a robust scraper, we'd need to inspect the current DOM structure.
                # Since I can't interactively inspect, I'll try a generic approach looking for common containers.
                
                # Fallback: Return a "Scraped but parsing failed" if we can't find specific elements,
                # but let's try to find ad containers.
                
                # 2024 Common Structure: div with role="main" -> div -> div -> div (grid)
                
                # Attempt to find ad cards by looking for "Ad ID" text which is usually present
                ad_cards = soup.find_all('div', string=lambda t: t and "ID:" in t)
                
                print(f"Found {len(ad_cards)} potential ad markers")

                for marker in ad_cards[:limit]:
                    try:
                        # The marker is likely inside the ad card. We need to go up to the container.
                        # The previous attempt stopped too early (at the footer).
                        # Let's try traversing up multiple levels.
                        card = marker
                        for _ in range(6):
                            if card.parent:
                                card = card.parent
                            else:
                                break
                        
                        # DEBUG: Print card structure to help fix selectors
                        # print(f"DEBUG CARD HTML: {card.prettify()[:500]}...")

                        # Extract data
                        # Brand Name: Usually in an h4 or strong tag near the top
                        brand_name = "Unknown Brand"
                        
                        # Strategy 1: Look for profile image alt text (often "Avatar of Brand")
                        profile_img = card.find('img', alt=lambda x: x and "Avatar of" in x)
                        if profile_img:
                            brand_name = profile_img['alt'].replace("Avatar of", "").strip()
                        
                        # Strategy 2: Look for h4 or strong, ignoring "Sponsored"
                        if brand_name == "Unknown Brand":
                            potential_brands = card.find_all(['h4', 'strong', 'span'], string=True)
                            for pb in potential_brands:
                                text = pb.get_text(strip=True)
                                if (text and 
                                    text not in ["Sponsored", "Active", "Inactive"] and 
                                    not text.startswith("Library ID") and 
                                    len(text) > 2 and len(text) < 50):
                                    brand_name = text
                                    break
                        
                        # Ad Copy: Text content in the body
                        # Look for a div with style="white-space: pre-wrap;" or similar
                        ad_copy = "No copy found"
                        copy_el = card.find('div', style=lambda s: s and 'white-space: pre-wrap' in s)
                        if not copy_el:
                             # Fallback: look for generic text container that isn't the header or footer
                             # This is hard without specific classes.
                             pass

                        if copy_el:
                            ad_copy = copy_el.get_text(strip=True)
                        
                        # Media: Image or Video
                        video_url = None
                        image_url = None
                        
                        video_el = card.find('video')
                        if video_el and video_el.get('src'):
                            video_url = video_el.get('src')
                        
                        img_el = card.find('img')
                        if img_el and img_el.get('src'):
                            image_url = img_el.get('src')
                            
                        # CTA
                        cta_text = "Learn More" # Default
                        
                        # Create Ad Object
                        ad = ScrapedAdCreate(
                            brand_name=brand_name,
                            ad_copy=ad_copy[:500], # Truncate for safety
                            video_url=video_url,
                            image_url=image_url,
                            cta_text=cta_text,
                            platform="facebook",
                            external_id=marker.get_text(strip=True).replace("ID:", "").strip(),
                            analysis={}
                        )
                        ads.append(ad)
                        
                    except Exception as e:
                        print(f"Error parsing ad card: {e}")
                        continue

            except Exception as e:
                print(f"Scraping error: {e}")
            finally:
                await browser.close()
        
        return ads

# Singleton instance
scraper = FacebookAdScraper()
