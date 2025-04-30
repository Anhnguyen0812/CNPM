import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };
  
  // Function to check if link is active
  const isActive = (path) => {
    return location.pathname === path ? 'nav-item active' : 'nav-item';
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          {/* <img src="/logo.png" alt="RideShare Logo" /> */}
          RideShare
        </Link>
        
        {/* Mobile menu toggle */}
        <div 
          className={`mobile-menu-toggle ${showMobileMenu ? 'active' : ''}`}
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <div className={`navbar-menu ${showMobileMenu ? 'active' : ''}`}>
          <Link to="/" className={isActive('/')} style={{'--i': 0}}>
            <i className="fas fa-home"></i>Trang chủ
          </Link>
          
          {isAuthenticated ? (
            <>
              {/* Common authenticated user links */}
              <Link to="/ride-history" className={isActive('/ride-history')} style={{'--i': 1}}>
                <i className="fas fa-history"></i>Lịch sử chuyến đi
              </Link>
              
              {/* Customer specific links */}
              {currentUser?.role === 'customer' && (
                <Link to="/book-ride" className={isActive('/book-ride')} style={{'--i': 2}}>
                  <i className="fas fa-car"></i>Đặt xe
                </Link>
              )}

              <Link to="/payment-methods" className={isActive('/payment-methods')} style={{'--i': 3}}>
                <i className="fas fa-credit-card"></i>Thanh toán
              </Link>
              
              
              
              {/* Driver specific links */}
              {currentUser?.role === 'driver' && (
                <>
                  <Link to="/driver-dashboard" className={isActive('/driver-dashboard')} style={{'--i': 3}}>
                    <i className="fas fa-tachometer-alt"></i>Bảng điều khiển
                  </Link>
                  <Link to="/vehicles" className={isActive('/vehicles')} style={{'--i': 4}}>
                    <i className="fas fa-car-alt"></i>Xe của tôi
                  </Link>
                </>
              )}
              
              {/* Profile dropdown */}
              <div 
                className={`profile-dropdown ${showDropdown ? 'open' : ''}`} 
                ref={dropdownRef}
                style={{'--i': 5}}
              >
                <div 
                  className="profile-toggle"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <img 
                    src={currentUser.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name)} 
                    alt="Profile" 
                    className="profile-avatar" 
                  />
                  <span className="profile-name">{currentUser.name}</span>
                  <i className={`fas fa-chevron-down dropdown-arrow ${showDropdown ? 'open' : ''}`}></i>
                </div>
                
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-name">{currentUser.name}</div>
                    <div className="user-email">{currentUser.email}</div>
                  </div>
                  
                  <div className="dropdown-items">
                    <Link to="/profile" className="dropdown-item">
                      <i className="fas fa-user"></i> Hồ sơ của tôi
                    </Link>
                    
                    <Link to="/active-ride" className="dropdown-item">
                      <i className="fas fa-car-side"></i> Chuyến đi hiện tại
                    </Link>
                    
                    <Link to="/settings" className="dropdown-item">
                      <i className="fas fa-cog"></i> Cài đặt
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-item logout-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Đăng xuất
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn login-btn" style={{'--i': 1}}>
                <i className="fas fa-sign-in-alt"></i> Đăng nhập
              </Link>
              <Link to="/register" className="nav-btn register-btn" style={{'--i': 2}}>
                <i className="fas fa-user-plus"></i> Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;