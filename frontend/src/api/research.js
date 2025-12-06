import axios from 'axios';

const API_URL = '/api/v1/research';

export const searchAds = async (query, platform = 'facebook', limit = 10, country = 'US', offset = 0, excludeIds = []) => {
    try {
        const response = await axios.post(`${API_URL}/search`, {
            query,
            platform,
            limit,
            country,
            offset,
            exclude_ids: excludeIds,
        });
        return response.data;
    } catch (error) {
        console.error('Error searching ads:', error);
        throw error;
    }
};

export const getResearchHistory = async () => {
    try {
        const response = await axios.get(`${API_URL}/history`);
        return response.data;
    } catch (error) {
        console.error('Error fetching research history:', error);
        throw error;
    }
};

export const saveAd = async (adData) => {
    try {
        const response = await axios.post(`${API_URL}/save`, adData);
        return response.data;
    } catch (error) {
        console.error('Error saving ad:', error);
        throw error;
    }
};
