"""
Facebook Ads Library API Client

Uses the official Meta Ads Library API for more reliable ad research.
API Docs: https://www.facebook.com/ads/library/api/

Note: The API has limitations:
- Full access requires ID verification for political/social issue ads
- Non-political ads may have limited data
- Access token required (from Facebook App)
"""

import httpx
import os
from typing import List, Optional
from app.schemas.research import ScrapedAdCreate
from datetime import datetime


class FacebookAdsLibraryAPI:
    """Official Facebook Ads Library API client."""

    def __init__(self):
        self.base_url = "https://graph.facebook.com/v21.0/ads_archive"
        self.access_token = os.getenv("FACEBOOK_ADS_LIBRARY_TOKEN") or os.getenv("VITE_FACEBOOK_ACCESS_TOKEN")

    async def search_ads(self, query: str, limit: int = 10, country: str = "US", offset: int = 0, exclude_ids: List[str] = None) -> List[ScrapedAdCreate]:
        """
        Search Facebook Ads Library using Playwright scraper.

        The official API doesn't return media URLs (only iframe preview URLs),
        so we always use the Playwright scraper which intercepts network requests
        to capture actual CDN media URLs.

        Args:
            query: Search term (brand name, keyword, etc.)
            limit: Maximum number of ads to return
            country: Country code for ad_reached_countries
            offset: Number of "pages" to skip (controls scroll depth)
            exclude_ids: List of ad IDs to exclude (already fetched)

        Returns:
            List of ScrapedAdCreate objects
        """
        # Always use Playwright scraper to get actual media URLs
        # The official API only returns ad_snapshot_url (iframe) which can't be embedded
        print(f"Searching Facebook Ads Library for '{query}' in {country} (offset={offset})")
        return await self._fallback_search(query, limit, country, offset, exclude_ids or [])

    def _parse_api_ad(self, ad_data: dict) -> Optional[ScrapedAdCreate]:
        """Parse an ad from the API response into our schema."""

        # Get ad copy from various fields
        ad_copy = None
        if ad_data.get("ad_creative_bodies"):
            ad_copy = ad_data["ad_creative_bodies"][0] if isinstance(ad_data["ad_creative_bodies"], list) else ad_data["ad_creative_bodies"]

        # Get headline/title
        headline = None
        if ad_data.get("ad_creative_link_titles"):
            titles = ad_data["ad_creative_link_titles"]
            headline = titles[0] if isinstance(titles, list) else titles

        # Combine copy with headline if available
        full_copy = ad_copy or ""
        if headline and headline != ad_copy:
            full_copy = f"{headline}\n\n{full_copy}" if full_copy else headline

        # Get CTA from link caption
        cta_text = "Learn More"
        if ad_data.get("ad_creative_link_captions"):
            captions = ad_data["ad_creative_link_captions"]
            cta_text = captions[0] if isinstance(captions, list) else captions

        # The API doesn't return media URLs directly, but provides snapshot URL
        snapshot_url = ad_data.get("ad_snapshot_url")

        # Build analysis data with available metrics
        analysis = {}
        if ad_data.get("impressions"):
            imp = ad_data["impressions"]
            if isinstance(imp, dict):
                analysis["impressions_lower"] = imp.get("lower_bound")
                analysis["impressions_upper"] = imp.get("upper_bound")
        if ad_data.get("spend"):
            spend = ad_data["spend"]
            if isinstance(spend, dict):
                analysis["spend_lower"] = spend.get("lower_bound")
                analysis["spend_upper"] = spend.get("upper_bound")
                analysis["currency"] = ad_data.get("currency")
        if ad_data.get("publisher_platforms"):
            analysis["platforms"] = ad_data["publisher_platforms"]
        if ad_data.get("ad_delivery_start_time"):
            analysis["start_date"] = ad_data["ad_delivery_start_time"]

        # Build the public Facebook Ads Library URL for this ad
        ad_id = ad_data.get("id")
        fb_library_url = f"https://www.facebook.com/ads/library/?id={ad_id}" if ad_id else None

        # ad_snapshot_url is an iframe-embeddable URL that shows the actual ad creative
        snapshot_url = ad_data.get("ad_snapshot_url")

        return ScrapedAdCreate(
            brand_name=ad_data.get("page_name", "Unknown Brand"),
            ad_copy=full_copy[:500] if full_copy else "No copy available",
            video_url=fb_library_url,  # Use as "View Original" link
            image_url=snapshot_url,  # iframe-embeddable ad preview URL
            cta_text=cta_text,
            platform="facebook",
            external_id=ad_id,
            analysis=analysis if analysis else None
        )

    async def _fallback_search(self, query: str, limit: int, country: str = "US", offset: int = 0, exclude_ids: List[str] = None) -> List[ScrapedAdCreate]:
        """
        Scrape Facebook Ads Library using Playwright.
        Intercepts network requests to capture media URLs and extracts ad data from DOM.

        Args:
            offset: Number of scroll batches to skip before collecting (for pagination)
            exclude_ids: Ad IDs to skip (already fetched in previous requests)
        """
        exclude_ids = set(exclude_ids or [])
        from playwright.async_api import async_playwright
        import urllib.parse
        import json

        ads = []
        captured_images = []  # Store image URLs from network
        captured_videos = []  # Store video URLs from network

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={'width': 1920, 'height': 1080},
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                )
                page = await context.new_page()

                # Intercept network responses to capture media URLs
                async def handle_response(response):
                    try:
                        url = response.url
                        content_type = response.headers.get('content-type', '')

                        # Capture video URLs from Facebook CDN
                        if 'video' in url and 'fbcdn' in url:
                            if url not in captured_videos:
                                captured_videos.append(url)

                        # Capture image URLs from Facebook CDN (scontent = static content)
                        if 'scontent' in url and 'fbcdn' in url:
                            # Skip tiny thumbnails (profile pics, icons)
                            skip_patterns = ['s60x60', 's32x32', 'p50x50', 'p32x32', 's100x100', 'c10.0']
                            is_small = any(p in url for p in skip_patterns)

                            # Skip placeholder images (hads = hosted ads default placeholders)
                            is_placeholder = '/hads-' in url or '/hads/' in url or 'scontent.xx.fbcdn.net' in url

                            # Look for larger images
                            large_patterns = ['p720x720', 'p480x480', 'p320x320', 's720x720', 's480x480',
                                            's320x320', '_n.jpg', '_n.png', '_o.jpg', '_o.png']
                            is_large = any(p in url for p in large_patterns)

                            if is_large and not is_small and not is_placeholder:
                                if url not in captured_images:
                                    captured_images.append(url)
                    except:
                        pass

                page.on('response', handle_response)

                # Construct URL for Facebook Ads Library
                params = {
                    "active_status": "all",
                    "ad_type": "all",
                    "country": country,
                    "q": query,
                    "sort_data[direction]": "desc",
                    "sort_data[mode]": "relevancy_monthly_grouped",
                    "media_type": "all"
                }
                url = f"https://www.facebook.com/ads/library/?{urllib.parse.urlencode(params)}"

                print(f"Scraping: {url}")

                await page.goto(url, timeout=60000, wait_until="domcontentloaded")
                # Wait for ads to load - look for Library ID text
                try:
                    await page.wait_for_selector('text=Library ID:', timeout=15000)
                except:
                    print("No ads found or page didn't load properly")
                await page.wait_for_timeout(3000)

                # Scroll to load more ads and trigger lazy loading
                # offset controls how deep we scroll (for pagination)
                base_scrolls = min(5, (limit // 3) + 1)
                total_scrolls = base_scrolls + (offset * 3)  # Each "page" = 3 more scrolls

                print(f"Scrolling {total_scrolls} times (base={base_scrolls}, offset={offset})")

                for i in range(total_scrolls):
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(1500 if i < base_scrolls else 1000)  # Faster scrolls for pagination

                # Give extra time for images to load
                await page.wait_for_timeout(2000)

                print(f"Network captured: {len(captured_videos)} videos, {len(captured_images)} images")

                # Extract ads using improved JavaScript
                ads_data = await page.evaluate("""
                    () => {
                        const results = [];
                        const seenIds = new Set();

                        // Find all divs that contain "Library ID:"
                        document.querySelectorAll('div').forEach(div => {
                            const text = div.innerText || '';

                            // Must contain Library ID and be reasonable size
                            if (!text.includes('Library ID:') || text.length > 6000 || text.length < 50) return;

                            // Extract Library ID
                            const idMatch = text.match(/Library ID:\\s*(\\d+)/);
                            if (!idMatch) return;

                            const libraryId = idMatch[1];
                            if (seenIds.has(libraryId)) return;
                            seenIds.add(libraryId);

                            // Find brand name from links to page
                            let brandName = 'Unknown Brand';
                            const allLinks = div.querySelectorAll('a');
                            for (const link of allLinks) {
                                const href = link.href || '';
                                const linkText = (link.innerText || '').trim();
                                // Brand links usually contain view_all_page_id or are short text
                                if (linkText && linkText.length > 1 && linkText.length < 60 &&
                                    !linkText.includes('Library ID') &&
                                    !linkText.includes('See ad details') &&
                                    !linkText.includes('About') &&
                                    !linkText.match(/^\\d+$/) &&
                                    !linkText.includes('Active') &&
                                    !linkText.includes('Inactive')) {
                                    brandName = linkText;
                                    break;
                                }
                            }

                            // Find ad copy - look for text blocks
                            let adCopy = '';
                            div.querySelectorAll('span, div').forEach(el => {
                                if (el.children.length > 5) return; // Skip containers
                                const elText = (el.innerText || '').trim();
                                if (elText.length > 30 && elText.length < 1500 &&
                                    !elText.includes('Library ID') &&
                                    !elText.includes('Started running') &&
                                    !elText.includes('About this ad') &&
                                    !elText.includes('See ad details') &&
                                    elText.length > adCopy.length) {
                                    adCopy = elText;
                                }
                            });

                            // Detect if this is a video ad by looking for video indicators
                            let isVideoAd = false;

                            // Check for actual video elements
                            const hasVideoElement = div.querySelector('video') !== null;
                            if (hasVideoElement) isVideoAd = true;

                            // Check for play button SVGs/icons (common in FB video ads)
                            const playIcons = div.querySelectorAll('svg, i, [role="img"]');
                            playIcons.forEach(icon => {
                                const parent = icon.closest('div');
                                if (parent) {
                                    const style = window.getComputedStyle(parent);
                                    // Play buttons are often circular overlays
                                    if (style.borderRadius && parseFloat(style.borderRadius) > 20) {
                                        const html = icon.outerHTML || '';
                                        // Play icon paths typically have triangle shapes
                                        if (html.includes('M8') || html.includes('play') || html.includes('Play')) {
                                            isVideoAd = true;
                                        }
                                    }
                                }
                            });

                            // Check for video duration indicators (e.g., "0:30", "1:15")
                            const durationMatch = text.match(/\\b\\d{1,2}:\\d{2}\\b/);
                            if (durationMatch) isVideoAd = true;

                            // Find video - check video elements
                            let videoUrl = null;
                            div.querySelectorAll('video').forEach(video => {
                                if (videoUrl) return;
                                const src = video.src || video.currentSrc;
                                if (src && src.includes('fbcdn')) {
                                    videoUrl = src;
                                }
                                // Check source elements
                                video.querySelectorAll('source').forEach(source => {
                                    if (!videoUrl && source.src && source.src.includes('fbcdn')) {
                                        videoUrl = source.src;
                                    }
                                });
                            });

                            // Find image - check img elements for CDN URLs
                            let imageUrl = null;
                            div.querySelectorAll('img').forEach(img => {
                                if (imageUrl) return;
                                const src = img.src || '';
                                // Look for scontent URLs that aren't tiny profile pics
                                if (src.includes('scontent') && src.includes('fbcdn')) {
                                    // Skip small thumbnails (profile pics, icons)
                                    const skipPatterns = ['s60x60', 's32x32', 'p50x50', 'p32x32', 's100x100', 'c10.0'];
                                    const isSmall = skipPatterns.some(p => src.includes(p));

                                    // Skip placeholder images (hads-ak = hosted ads default)
                                    const isPlaceholder = src.includes('hads-ak') || src.includes('hads-prn');

                                    // Look for larger ad creative images
                                    const largePatterns = ['p720x720', 'p480x480', 'p320x320', 's720x720',
                                                          's480x480', 's320x320', '_n.', '_o.'];
                                    const isLarge = largePatterns.some(p => src.includes(p)) ||
                                                   img.naturalWidth > 200 || img.width > 200;

                                    if (isLarge && !isSmall && !isPlaceholder) {
                                        imageUrl = src;
                                    }
                                }
                            });

                            // Check background images if no img found
                            if (!imageUrl && !videoUrl) {
                                div.querySelectorAll('div').forEach(bgDiv => {
                                    if (imageUrl) return;
                                    const style = window.getComputedStyle(bgDiv);
                                    const bg = style.backgroundImage;
                                    if (bg && bg !== 'none' && bg.includes('scontent')) {
                                        const match = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
                                        if (match) imageUrl = match[1];
                                    }
                                });
                            }

                            // Extract platforms
                            let platforms = [];
                            if (text.includes('Facebook')) platforms.push('facebook');
                            if (text.includes('Instagram')) platforms.push('instagram');
                            if (text.includes('Messenger')) platforms.push('messenger');
                            if (text.includes('Audience Network')) platforms.push('audience_network');

                            // Extract start date
                            let startDate = null;
                            const dateMatch = text.match(/Started running on\\s+([A-Za-z]+\\s+\\d+,?\\s*\\d*)/);
                            if (dateMatch) startDate = dateMatch[1];

                            // Try to find "See ad details" link which contains the ad_snapshot_url (render_ad)
                            let snapshotUrl = null;
                            div.querySelectorAll('a').forEach(link => {
                                const href = link.href || '';
                                if (href.includes('/ads/archive/render_ad/')) {
                                    snapshotUrl = href;
                                }
                            });

                            results.push({
                                external_id: libraryId,
                                brand_name: brandName,
                                ad_copy: adCopy.substring(0, 500),
                                video_url: videoUrl,
                                image_url: imageUrl,
                                snapshot_url: snapshotUrl,  // iframe-embeddable URL for actual creative
                                is_video: isVideoAd,  // Flag for video ads (even if we only have thumbnail)
                                platforms: platforms,
                                start_date: startDate
                            });
                        });

                        return results;
                    }
                """)

                print(f"Found {len(ads_data)} ads from DOM")

                # Filter out excluded IDs first
                if exclude_ids:
                    ads_data = [ad for ad in ads_data if ad.get('external_id') not in exclude_ids]
                    print(f"After filtering excludes: {len(ads_data)} ads")

                # Assign captured network media to ads that don't have media
                video_idx = 0
                image_idx = 0

                for i, ad_data in enumerate(ads_data[:limit]):
                    try:
                        video_url = ad_data.get('video_url')
                        image_url = ad_data.get('image_url')
                        snapshot_url = ad_data.get('snapshot_url')
                        is_video = ad_data.get('is_video', False)

                        # If no media from DOM, try captured network media
                        if not video_url and not image_url:
                            if video_idx < len(captured_videos):
                                video_url = captured_videos[video_idx]
                                video_idx += 1
                                is_video = True  # Mark as video since we got a video URL
                            elif image_idx < len(captured_images):
                                image_url = captured_images[image_idx]
                                image_idx += 1

                        # Build FB library URL for "View Original"
                        fb_library_url = f"https://www.facebook.com/ads/library/?id={ad_data['external_id']}"

                        analysis = {}
                        if ad_data.get('platforms'):
                            analysis['platforms'] = ad_data['platforms']
                        if ad_data.get('start_date'):
                            analysis['start_date'] = ad_data['start_date']
                        if snapshot_url:
                            analysis['snapshot_url'] = snapshot_url  # Store render_ad URL
                        if is_video:
                            analysis['is_video'] = True  # Flag for frontend to show video indicator

                        # Priority: video_url > image_url > snapshot_url (iframe)
                        # CDN URLs expire but work for immediate viewing
                        # snapshot_url is more reliable but requires iframe
                        final_image_url = video_url or image_url or snapshot_url

                        ad = ScrapedAdCreate(
                            brand_name=ad_data.get('brand_name', 'Unknown Brand'),
                            ad_copy=ad_data.get('ad_copy', 'No copy available')[:500],
                            video_url=fb_library_url,  # Always use library URL for video_url (clickable link)
                            image_url=final_image_url,  # CDN URL or render_ad fallback
                            cta_text="Learn More",
                            platform="facebook",
                            external_id=ad_data['external_id'],
                            analysis=analysis if analysis else None
                        )
                        ads.append(ad)

                    except Exception as e:
                        print(f"Error parsing ad: {e}")
                        continue

                await browser.close()

        except Exception as e:
            print(f"Scraper error: {e}")
            import traceback
            traceback.print_exc()

        return ads


# Singleton instance
scraper = FacebookAdsLibraryAPI()
