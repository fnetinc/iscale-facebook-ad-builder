// Facebook Marketing API Integration Service

const API_VERSION = import.meta.env.VITE_FACEBOOK_API_VERSION || 'v24.0';
const ACCESS_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
const AD_ACCOUNT_ID = import.meta.env.VITE_FACEBOOK_AD_ACCOUNT_ID;

const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Get all ad accounts accessible by the access token
 */
export async function getAdAccounts() {
    try {
        let allAccounts = [];
        let url = `${BASE_URL}/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name,balance,amount_spent,spend_cap,business_name,funding_source_details,min_daily_budget,age,disable_reason&limit=100&access_token=${ACCESS_TOKEN}`;

        // Fetch all pages of ad accounts
        while (url) {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.data) {
                allAccounts = allAccounts.concat(data.data.map(account => ({
                    id: account.id,
                    accountId: account.account_id,
                    name: account.name,
                    status: account.account_status,
                    currency: account.currency,
                    timezone: account.timezone_name,
                    balance: account.balance,
                    amountSpent: account.amount_spent,
                    spendCap: account.spend_cap,
                    businessName: account.business_name,
                    fundingSource: account.funding_source_details,
                    minDailyBudget: account.min_daily_budget,
                    age: account.age,
                    disableReason: account.disable_reason
                })));
            }

            // Check if there's a next page
            url = data.paging && data.paging.next ? data.paging.next : null;
        }

        console.log(`Fetched ${allAccounts.length} ad accounts from Facebook`);
        return allAccounts;
    } catch (error) {
        console.error('Error fetching ad accounts:', error);
        throw error;
    }
}

/**
 * Get all campaigns for a specific ad account
 */
export async function getCampaigns(adAccountId) {
    try {
        let allCampaigns = [];
        let url = `${BASE_URL}/${adAccountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,budget_remaining,created_time,updated_time&limit=100&access_token=${ACCESS_TOKEN}`;

        // Fetch all pages of campaigns
        while (url) {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.data) {
                allCampaigns = allCampaigns.concat(data.data.map(campaign => ({
                    id: campaign.id,
                    name: campaign.name,
                    objective: campaign.objective,
                    status: campaign.status,
                    dailyBudget: campaign.daily_budget,
                    lifetimeBudget: campaign.lifetime_budget,
                    budgetRemaining: campaign.budget_remaining,
                    createdTime: campaign.created_time,
                    updatedTime: campaign.updated_time
                })));
            }

            // Check if there's a next page
            url = data.paging && data.paging.next ? data.paging.next : null;
        }

        console.log(`Fetched ${allCampaigns.length} campaigns from Facebook for account ${adAccountId}`);
        return allCampaigns;
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
    }
}



/**
 * Get all pixels for a specific ad account
 */
export async function getPixels(adAccountId) {
    try {
        let allPixels = [];
        let url = `${BASE_URL}/${adAccountId}/adspixels?fields=id,name&limit=100&access_token=${ACCESS_TOKEN}`;

        // Fetch all pages of pixels
        while (url) {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.data) {
                allPixels = allPixels.concat(data.data.map(pixel => ({
                    id: pixel.id,
                    name: pixel.name
                })));
            }

            // Check if there's a next page
            url = data.paging && data.paging.next ? data.paging.next : null;
        }

        console.log(`Fetched ${allPixels.length} pixels from Facebook for account ${adAccountId}`);
        return allPixels;
    } catch (error) {
        console.error('Error fetching pixels:', error);
        throw error;
    }
}

/**
 * Get all promotable pages for a specific ad account
 */
export async function getPages(adAccountId) {
    try {
        let allPages = [];
        // Try fetching pages that can be promoted by this ad account
        let url = `${BASE_URL}/${adAccountId}?fields=promote_pages{id,name,picture,access_token,instagram_business_account,connected_instagram_account}&access_token=${ACCESS_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.warn('Error fetching promote_pages from ad account, falling back to me/accounts:', data.error.message);
            return getUserPages();
        }

        if (data.promote_pages && data.promote_pages.data) {
            console.log('Raw promote_pages data:', JSON.stringify(data.promote_pages.data, null, 2));
            allPages = data.promote_pages.data.map(page => {
                const instagramId = page.instagram_business_account?.id || page.connected_instagram_account?.id;
                return {
                    id: page.id,
                    name: page.name,
                    picture: page.picture?.data?.url,
                    pageAccessToken: page.access_token,
                    instagramId: instagramId
                };
            });
        }

        // If no pages found via ad account, try user pages
        if (allPages.length === 0) {
            console.log('No promote_pages found on ad account, trying me/accounts...');
            const userPages = await getUserPages();
            allPages = userPages;
        }

        return allPages;
    } catch (error) {
        console.error('Error fetching pages:', error);
        throw error;
    }
}

async function getUserPages() {
    try {
        let allPages = [];
        let url = `${BASE_URL}/me/accounts?fields=id,name,picture,access_token,instagram_business_account,connected_instagram_account&limit=100&access_token=${ACCESS_TOKEN}`;

        while (url) {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('Error fetching me/accounts:', data.error);
                break;
            }

            if (data.data) {
                allPages = allPages.concat(data.data.map(page => ({
                    id: page.id,
                    name: page.name,
                    picture: page.picture?.data?.url,
                    pageAccessToken: page.access_token,
                    instagramId: page.instagram_business_account?.id || page.connected_instagram_account?.id
                })));
            }

            url = data.paging && data.paging.next ? data.paging.next : null;
        }
        return allPages;
    } catch (error) {
        console.error('Error in getUserPages:', error);
        return [];
    }
}

export const getAdSets = async (adAccountId) => {
    try {
        const fields = 'id,name,status,daily_budget,start_time,targeting,optimization_goal,billing_event,bid_amount,promoted_object,campaign_id';
        const url = `${BASE_URL}/${adAccountId}/adsets?fields=${fields}&limit=50&access_token=${ACCESS_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.data;
    } catch (error) {
        console.error('Error fetching ad sets:', error);
        throw error;
    }
};

export const searchGeoLocations = async (query) => {
    if (!query || query.length < 2) return [];

    try {
        const locationTypes = JSON.stringify(['country', 'region', 'city', 'geo_market']);
        const url = `${BASE_URL}/search?type=adgeolocation&q=${encodeURIComponent(query)}&limit=20&location_types=${locationTypes}&access_token=${ACCESS_TOKEN}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('Error searching locations:', data.error);
            throw new Error(data.error.message);
        }

        return data.data;
    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
};

/**
 * Convert image URL to base64
 */
async function imageUrlToBase64(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Upload image to Facebook
 */
export async function uploadImageToFacebook(imageUrl, adAccountId) {
    try {
        const base64Image = await imageUrlToBase64(imageUrl);

        const formData = new FormData();
        formData.append('bytes', base64Image);
        formData.append('access_token', ACCESS_TOKEN);

        const response = await fetch(`${BASE_URL}/act_${adAccountId}/adimages`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.images.bytes.hash;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

/**
 * Create Facebook Campaign
 */
export async function createFacebookCampaign(campaignData, adAccountId) {
    try {
        const payload = {
            name: campaignData.name,
            objective: campaignData.objective,
            status: campaignData.status || 'PAUSED',
            special_ad_categories: [],
            access_token: ACCESS_TOKEN
        };

        // Add CBO budget if applicable
        if (campaignData.budgetType === 'CBO' && campaignData.dailyBudget) {
            payload.daily_budget = campaignData.dailyBudget;
        }

        // Add bid strategy
        if (campaignData.bidStrategy) {
            payload.bid_strategy = campaignData.bidStrategy;
        }

        const response = await fetch(`${BASE_URL}/act_${adAccountId}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.id;
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
}

/**
 * Create Facebook Ad Set
 */
export async function createFacebookAdSet(adsetData, campaignId, adAccountId, budgetType) {
    try {
        const payload = {
            name: adsetData.name,
            campaign_id: campaignId,
            billing_event: 'IMPRESSIONS',
            optimization_goal: adsetData.optimizationGoal,
            is_dynamic_creative: false, // Must be false to support multiple ads in one ad set
            targeting: {
                geo_locations: {
                    countries: (adsetData.targeting.geo_locations?.countries || adsetData.targeting.countries || [])
                        .map(c => typeof c === 'string' ? c : c.key), // Handle string or object

                    ...(adsetData.targeting.geo_locations?.regions?.length > 0 && {
                        regions: adsetData.targeting.geo_locations.regions.map(r => ({ key: r.key }))
                    }),

                    ...(adsetData.targeting.geo_locations?.cities?.length > 0 && {
                        cities: adsetData.targeting.geo_locations.cities.map(c => ({ key: c.key }))
                    }),

                    ...(adsetData.targeting.geo_locations?.geo_markets?.length > 0 && {
                        geo_markets: adsetData.targeting.geo_locations.geo_markets.map(m => ({ key: m.key }))
                    })
                },
                excluded_geo_locations: {
                    ...(adsetData.targeting.geo_locations?.excluded_countries?.length > 0 && {
                        countries: adsetData.targeting.geo_locations.excluded_countries
                            .map(c => typeof c === 'string' ? c : c.key)
                    }),
                    ...(adsetData.targeting.geo_locations?.excluded_regions?.length > 0 && {
                        regions: adsetData.targeting.geo_locations.excluded_regions.map(r => ({ key: r.key }))
                    }),
                    ...(adsetData.targeting.geo_locations?.excluded_cities?.length > 0 && {
                        cities: adsetData.targeting.geo_locations.excluded_cities.map(c => ({ key: c.key }))
                    }),
                    ...(adsetData.targeting.geo_locations?.excluded_geo_markets?.length > 0 && {
                        geo_markets: adsetData.targeting.geo_locations.excluded_geo_markets.map(m => ({ key: m.key }))
                    })
                },
                age_min: adsetData.targeting.ageMin,
                age_max: adsetData.targeting.ageMax,
                // Disable Advantage+ audience (set to 0) to use manual targeting
                // Set to 1 to enable Advantage+ audience expansion
                targeting_automation: {
                    advantage_audience: 0
                }
            },
            status: adsetData.status || 'PAUSED'
        };

        // Add gender targeting if specified
        if (adsetData.targeting.genders && adsetData.targeting.genders.length > 0) {
            payload.targeting.genders = adsetData.targeting.genders;
        }

        // Add publisher platforms if specified (Manual Placements)
        if (adsetData.targeting.publisher_platforms && adsetData.targeting.publisher_platforms.length > 0) {
            payload.targeting.publisher_platforms = adsetData.targeting.publisher_platforms;
        }

        // Add start time if specified
        if (adsetData.startTime) {
            // Convert local time to Unix timestamp (seconds)
            const startTimeDate = new Date(adsetData.startTime);
            const startTimeUnix = Math.floor(startTimeDate.getTime() / 1000);
            payload.start_time = startTimeUnix;
        }

        // Add bid strategy if specified
        if (adsetData.bidStrategy) {
            payload.bid_strategy = adsetData.bidStrategy;
        }

        // Add conversion tracking if applicable
        if (adsetData.optimizationGoal === 'OFFSITE_CONVERSIONS') {
            payload.promoted_object = {
                pixel_id: adsetData.pixelId,
                custom_event_type: adsetData.conversionEvent
            };

            // Add attribution setting if specified
            if (adsetData.attributionSetting) {
                const [window, type] = adsetData.attributionSetting.split('_');
                const windowDays = parseInt(window.replace('d', ''));

                payload.attribution_spec = [{
                    event_type: 'CLICK_THROUGH',
                    window_days: windowDays
                }];

                // Add view-through attribution if specified
                if (type === 'view' || adsetData.attributionSetting.includes('view')) {
                    payload.attribution_spec.push({
                        event_type: 'VIEW_THROUGH',
                        window_days: 1 // View-through is typically 1 day
                    });
                }
            }
        }

        // Add ABO budget if applicable
        // ONLY if budgetType is ABO (to avoid sending budget for CBO campaigns which causes error)
        if (budgetType === 'ABO' && adsetData.dailyBudget) {
            payload.daily_budget = Math.round(parseFloat(adsetData.dailyBudget) * 100);
        }

        // Add bid amount if applicable and strategy supports it
        if (adsetData.bidAmount &&
            (adsetData.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || adsetData.bidStrategy === 'COST_CAP')) {
            payload.bid_amount = Math.round(parseFloat(adsetData.bidAmount) * 100);
        }

        console.log('Creating Ad Set with payload:', JSON.stringify(payload, null, 2));
        const response = await fetch(`${BASE_URL}/act_${adAccountId}/adsets?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error('Facebook API Error Details:', JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message + (data.error.error_user_msg ? `: ${data.error.error_user_msg}` : ''));
        }

        return data.id;
    } catch (error) {
        console.error('Error creating ad set:', error);
        throw error;
    }
}

/**
 * Create Facebook Ad Creative with Dynamic Creative
 */
export async function createFacebookCreative(creativeData, imageHash, pageId, adAccountId) {
    try {
        if (!pageId) {
            throw new Error('Page ID is required for creative creation');
        }

        // Ensure pageId is a string and clean it
        const cleanPageId = String(pageId).trim();

        const payload = {
            name: creativeData.creativeName,
            object_story_spec: {
                page_id: cleanPageId,
                // Only include instagram_actor_id if we have a specific IG account connected
                // If we use the Page as the identity, we should NOT send the Page ID as instagram_actor_id
                ...(creativeData.instagramId ? { instagram_actor_id: creativeData.instagramId } : {}),
                link_data: {
                    image_hash: imageHash,
                    link: creativeData.websiteUrl,
                    message: creativeData.bodies[0] || '', // Use first body
                    name: creativeData.headlines[0] || '', // Use first headline
                    description: creativeData.description || '',
                    call_to_action: {
                        type: creativeData.cta,
                        value: {
                            link: creativeData.websiteUrl
                        }
                    }
                }
            }
        };

        console.log(`Creating Creative with Page ID: ${pageId}`);
        if (creativeData.instagramId) {
            console.log(`Using Instagram Actor ID: ${creativeData.instagramId}`);
        } else {
            console.log('No Instagram Actor ID provided, using Page identity for Instagram.');
        }
        console.log('Creating Creative with payload:', JSON.stringify(payload, null, 2));
        const response = await fetch(`${BASE_URL}/act_${adAccountId}/adcreatives?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error('Facebook API Error Details:', JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message + (data.error.error_user_msg ? `: ${data.error.error_user_msg}` : ''));
        }

        return data.id;
    } catch (error) {
        console.error('Error creating creative:', error);
        throw error;
    }
}

/**
 * Create Facebook Ad
 */
export async function createFacebookAd(adData, adsetId, creativeId, adAccountId) {
    try {
        const payload = {
            name: adData.name,
            adset_id: adsetId,
            creative: {
                creative_id: creativeId
            },
            status: adData.status || 'PAUSED'
        };

        console.log('Creating Ad with payload:', JSON.stringify(payload, null, 2));
        const response = await fetch(`${BASE_URL}/act_${adAccountId}/ads?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error('Facebook API Error Details (Ad Creation):', JSON.stringify(data.error, null, 2));
            throw new Error(data.error.message + (data.error.error_user_msg ? `: ${data.error.error_user_msg}` : ''));
        }

        return data.id;
    } catch (error) {
        console.error('Error creating ad:', error);
        throw error;
    }
}

/**
 * Complete workflow: Upload image, create creative, and create ad
 */
export async function createCompleteAd(campaignId, adsetData, creativeData, adData, pageId, adAccountId, budgetType) {
    try {
        // 1. Upload image
        const imageHash = await uploadImageToFacebook(creativeData.imageUrl, adAccountId);

        // 2. Create ad creative
        const creativeId = await createFacebookCreative(creativeData, imageHash, pageId, adAccountId);

        // 3. Create ad
        const adId = await createFacebookAd(adData, adsetData.fbAdsetId, creativeId, adAccountId);

        return {
            imageHash,
            creativeId,
            adId
        };
    } catch (error) {
        console.error('Error in complete ad creation:', error);
        throw error;
    }
}
