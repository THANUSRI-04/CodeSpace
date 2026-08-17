export const getApiUrl = () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
    return isLocal ? 'http://localhost:5000' : 'https://codespace-1-g2fn.onrender.com';
};

export const API_URL = getApiUrl();
