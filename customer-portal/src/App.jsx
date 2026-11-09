import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';

import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ServiceBooking from './components/ServiceBooking';
import ServiceHistory from './components/ServiceHistory';
import InvoiceList from './components/InvoiceList';
import VehicleFleet from './components/VehicleFleet';
import Settings from './components/Settings';
import Appointments from './components/Appointments';
import MagicLogin from './components/MagicLogin';
import Glovebox from './components/Glovebox';
import AIAdvisor from './components/AIAdvisor';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <LanguageProvider>
                        <Router>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/magic/:token" element={<MagicLogin />} />
                                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                                    <Route index element={<Dashboard />} />
                                    <Route path="history" element={<ServiceHistory />} />
                                    <Route path="invoices" element={<InvoiceList />} />
                                    <Route path="appointments" element={<Appointments />} />
                                    <Route path="vehicles" element={<VehicleFleet />} />
                                    <Route path="settings" element={<Settings />} />
                                    <Route path="book-service" element={<ServiceBooking />} />
                                    <Route path="glovebox" element={<Glovebox />} />
                                    <Route path="ai-advisor" element={<AIAdvisor />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Route>
                            </Routes>
                        </Router>
                    </LanguageProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;
