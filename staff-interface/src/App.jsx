import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const CustomerList = lazy(() => import('./components/CustomerList'));
const CustomerForm = lazy(() => import('./components/CustomerForm'));
const CustomerDossier = lazy(() => import('./components/CustomerDossier'));
const VehicleList = lazy(() => import('./components/VehicleList'));
const VehicleForm = lazy(() => import('./components/VehicleForm'));
const ServiceRequestList = lazy(() => import('./components/ServiceRequestList'));
const ServiceRequestForm = lazy(() => import('./components/ServiceRequestForm'));
const ServiceRequestDetail = lazy(() => import('./components/ServiceRequestDetail'));
const FinancialList = lazy(() => import('./components/FinancialList'));
const ReportsDashboard = lazy(() => import('./components/ReportsDashboard'));
const CredentialManager = lazy(() => import('./components/CredentialManager'));
const ServiceRemindersModule = lazy(() => import('./components/ServiceRemindersModule'));
const ConsignmentHub = lazy(() => import('./components/ConsignmentHub'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: '3rem', color: 'var(--text-dim)', textAlign: 'center' }} className="animate-glow">AUTHENTICATING...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="p-20 text-center animate-glow text-gray-500 font-bold tracking-widest text-xs uppercase">LOADING MODULE...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />

              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/:id" element={<CustomerDossier />} />
              <Route path="customers/:id/edit" element={<CustomerForm />} />

              <Route path="vehicles" element={<VehicleList />} />
              <Route path="vehicles/new" element={<VehicleForm />} />
              <Route path="vehicles/:id" element={<VehicleForm />} /> {/* TODO: Create VehicleSpecSheet */}
              <Route path="vehicles/:id/edit" element={<VehicleForm />} />

              <Route path="consignment" element={<ConsignmentHub />} />

              <Route path="service-requests" element={<ServiceRequestList />} />
              <Route path="service-requests/new" element={<ServiceRequestForm />} />
              <Route path="service-requests/:id" element={<ServiceRequestDetail />} />
              <Route path="reminders" element={<ServiceRemindersModule />} />
              <Route path="financial" element={<FinancialList />} />
              <Route path="reports" element={<ReportsDashboard />} />
              <Route path="credentials" element={<CredentialManager />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
