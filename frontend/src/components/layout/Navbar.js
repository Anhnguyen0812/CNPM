import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          RideShare
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="nav-item">Home</Link>
          
          {isAuthenticated ? (
            <>
              {/* Common authenticated user links */}
              <Link to="/profile" className="nav-item">Profile</Link>
              <Link to="/ride-history" className="nav-item">Ride History</Link>
              <Link to="/payment-methods" className="nav-item">Payments</Link>
              
              {/* Customer specific links */}
              {currentUser?.role === 'customer' && (
                <Link to="/book-ride" className="nav-item">Book Ride</Link>
              )}
              
              {/* Driver specific links */}
              {currentUser?.role === 'driver' && (
                <>
                  <Link to="/driver-dashboard" className="nav-item">Dashboard</Link>
                  <Link to="/vehicles" className="nav-item">My Vehicles</Link>
                </>
              )}
              
              <button onClick={handleLogout} className="nav-btn logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item">Login</Link>
              <Link to="/register" className="nav-btn register-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;