import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            return token && storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('token');
            // If no token exists and no cookies, finish loading immediately
            if (!token && !document.cookie.includes('token=')) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/verify');
                if (response.data.success && response.data.user) {
                    setUser(response.data.user);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                } else {
                    setUser(null);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (err) {
                // If 401 Unauthorized, clear cached credentials
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUser(null);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
                // On network error (e.g. cold start), keep user hydrated if token exists so UI doesn't flicker
            } finally {
                setLoading(false);
            }
        };
        verifySession();
    }, []);

    const login = async (identifier, password) => {
        try {
            const trimmedIdentifier = (identifier || '').trim();
            const response = await api.post('/auth/staff/login', { 
                identifier: trimmedIdentifier,
                email: trimmedIdentifier, 
                password 
            });
            const { user: userData, token } = response.data;
            if (token && token !== 'undefined') {
                localStorage.setItem('token', token);
            }
            if (userData) {
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            let errorMessage = 'Login failed';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.status === 401) {
                errorMessage = 'Invalid username/email or password';
            } else if (error.message === 'Network Error' || !error.response) {
                errorMessage = 'Backend connection timeout. Cloud server may be waking up (Render cold start) — please retry in 15 seconds.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Internal server authentication error. Please try again.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error(e);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
