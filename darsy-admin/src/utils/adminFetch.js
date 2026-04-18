/**
 * Lightweight fetch wrapper for the Darsy admin panel.
 * Points to the Darsy backend at http://localhost:5000/api
 */
const BASE_URL = 'http://localhost:5000/api';

export const adminFetch = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
};
