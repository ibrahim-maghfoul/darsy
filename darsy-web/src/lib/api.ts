import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_APP_API_KEY ? { 'X-App-Key': process.env.NEXT_PUBLIC_APP_API_KEY } : {}),
    },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                if (config.headers && typeof config.headers.set === 'function') {
                    config.headers.set('Authorization', `Bearer ${token}`);
                } else {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                if (error.response?.data?.code === 'SESSION_INVALIDATED') {
                    sessionStorage.setItem('auth_error', 'SESSION_INVALIDATED');
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
