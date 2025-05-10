import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-page enhanced-home-page">
      <div className="home-header">
        <h2>Welcome to <span className="brand">RideShare</span>, {currentUser?.name || 'User'}</h2>
        <p className="subtitle">Your smart way to connect and share rides</p>
      </div>
      <div className="home-options">
        <div className="option-card enhanced-card">
          <div className="option-icon enhanced-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <h3>Find Ride by Activities</h3>
          <p>Connect with people who share similar activities and interests to find a ride together.</p>
          <Link to="/search-by-activities" className="primary-btn enhanced-btn">
            Search by Activities
          </Link>
        </div>

        <div className="option-card enhanced-card">
          <div className="option-icon enhanced-icon">
            <i className="fas fa-route"></i>
          </div>
          <h3>Find Ride by Trajectory</h3>
          <p>Find rides based on your travel path and preferences for a better match.</p>
          <Link to="/search-by-trajectory" className="primary-btn enhanced-btn">
            Search by Trajectory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;