import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

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
    const [loading] = useState(false);

    // WHY: Support email or phone identifier and ensure token is only written to storage if defined
    const login = async (identifier, password) => {
        try {
            const response = await api.post('/auth/customer/login', {
                identifier,
                password
            });

            if (response.data.success) {
                const { token, user: userData } = response.data;
                setAuth(token, userData);
                return true;
            }
        } catch (error) {
            console.error('Login Error:', error);
        }
        return false;
    };

    const setAuth = (token, userData) => {
        if (token && token !== 'undefined') {
            localStorage.setItem('token', token);
        }
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
