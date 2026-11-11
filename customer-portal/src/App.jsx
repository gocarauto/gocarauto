import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Login = lazy(() => import('./components/Login'));
const ServiceBooking = lazy(() => import('./components/ServiceBooking'));
const ServiceHistory = lazy(() => import('./components/ServiceHistory'));
const InvoiceList = lazy(() => import('./components/InvoiceList'));
const VehicleFleet = lazy(() => import('./components/VehicleFleet'));
const Settings = lazy(() => import('./components/Settings'));
const Appointments = lazy(() => import('./components/Appointments'));
const MagicLogin = lazy(() => import('./components/MagicLogin'));
const Glovebox = lazy(() => import('./components/Glovebox'));
const AIAdvisor = lazy(() => import('./components/AIAdvisor'));

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
                            <Suspense fallback={
                                <div className="flex items-center justify-center min-h-[60vh]">
                                    <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            }>
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
                            </Suspense>
                        </Router>
                    </LanguageProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;
