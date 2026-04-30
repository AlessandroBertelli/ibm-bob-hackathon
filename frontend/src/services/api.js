import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const partyAPI = {
    createParty: async (data) => {
        const response = await api.post('/parties', data);
        return response.data;
    },

    getParty: async (id) => {
        const response = await api.get(`/parties/${id}`);
        return response.data;
    },

    getPartyStatus: async (id) => {
        const response = await api.get(`/parties/${id}/status`);
        return response.data;
    }
};

// Made with Bob
