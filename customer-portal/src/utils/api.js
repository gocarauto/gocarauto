import axios from 'axios';

const DEFAULT_API = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://gocar-backend-crtx.onrender.com/api'
    : 'http://localhost:3000/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || DEFAULT_API,
    withCredentials: true
});

// ── In-Memory Fast Cache & In-Flight Deduplication Layer ──
const apiCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds fresh window

export const clearApiCache = () => {
    apiCache.clear();
};

const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
    if (config.skipCache) {
        return originalGet(url, config);
    }

    const paramsKey = config.params ? JSON.stringify(config.params) : '';
    const cacheKey = `${url}::${paramsKey}`;
    const now = Date.now();

    // 1. Check in-memory fresh cache
    const cached = apiCache.get(cacheKey);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        return Promise.resolve(cached.response);
    }

    // 2. Check in-flight duplicate promise
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
    }

    // 3. Initiate fresh network request & deduplicate concurrent calls
    const requestPromise = originalGet(url, config)
        .then((response) => {
            if (response && response.status >= 200 && response.status < 300) {
                apiCache.set(cacheKey, {
                    timestamp: Date.now(),
                    response: response
                });
            }
            return response;
        })
        .finally(() => {
            inFlightRequests.delete(cacheKey);
        });

    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
};

// WHY: Guard against string 'undefined' or 'null' in localStorage being sent as Bearer header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        const method = response.config?.method?.toLowerCase();
        if (['post', 'put', 'delete', 'patch'].includes(method)) {
            clearApiCache();
        }
        return response;
    },
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403) && window.location.pathname !== '/login') {
            clearApiCache();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
