// Facebook Marketing API Integration Service
// Now proxies through our backend

const API_BASE_URL = '/api/v1/facebook';

/**
 * Get all ad accounts accessible by the access token
 */
export async function getAdAccounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/accounts`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch ad accounts');
        }
        const accounts = await response.json();

        // Map backend response to frontend expected format if necessary
        // Backend returns raw FB data list
        return accounts.map(account => ({
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
        }));
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
        // Backend service currently fetches all campaigns for the connected account
        // It doesn't filter by adAccountId in the service call yet, but assumes the env var account
        // For now, we'll just call the endpoint
        const response = await fetch(`${API_BASE_URL}/campaigns?ad_account_id=${adAccountId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch campaigns');
        }
        const campaigns = await response.json();

        return campaigns.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            dailyBudget: campaign.daily_budget,
            lifetimeBudget: campaign.lifetime_budget,
            budgetRemaining: campaign.budget_remaining,
            createdTime: campaign.created_time,
            updatedTime: campaign.updated_time
        }));
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
        const response = await fetch(`${API_BASE_URL}/pixels?ad_account_id=${adAccountId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch pixels');
        }
        const pixels = await response.json();

        return pixels.map(pixel => ({
            id: pixel.id,
            name: pixel.name,
            code: pixel.code,
            isUnavailable: pixel.is_unavailable
        }));
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
        const response = await fetch(`${API_BASE_URL}/pages`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch pages');
        }
        const pages = await response.json();

        return pages.map(page => ({
            id: page.id,
            name: page.name,
            accessToken: page.access_token,
            category: page.category
        }));
    } catch (error) {
        console.error('Error fetching pages:', error);
        throw error;
    }
}


export const getAdSets = async (campaignId, adAccountId) => {
    try {
        let url = `${API_BASE_URL}/adsets?`;
        if (campaignId) {
            url += `campaign_id=${campaignId}`;
        } else if (adAccountId) {
            url += `ad_account_id=${adAccountId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to fetch ad sets');
        }
        const adSets = await response.json();
        return adSets;
    } catch (error) {
        console.error('Error fetching ad sets:', error);
        throw error;
    }
};

export const searchGeoLocations = async (query, adAccountId) => {
    try {
        // Default to 'city' type for now, or we could make it a parameter
        // The backend supports 'city', 'region', 'country', 'zip', etc.
        // For general search, 'city' is common, but users might want countries.
        // Let's search for multiple types or default to a broad search if possible.
        // Facebook API 'location_types' can take multiple.

        // Let's use the searchLocations function we just added
        return await searchLocations(query, 'city', adAccountId);
    } catch (error) {
        console.error('Error searching geo locations:', error);
        return [];
    }
};


/**
 * Upload image to Facebook
 */
export async function uploadImageToFacebook(imageUrl, adAccountId) {
    try {
        let finalImageUrl = imageUrl;

        // If it's a blob URL, we need to upload it to our server first
        if (imageUrl.startsWith('blob:')) {
            // 1. Fetch the blob
            const blobResponse = await fetch(imageUrl);
            const blob = await blobResponse.blob();

            // 2. Create FormData
            const formData = new FormData();
            // Use a default filename or try to guess extension
            const filename = 'upload.jpg';
            formData.append('file', blob, filename);

            // 3. Upload to our backend
            // Note: API_BASE_URL is '/api/v1/facebook', so we need to go up one level to '/api/v1/uploads'
            const uploadResponse = await fetch('/api/v1/uploads/', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image to server');
            }

            const uploadResult = await uploadResponse.json();
            // The backend returns { url: "/uploads/filename.ext" }
            // We need to remove the leading slash to make it a relative path for the python script
            // or keep it if the python script handles absolute paths.
            // The python script runs in 'backend/', and uploads are in 'backend/uploads/'
            // So 'uploads/filename.ext' should work.
            finalImageUrl = uploadResult.url.startsWith('/') ? uploadResult.url.substring(1) : uploadResult.url;
        }

        const response = await fetch(`${API_BASE_URL}/upload-image?ad_account_id=${adAccountId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_url: finalImageUrl })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to upload image to Facebook');
        }

        const data = await response.json();
        return data.image_hash;
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
        const response = await fetch(`${API_BASE_URL}/campaigns?ad_account_id=${adAccountId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create campaign');
        }

        const data = await response.json();
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
        // Prepare payload for backend
        const payload = {
            ...adsetData,
            campaign_id: campaignId,
            daily_budget: adsetData.dailyBudget, // Map camelCase to snake_case if needed, or handle in backend
            optimization_goal: adsetData.optimizationGoal,
            bid_strategy: adsetData.bidStrategy,
            bid_amount: adsetData.bidAmount,
            start_time: adsetData.startTime ? new Date(adsetData.startTime).toISOString() : null,
            targeting: adsetData.targeting
        };

        const response = await fetch(`${API_BASE_URL}/adsets?ad_account_id=${adAccountId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create ad set');
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error creating ad set:', error);
        throw error;
    }
}

/**
 * Create Facebook Ad Creative
 */
export async function createFacebookCreative(creativeData, imageHash, pageId, adAccountId) {
    try {
        const payload = {
            ...creativeData,
            image_hash: imageHash,
            page_id: pageId,
            primary_text: creativeData.bodies[0],
            headline: creativeData.headlines[0],
            website_url: creativeData.websiteUrl
        };

        const response = await fetch(`${API_BASE_URL}/creatives?ad_account_id=${adAccountId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create creative');
        }

        const data = await response.json();
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
            ...adData,
            adset_id: adsetId,
            creative_id: creativeId
        };

        const response = await fetch(`${API_BASE_URL}/ads?ad_account_id=${adAccountId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create ad');
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Error creating ad:', error);
        throw error;
    }
}

/**
 * Search for locations
 */
export async function searchLocations(query, type = 'city', adAccountId) {
    try {
        const response = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}&type=${type}&ad_account_id=${adAccountId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to search locations');
        }
        return await response.json();
    } catch (error) {
        console.error('Error searching locations:', error);
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
        // Note: We need the adset ID. This function signature assumes adsetData contains the ID or we create it here?
        // The original function took adsetData and created the adset? No, wait.
        // Original: createCompleteAd(campaignId, adsetData, creativeData, adData, pageId, adAccountId, budgetType)
        // It calls createFacebookAd with adsetData.fbAdsetId.
        // So adsetData must have the ID.

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
