import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SearchByActivitiesPage from './pages/SearchByActivitiesPage';
import SearchByTrajectoryPage from './pages/SearchByTrajectoryPage';
import RideDetailsPage from './pages/RideDetailsPage';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Main Navigation Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Home Page Sub-routes */}
            <Route path="/search-by-activities" element={
              <ProtectedRoute>
                <SearchByActivitiesPage />
              </ProtectedRoute>
            } />
            <Route path="/search-by-trajectory" element={
              <ProtectedRoute>
                <SearchByTrajectoryPage />
              </ProtectedRoute>
            } />
            
            {/* Other Routes */}
            <Route path="/ride/:id" element={
              <ProtectedRoute>
                <RideDetailsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;