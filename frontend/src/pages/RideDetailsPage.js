import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById, joinGroup } from '../services/group.service';
import { useAuth } from '../contexts/AuthContext';
import MapDisplay from '../components/map/MapDisplay';

const RideDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [rideDetails, setRideDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    numberOfSeats: 1,
    pickupAddress: '',
    dropoffAddress: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const data = await getGroupById(id);
        setRideDetails(data);
        
        // Set map coordinates
        if (data.startCoordinates) {
          setStartPoint({
            lat: data.startCoordinates.latitude,
            lon: data.startCoordinates.longitude
          });
        }
        
        if (data.endCoordinates) {
          setEndPoint({
            lat: data.endCoordinates.latitude,
            lon: data.endCoordinates.longitude
          });
        }
        
        // Set route if available
        if (data.routeData) {
          try {
            const routeObj = JSON.parse(data.routeData);
            setRoute(routeObj);
          } catch (e) {
            console.error('Failed to parse route data:', e);
          }
        }
        
        // Pre-fill pickup and dropoff addresses
        setBookingData(prev => ({
          ...prev,
          pickupAddress: data.startLocation,
          dropoffAddress: data.endLocation
        }));
      } catch (err) {
        setError('Failed to load ride details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRideDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData({
      ...bookingData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(false);
    
    try {
      // Validate number of seats
      const seats = parseInt(bookingData.numberOfSeats);
      if (isNaN(seats) || seats < 1) {
        throw new Error('Please enter a valid number of seats');
      }
      
      if (seats > rideDetails.availableSeats) {
        throw new Error(`Only ${rideDetails.availableSeats} seats available`);
      }
      
      // Submit booking
      await joinGroup(id, {
        numberOfSeats: seats,
        pickupAddress: bookingData.pickupAddress,
        dropoffAddress: bookingData.dropoffAddress
      });
      
      setBookingSuccess(true);
      
      // Reset form
      setBookingData({
        numberOfSeats: 1,
        pickupAddress: rideDetails.startLocation,
        dropoffAddress: rideDetails.endLocation
      });
      
      // Update ride details to reflect new seat availability
      const updatedRideDetails = await getGroupById(id);
      setRideDetails(updatedRideDetails);
    } catch (err) {
      setBookingError(err.message || 'Failed to book ride. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading ride details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="back-btn"
          onClick={() => navigate('/find-ride')}
        >
          Back to Ride Search
        </button>
      </div>
    );
  }

  const isUserDriver = rideDetails.driver?.id === currentUser?.id;
  const isRideFull = rideDetails.availableSeats === 0;
  const departureDate = new Date(rideDetails.departureTime);

  return (
    <div className="ride-details-page">
      <h2>Ride Details</h2>
      
      <div className="ride-details-container">
        <div className="ride-info-section">
          <div className="ride-header">
            <h3>
              {rideDetails.startLocation} to {rideDetails.endLocation}
            </h3>
            <span className="price">${rideDetails.pricePerSeat} per seat</span>
          </div>
          
          <div className="ride-details">
            <div className="detail-row">
              <span className="label">Driver:</span>
              <span className="value">{rideDetails.driver?.name}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Departure:</span>
              <span className="value">
                {departureDate.toLocaleDateString()} at {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Vehicle:</span>
              <span className="value">
                {rideDetails.vehicle?.make} {rideDetails.vehicle?.model} - {rideDetails.vehicle?.color} ({rideDetails.vehicle?.licensePlate})
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Available Seats:</span>
              <span className="value">{rideDetails.availableSeats} of {rideDetails.totalSeats}</span>
            </div>
            
            {rideDetails.description && (
              <div className="detail-row">
                <span className="label">Description:</span>
                <p className="description">{rideDetails.description}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="ride-map">
          <h3>Route</h3>
          <MapDisplay
            startPoint={startPoint}
            endPoint={endPoint}
            route={route}
            height="300px"
          />
        </div>
      </div>
      
      {!isUserDriver && !isRideFull && !bookingSuccess ? (
        <div className="booking-section">
          <h3>Book a Seat</h3>
          
          {bookingError && <div className="error-message">{bookingError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="numberOfSeats">Number of Seats:</label>
              <input
                id="numberOfSeats"
                name="numberOfSeats"
                type="number"
                min="1"
                max={rideDetails.availableSeats}
                value={bookingData.numberOfSeats}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pickupAddress">Pickup Address:</label>
              <input
                id="pickupAddress"
                name="pickupAddress"
                type="text"
                value={bookingData.pickupAddress}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dropoffAddress">Dropoff Address:</label>
              <input
                id="dropoffAddress"
                name="dropoffAddress"
                type="text"
                value={bookingData.dropoffAddress}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="booking-total">
              <span>Total: ${(rideDetails.pricePerSeat * bookingData.numberOfSeats).toFixed(2)}</span>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Processing...' : 'Book Seat'}
            </button>
          </form>
        </div>
      ) : bookingSuccess ? (
        <div className="booking-success">
          <h3>Booking Successful!</h3>
          <p>Your ride has been booked successfully.</p>
          <div className="booking-actions">
            <button 
              className="primary-btn"
              onClick={() => navigate('/bookings')}
            >
              View My Bookings
            </button>
            <button
              className="secondary-btn"
              onClick={() => navigate('/find-ride')}
            >
              Find Another Ride
            </button>
          </div>
        </div>
      ) : isUserDriver ? (
        <div className="driver-note">
          <p>You are the driver of this ride.</p>
        </div>
      ) : (
        <div className="ride-full">
          <p>This ride is fully booked.</p>
          <button
            className="primary-btn"
            onClick={() => navigate('/find-ride')}
          >
            Find Another Ride
          </button>
        </div>
      )}
      
      <div className="back-link">
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default RideDetailsPage;