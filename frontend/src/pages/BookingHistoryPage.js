import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../services/booking.service';

const BookingHistoryPage = () => {
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getUserBookings();
        setBookings(data);
      } catch (err) {
        setError('Failed to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, []);

  const handleViewRide = (rideId) => {
    navigate(`/ride/${rideId}`);
  };

  const handleCancelBooking = async (bookingId) => {
    setCancellingBookingId(bookingId);
    
    try {
      await cancelBooking(bookingId);
      // Update bookings list after cancellation
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'Cancelled' } 
          : booking
      ));
    } catch (err) {
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  const categorizeBookings = () => {
    const now = new Date();
    
    const upcoming = bookings.filter(booking => {
      const departureTime = new Date(booking.ride.departureTime);
      return departureTime > now && booking.status !== 'Cancelled';
    });
    
    const past = bookings.filter(booking => {
      const departureTime = new Date(booking.ride.departureTime);
      return departureTime <= now && booking.status !== 'Cancelled';
    });
    
    const cancelled = bookings.filter(booking => 
      booking.status === 'Cancelled'
    );
    
    return { upcoming, past, cancelled };
  };

  const { upcoming, past, cancelled } = categorizeBookings();

  return (
    <div className="booking-history-page">
      <h2>My Bookings</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You don't have any bookings yet.</p>
          <button 
            className="primary-btn"
            onClick={() => navigate('/find-ride')}
          >
            Find a Ride
          </button>
        </div>
      ) : (
        <div className="bookings-container">
          {/* Upcoming Bookings */}
          <section className="booking-section">
            <h3>Upcoming Bookings</h3>
            {upcoming.length > 0 ? (
              <div className="booking-list">
                {upcoming.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <h4>
                        {booking.ride.startLocation} to {booking.ride.endLocation}
                      </h4>
                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="label">Departure:</span>
                          <span className="value">{formatDateTime(booking.ride.departureTime)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Seats:</span>
                          <span className="value">{booking.numberOfSeats}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Driver:</span>
                          <span className="value">{booking.ride.driver.name}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Pickup:</span>
                          <span className="value">{booking.pickupAddress}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Dropoff:</span>
                          <span className="value">{booking.dropoffAddress}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Total Paid:</span>
                          <span className="value">${(booking.ride.pricePerSeat * booking.numberOfSeats).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="booking-actions">
                      <button 
                        className="view-btn"
                        onClick={() => handleViewRide(booking.ride.id)}
                      >
                        View Ride
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingBookingId === booking.id}
                      >
                        {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-results">No upcoming bookings.</p>
            )}
          </section>
          
          {/* Past Bookings */}
          <section className="booking-section">
            <h3>Past Bookings</h3>
            {past.length > 0 ? (
              <div className="booking-list">
                {past.map(booking => (
                  <div key={booking.id} className="booking-item past-booking">
                    <div className="booking-info">
                      <h4>
                        {booking.ride.startLocation} to {booking.ride.endLocation}
                      </h4>
                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="label">Departure:</span>
                          <span className="value">{formatDateTime(booking.ride.departureTime)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Seats:</span>
                          <span className="value">{booking.numberOfSeats}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Driver:</span>
                          <span className="value">{booking.ride.driver.name}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Total Paid:</span>
                          <span className="value">${(booking.ride.pricePerSeat * booking.numberOfSeats).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="booking-actions">
                      <button 
                        className="view-btn"
                        onClick={() => handleViewRide(booking.ride.id)}
                      >
                        View Ride
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-results">No past bookings.</p>
            )}
          </section>
          
          {/* Cancelled Bookings */}
          {cancelled.length > 0 && (
            <section className="booking-section">
              <h3>Cancelled Bookings</h3>
              <div className="booking-list">
                {cancelled.map(booking => (
                  <div key={booking.id} className="booking-item cancelled-booking">
                    <div className="booking-info">
                      <h4>
                        {booking.ride.startLocation} to {booking.ride.endLocation}
                      </h4>
                      <div className="booking-details">
                        <div className="detail-row">
                          <span className="label">Departure:</span>
                          <span className="value">{formatDateTime(booking.ride.departureTime)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Seats:</span>
                          <span className="value">{booking.numberOfSeats}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Status:</span>
                          <span className="value cancelled">Cancelled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingHistoryPage;