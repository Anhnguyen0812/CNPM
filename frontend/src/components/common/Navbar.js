import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          {/* <img src="/logo.png" alt="RideShare" className="logo-image" /> */}
          <span className="logo-text">RideShare</span>
        </Link>
        
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>

        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
              <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
                History
              </Link>
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register" className="signup-btn">Register</Link>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="user-menu">
            <img 
              src={currentUser?.avatar || "https://via.placeholder.com/40"} 
              alt={currentUser?.name || 'User'} 
              className="user-avatar" 
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;