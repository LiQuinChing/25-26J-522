import axios from 'axios';

const API_BASE_URL = '/api';

export const uploadECGFile = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/upload-ecg`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.error || 'Server error occurred');
        }
        throw new Error('Network error. Is the server running?');
    }
};

export const getRecentAnalyses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/recent`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch recent analyses", error);
        return [];
    }
};