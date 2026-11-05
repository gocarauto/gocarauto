import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Attach Authorization Bearer token from localStorage for resilient cross-origin support
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle auth errors gracefully
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = window.location.pathname === '/login';
        if (error.response && (error.response.status === 401 || error.response.status === 403) && !isAuthRoute) {
            // Token expired, invalid, or missing on protected views
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
