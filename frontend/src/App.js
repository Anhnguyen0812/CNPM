import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/user/ProfilePage';
import BookRidePage from './pages/ride/BookRidePage';
import RideHistoryPage from './pages/ride/RideHistoryPage';
import ActiveRidePage from './pages/ride/ActiveRidePage';
import VehiclesPage from './pages/driver/VehiclesPage';
import PaymentMethodsPage from './pages/payment/PaymentMethodsPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import AbraPage from './pages/ride/AbraPage';
import ActivitySchedulePage from './pages/ride/ActivitySchedulePage';
import TrajectoryMatchingPage from './pages/ride/TrajectoryMatchingPage';
import TrajectoryRidesPage from './pages/ride/TrajectoryRidesPage';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const { checkAuthStatus } = useAuth();
  const [appLoading, setAppLoading] = useState(true);
  
  // Check if user is authenticated on app load
  useEffect(() => {
    const initApp = async () => {
      await checkAuthStatus();
      setAppLoading(false);
    };
    
    initApp();
  }, [checkAuthStatus]);
  
  if (appLoading) {
    return <div className="app-loading">Loading application...</div>;
  }
  
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/book-ride" element={<ProtectedRoute allowedRoles={['customer']}><BookRidePage /></ProtectedRoute>} />
          <Route path="/ride-history" element={<ProtectedRoute><RideHistoryPage /></ProtectedRoute>} />
          <Route path="/active-ride/:rideId" element={<ProtectedRoute><ActiveRidePage /></ProtectedRoute>} />
          <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
          
          {/* Activity-Based Ride Sharing routes */}
          <Route path="/abra" element={<ProtectedRoute><AbraPage /></ProtectedRoute>} />
          <Route path="/activities" element={<ProtectedRoute><ActivitySchedulePage /></ProtectedRoute>} />
          
          {/* Trajectory-Based Ride Sharing routes */}
          <Route path="/trajectory-matching" element={<ProtectedRoute><TrajectoryMatchingPage /></ProtectedRoute>} />
          <Route path="/trajectory-rides" element={<ProtectedRoute><TrajectoryRidesPage /></ProtectedRoute>} />
          
          {/* Driver routes */}
          <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['driver']}><VehiclesPage /></ProtectedRoute>} />
          <Route path="/driver-dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboardPage /></ProtectedRoute>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;