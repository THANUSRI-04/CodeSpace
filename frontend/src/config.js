import axios from 'axios';

export const getApiUrl = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    hostname.startsWith('192.168.') || 
                    hostname.startsWith('10.') || 
                    Boolean(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

    if (isLocal) {
        const host = (hostname === 'localhost' || hostname === '127.0.0.1') ? 'localhost' : hostname;
        return `http://${host}:5000`;
    }
    return 'https://codespace-1-g2fn.onrender.com';
};

export const API_URL = getApiUrl();

// Preconfigured Axios instance with automatic token injection and 70s timeout
export const api = axios.create({
    baseURL: API_URL,
    timeout: 70000
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

