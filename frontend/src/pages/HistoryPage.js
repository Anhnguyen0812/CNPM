import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api.service';

const HistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchBookingHistory = async () => {
      try {
        const response = await api.get('/bookings/user/' + currentUser.id);
        setBookings(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching booking history:', error);
        setLoading(false);
      }
    };

    fetchBookingHistory();
  }, [currentUser.id]);

  return (
    <div className="history-page">
      <h2>Ride History</h2>
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your ride history...</p>
        </div>
      ) : bookings.length > 0 ? (
        <div className="booking-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-item slide-up">
              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">{new Date(booking.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">From:</span>
                  <span className="value">{booking.startLocation}</span>
                </div>
                <div className="detail-row">
                  <span className="label">To:</span>
                  <span className="value">{booking.endLocation}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`value tag tag-${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
              
              <div className="booking-actions">
                <Link to={`/ride/${booking.rideId}`} className="secondary-btn">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-car-side"></i>
          </div>
          <h3>No Rides Yet</h3>
          <p>You haven't taken any rides yet. Start exploring ridesharing options!</p>
          <Link to="/" className="primary-btn">Find a Ride</Link>
        </div>
      )}
    </div>
  );
};

const getStatusClass = (status) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'upcoming':
      return 'primary';
    case 'cancelled':
      return 'danger';
    case 'pending':
      return 'warning';
    default:
      return 'primary';
  }
};

export default HistoryPage;