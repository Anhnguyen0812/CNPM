import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Ride sharing made easy for everyone</h1>
          <p>
            Connect with fellow travelers, save money, and reduce your carbon footprint with our innovative 
            ride-sharing platform. Choose between direct rides, activity-based sharing, or profile-based sharing.
          </p>
          <div className="action-buttons">
            {currentUser ? (
              <Link to="/book-ride" className="cta-button">Book a Ride</Link>
            ) : (
              <>
                <Link to="/login" className="primary-btn">Login</Link>
                <Link to="/register" className="secondary-btn">Sign Up</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Our Unique Ride Sharing Options</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚗</div>
            <h3>Direct Rides</h3>
            <p>Book a private ride directly to your destination with our reliable drivers at affordable rates.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Đi chung theo hoạt động</h3>
            <p>Connect with people attending the same events and activities to share rides and reduce costs.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Đi chung theo hồ sơ</h3>
            <p>Find ride partners based on matching profiles, interests, and travel patterns for regular commutes.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🌱</div>
            <h3>Eco-Friendly</h3>
            <p>Reduce carbon emissions and help the environment by sharing rides with others traveling similar routes.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your account as a rider or driver and set up your profile.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choose Ride Type</h3>
            <p>Select direct ride, activity-based sharing, or profile-based sharing.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Book Your Ride</h3>
            <p>Enter your locations, schedule, and preferences to find the perfect ride.</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <h3>Enjoy the Journey</h3>
            <p>Meet your driver or co-riders, share the ride, and save money together.</p>
          </div>
        </div>
      </section>

      {/* Activity-Based Sharing Section */}
      <section className="features-section">
        <h2>Activity-Based Ride Sharing</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Schools & Universities</h3>
            <p>Connect with classmates and fellow students heading to campus at the same time.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Workplace Commutes</h3>
            <p>Share rides with colleagues working in the same office or business district.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>Events & Concerts</h3>
            <p>Find others attending the same events to share transportation and parking costs.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚽</div>
            <h3>Sports & Recreation</h3>
            <p>Connect with teammates or fellow fans heading to games and sporting events.</p>
          </div>
        </div>
      </section>

      {/* Profile-Based Sharing Section */}
      <section className="features-section">
        <h2>Profile-Based Ride Sharing</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👩‍💼</div>
            <h3>Professional Networks</h3>
            <p>Connect with other professionals in your industry for regular commutes and networking.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Similar Interests</h3>
            <p>Find ride partners who share your hobbies and interests for more enjoyable journeys.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎵</div>
            <h3>Music & Podcast Preferences</h3>
            <p>Match with riders who enjoy the same music or podcasts during commutes.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🗣️</div>
            <h3>Language Practice</h3>
            <p>Practice languages with native speakers during your daily commutes.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to start sharing rides?</h2>
          <p>Join thousands of users who are already saving money, making connections, and helping the environment through our ride-sharing platform.</p>
          {currentUser ? (
            <Link to="/book-ride" className="cta-button">Book Your First Ride</Link>
          ) : (
            <Link to="/register" className="cta-button">Sign Up Now</Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;