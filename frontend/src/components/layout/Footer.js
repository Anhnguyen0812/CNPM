import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>RideShare</h3>
          <p>The convenient way to travel and share rides.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/book-ride">Book a Ride</Link></li>
            <li><Link to="/register">Become a Driver</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Help</h4>
          <ul>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/support">Support</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: info@rideshare.com</p>
          <p>Phone: +84 123 456 789</p>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">FB</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">TW</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">IG</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} RideShare. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;