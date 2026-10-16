import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../config';

export const AuthContext = createContext();

const decodeJwt = (token) => {
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const getStoredSession = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return { token: null, user: null, isExpired: false };

        const decoded = decodeJwt(token);
        if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return { token: null, user: null, isExpired: true };
        }

        const rawUser = localStorage.getItem('user');
        if (rawUser) {
            const user = JSON.parse(rawUser);
            return { token, user, isExpired: false };
        }

        if (decoded && decoded.user && decoded.user.name) {
            return { token, user: decoded.user, isExpired: false };
        }

        return { token, user: null, isExpired: false };
    } catch {
        return { token: null, user: null, isExpired: false };
    }
};

export const AuthProvider = ({ children }) => {
    const initialSession = getStoredSession();
    const [user, setUser] = useState(initialSession.user);
    // Instant load if cached user exists or no token exists
    const [loading, setLoading] = useState(!initialSession.user && Boolean(initialSession.token));

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }

        // Keep-alive ping to prevent Render free-tier from sleeping while user has app open
        const pingInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                api.get('/health').catch(() => {});
            }
        }, 10 * 60 * 1000);

        return () => clearInterval(pingInterval);
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/api/auth/me');
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                delete axios.defaults.headers.common['Authorization'];
                setUser(null);
            }
            // For network errors or 5xx cold starts, retain cached user session
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    const signup = async (name, email, password) => {
        const res = await api.post('/api/auth/signup', { name, email, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

