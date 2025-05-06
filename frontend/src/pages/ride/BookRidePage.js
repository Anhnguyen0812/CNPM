import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api.service';
import './BookRidePage.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Map Click Handler Component
const LocationMarker = ({ position, setPosition, markerType }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? 
    <Marker 
      position={position}
      icon={new L.Icon({
        iconUrl: markerType === 'pickup' 
          ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' 
          : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })}
    >
      <Popup>{markerType === 'pickup' ? 'Pickup Point' : 'Drop-off Point'}</Popup>
    </Marker> : null;
};

const BookRidePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [rideType, setRideType] = useState('standard');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [numberOfPassengers, setNumberOfPassengers] = useState(1);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateDetails, setEstimateDetails] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  // Map state
  const [mapCenter, setMapCenter] = useState([21.0278, 105.8342]); // Hanoi, Vietnam as default
  const [zoom, setZoom] = useState(13);
  const [pickupPosition, setPickupPosition] = useState(null);
  const [dropoffPosition, setDropoffPosition] = useState(null);
  const [selectingLocation, setSelectingLocation] = useState(null); // 'pickup', 'dropoff', or null
  
  // Trajectory-based state
  const [userTrajectories, setUserTrajectories] = useState([]);
  const [selectedTrajectory, setSelectedTrajectory] = useState(null);
  const [compatibleDrivers, setCompatibleDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    smoking: false,
    pets: false,
    music: false,
    conversation: false,
    gender_preference: '',
    min_rating: 4.0
  });
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef(null);

  // Handle ride type selection
  const handleRideTypeChange = (type) => {
    setRideType(type);
    // Reset estimate when changing ride type
    setEstimateDetails(null);
  };

  // Function to handle location selection from map
  const handleLocationSelect = (type) => {
    setSelectingLocation(type);
    
    // If we have the map reference, fly to the current center
    if (mapRef.current) {
      const map = mapRef.current;
      map.flyTo(mapCenter, zoom);
    }
  };

  // Update text inputs when map markers are placed
  useEffect(() => {
    if (pickupPosition) {
      // In a real app, you would use a geocoding service to get address from coordinates
      setPickupLocation(`${pickupPosition.lat.toFixed(6)}, ${pickupPosition.lng.toFixed(6)}`);
    }
  }, [pickupPosition]);

  useEffect(() => {
    if (dropoffPosition) {
      // In a real app, you would use a geocoding service to get address from coordinates
      setDropoffLocation(`${dropoffPosition.lat.toFixed(6)}, ${dropoffPosition.lng.toFixed(6)}`);
    }
  }, [dropoffPosition]);

  // Save selected location
  const handleSaveLocation = () => {
    if (selectingLocation === 'pickup' && pickupPosition) {
      setPickupLocation(`${pickupPosition.lat.toFixed(6)}, ${pickupPosition.lng.toFixed(6)}`);
    } else if (selectingLocation === 'dropoff' && dropoffPosition) {
      setDropoffLocation(`${dropoffPosition.lat.toFixed(6)}, ${dropoffPosition.lng.toFixed(6)}`);
    }
    
    setSelectingLocation(null);
  };

  // Get ride estimate
  const handleGetEstimate = async (e) => {
    e.preventDefault();

    if (!pickupLocation || !dropoffLocation) {
      toast.error('Please enter both pickup and dropoff locations');
      return;
    }

    try {
      setLoadingEstimate(true);
      const response = await api.post('/rides/estimate', {
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        number_of_passengers: numberOfPassengers,
        ride_type: rideType
      });

      setEstimateDetails(response.data.data);
      setLoadingEstimate(false);
    } catch (error) {
      console.error('Error getting ride estimate:', error);
      toast.error('Failed to get ride estimate. Please try again.');
      setLoadingEstimate(false);
    }
  };

  // Book ride
  const handleBookRide = async () => {
    if (!estimateDetails) {
      toast.error('Please get an estimate first');
      return;
    }

    if (!pickupTime) {
      toast.error('Please select a pickup time');
      return;
    }

    try {
      setBookingInProgress(true);
      const response = await api.post('/rides', {
        customer_id: currentUser.id,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_time: pickupTime,
        number_of_passengers: numberOfPassengers,
        distance: estimateDetails.distance,
        duration: estimateDetails.duration,
        price: estimateDetails.price,
        ride_type: rideType
      });

      toast.success('Ride booked successfully!');
      setBookingInProgress(false);

      // Redirect to ride details page or show confirmation
      navigate(`/rides/${response.data.data.id}`);
    } catch (error) {
      console.error('Error booking ride:', error);
      toast.error('Failed to book ride. Please try again.');
      setBookingInProgress(false);
    }
  };

  // Fetch user trajectories for trajectory-based matching
  useEffect(() => {
    if (rideType === 'trajectory-based' && currentUser) {
      const fetchTrajectories = async () => {
        try {
          setLoading(true);
          const response = await api.get('/trajectory/trajectories');
          setUserTrajectories(response.data.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching trajectories:', error);
          toast.error('Failed to load your saved routes');
          setLoading(false);
        }
      };
      
      fetchTrajectories();
    }
  }, [rideType, currentUser]);

  // Fetch user preferences from profile
  useEffect(() => {
    if (rideType === 'trajectory-based' && currentUser) {
      const fetchUserPreferences = async () => {
        try {
          const response = await api.get(`/users/profile/${currentUser.id}`);
          if (response.data.data.preferences) {
            try {
              const preferences = JSON.parse(response.data.data.preferences);
              setUserPreferences(preferences);
            } catch (e) {
              console.error('Error parsing preferences:', e);
            }
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
        }
      };
      
      fetchUserPreferences();
    }
  }, [rideType, currentUser]);

  // Handle trajectory selection
  const handleTrajectorySelect = async (trajectoryId) => {
    const trajectory = userTrajectories.find(t => t.id === parseInt(trajectoryId));
    setSelectedTrajectory(trajectory);
    
    if (trajectory) {
      setPickupPosition({
        lat: parseFloat(trajectory.origin_latitude),
        lng: parseFloat(trajectory.origin_longitude)
      });
      
      setDropoffPosition({
        lat: parseFloat(trajectory.destination_latitude),
        lng: parseFloat(trajectory.destination_longitude)
      });
      
      setPickupLocation(trajectory.origin_location);
      setDropoffLocation(trajectory.destination_location);
      
      // If we have the map reference, adjust the view
      if (mapRef.current) {
        const bounds = L.latLngBounds(
          [trajectory.origin_latitude, trajectory.origin_longitude],
          [trajectory.destination_latitude, trajectory.destination_longitude]
        );
        mapRef.current.fitBounds(bounds);
      }
      
      // Find compatible drivers
      try {
        setLoading(true);
        const response = await api.post('/trajectory/matching', {
          trajectory_id: trajectory.id,
          preferences: userPreferences
        });
        
        setCompatibleDrivers(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error finding compatible drivers:', error);
        toast.error('Failed to find compatible drivers');
        setLoading(false);
      }
    }
  };

  // Handle driver selection
  const handleDriverSelect = (driverId) => {
    const driver = compatibleDrivers.find(d => d.id === parseInt(driverId));
    setSelectedDriver(driver);
  };

  // Book trajectory-based ride
  const handleBookTrajectoryRide = async () => {
    if (!selectedTrajectory || !selectedDriver) {
      toast.error('Please select a route and a compatible driver');
      return;
    }

    if (!pickupTime) {
      toast.error('Please select a pickup time');
      return;
    }

    try {
      setBookingInProgress(true);
      const response = await api.post('/rides', {
        customer_id: currentUser.id,
        driver_id: selectedDriver.id,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_time: pickupTime,
        number_of_passengers: numberOfPassengers,
        distance: selectedTrajectory.distance || 0,
        duration: selectedTrajectory.duration || 0,
        price: selectedDriver.price || 0,
        ride_type: 'trajectory-based',
        trajectory_id: selectedTrajectory.id
      });

      toast.success('Ride booked successfully!');
      setBookingInProgress(false);
      navigate(`/rides/${response.data.data.id}`);
    } catch (error) {
      console.error('Error booking trajectory-based ride:', error);
      toast.error('Failed to book ride. Please try again.');
      setBookingInProgress(false);
    }
  };

  return (
    <div className="book-ride-page">
      <div className="page-header">
        <h1>Book a Ride</h1>
        <p>Choose your ride type and enter your trip details</p>
      </div>

      <div className="booking-container">
        <div className="ride-types-section">
          <h2>Ride Types</h2>
          <div className="ride-types">
            <div 
              className={`ride-type-card ${rideType === 'standard' ? 'selected' : ''}`}
              onClick={() => handleRideTypeChange('standard')}
            >
              <div className="ride-type-icon">🚗</div>
              <div className="ride-type-details">
                <h3>Standard</h3>
                <p>Regular ridesharing service</p>
              </div>
            </div>
            
            <div 
              className={`ride-type-card ${rideType === 'activity-based' ? 'selected' : ''}`}
              onClick={() => handleRideTypeChange('activity-based')}
            >
              <div className="ride-type-icon">📅</div>
              <div className="ride-type-details">
                <h3>Activity-Based</h3>
                <p>Match based on your schedule</p>
              </div>
            </div>
            
            <div 
              className={`ride-type-card ${rideType === 'trajectory-based' ? 'selected' : ''}`}
              onClick={() => handleRideTypeChange('trajectory-based')}
            >
              <div className="ride-type-icon">🗺️</div>
              <div className="ride-type-details">
                <h3>Profile & Trajectory</h3>
                <p>Match with compatible drivers on similar routes</p>
              </div>
            </div>
          </div>
          
          {rideType === 'activity-based' && (
            <div className="ride-type-info">
              <p>Activity-based ridesharing matches you with drivers based on your regular schedule.</p>
              <Link to="/activity-schedule" className="setup-link">
                Set up your activity schedule
              </Link>
            </div>
          )}
          
          {rideType === 'trajectory-based' && (
            <div className="ride-type-info">
              <p>Profile & Trajectory matching finds drivers with similar routes and compatible preferences.</p>
              <Link to="/trajectory-matching" className="setup-link">
                Set up your routes and preferences
              </Link>
            </div>
          )}
        </div>

        {rideType === 'standard' && (
          <div className="standard-booking-section">
            <h2>Trip Details</h2>
            
            <div className="map-section">
              <MapContainer 
                center={mapCenter} 
                zoom={zoom} 
                style={{ height: '300px', width: '100%', marginBottom: '20px' }}
                whenCreated={mapInstance => {
                  mapRef.current = mapInstance;
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {selectingLocation === 'pickup' && (
                  <LocationMarker 
                    position={pickupPosition} 
                    setPosition={setPickupPosition} 
                    markerType="pickup" 
                  />
                )}
                
                {selectingLocation === 'dropoff' && (
                  <LocationMarker 
                    position={dropoffPosition} 
                    setPosition={setDropoffPosition} 
                    markerType="dropoff" 
                  />
                )}
                
                {pickupPosition && selectingLocation !== 'pickup' && (
                  <Marker 
                    position={pickupPosition}
                    icon={new L.Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>Pickup point</Popup>
                  </Marker>
                )}
                
                {dropoffPosition && selectingLocation !== 'dropoff' && (
                  <Marker 
                    position={dropoffPosition}
                    icon={new L.Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>Dropoff point</Popup>
                  </Marker>
                )}
                
                {pickupPosition && dropoffPosition && (
                  <Polyline 
                    positions={[
                      [pickupPosition.lat, pickupPosition.lng],
                      [dropoffPosition.lat, dropoffPosition.lng]
                    ]}
                    color="#4e4376"
                    weight={3}
                    opacity={0.7}
                  />
                )}
              </MapContainer>
              
              {selectingLocation && (
                <div className="map-instructions">
                  <p>
                    {selectingLocation === 'pickup' 
                      ? 'Click on the map to set your pickup location' 
                      : 'Click on the map to set your destination location'}
                  </p>
                  <button 
                    className="done-btn"
                    onClick={handleSaveLocation}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            
            <form onSubmit={handleGetEstimate}>
              <div className="form-group">
                <label htmlFor="pickupLocation">Pickup Location</label>
                <div className="location-input-group">
                  <input 
                    type="text"
                    id="pickupLocation"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter pickup address"
                    required
                  />
                  <button 
                    type="button"
                    className="map-select-btn"
                    onClick={() => handleLocationSelect('pickup')}
                  >
                    Select on Map
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="dropoffLocation">Dropoff Location</label>
                <div className="location-input-group">
                  <input 
                    type="text"
                    id="dropoffLocation"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    placeholder="Enter destination address"
                    required
                  />
                  <button 
                    type="button"
                    className="map-select-btn"
                    onClick={() => handleLocationSelect('dropoff')}
                  >
                    Select on Map
                  </button>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pickupTime">Pickup Time</label>
                  <input 
                    type="datetime-local"
                    id="pickupTime"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="numberOfPassengers">Passengers</label>
                  <select 
                    id="numberOfPassengers"
                    value={numberOfPassengers}
                    onChange={(e) => setNumberOfPassengers(Number(e.target.value))}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="estimate-btn"
                disabled={loadingEstimate}
              >
                {loadingEstimate ? 'Getting Estimate...' : 'Get Estimate'}
              </button>
            </form>
            
            {estimateDetails && (
              <div className="estimate-details">
                <h3>Ride Estimate</h3>
                <div className="estimate-info">
                  <div className="estimate-item">
                    <span className="estimate-label">Distance</span>
                    <span className="estimate-value">{estimateDetails.distance} km</span>
                  </div>
                  
                  <div className="estimate-item">
                    <span className="estimate-label">Duration</span>
                    <span className="estimate-value">{Math.round(estimateDetails.duration / 60)} min</span>
                  </div>
                  
                  <div className="estimate-item">
                    <span className="estimate-label">Price</span>
                    <span className="estimate-value">{estimateDetails.price.toLocaleString()} VND</span>
                  </div>
                </div>
                
                <button 
                  className="book-btn"
                  onClick={handleBookRide}
                  disabled={bookingInProgress || !pickupTime}
                >
                  {bookingInProgress ? 'Booking...' : 'Book Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {rideType === 'trajectory-based' && (
          <div className="trajectory-booking-section">
            <h2>Route-Based Matching</h2>
            
            {userTrajectories.length === 0 ? (
              <div className="empty-state">
                <p>You haven't set up any frequent routes yet.</p>
                <div className="trajectory-actions">
                  <Link to="/trajectory-matching" className="setup-link">
                    Set up your routes and preferences
                  </Link>
                  <Link to="/trajectory-matching?addRoute=true" className="add-route-btn">
                    + Add New Route
                  </Link>
                </div>
                <p className="help-text">Adding your regular routes helps us find the best ride matches based on your travel patterns</p>
              </div>
            ) : (
              <>
                <div className="map-section">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={zoom} 
                    style={{ height: '300px', width: '100%', marginBottom: '20px' }}
                    whenCreated={mapInstance => {
                      mapRef.current = mapInstance;
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {pickupPosition && (
                      <Marker 
                        position={pickupPosition}
                        icon={new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                        })}
                      >
                        <Popup>Starting point</Popup>
                      </Marker>
                    )}
                    
                    {dropoffPosition && (
                      <Marker 
                        position={dropoffPosition}
                        icon={new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                        })}
                      >
                        <Popup>Destination point</Popup>
                      </Marker>
                    )}
                    
                    {pickupPosition && dropoffPosition && (
                      <Polyline 
                        positions={[
                          [pickupPosition.lat, pickupPosition.lng],
                          [dropoffPosition.lat, dropoffPosition.lng]
                        ]}
                        color="#4e4376"
                        weight={3}
                        opacity={0.7}
                      />
                    )}
                  </MapContainer>
                </div>
                
                <form className="trajectory-form">
                  <div className="form-group">
                    <label htmlFor="trajectory">Select Your Route</label>
                    <select
                      id="trajectory"
                      value={selectedTrajectory ? selectedTrajectory.id : ''}
                      onChange={(e) => handleTrajectorySelect(e.target.value)}
                    >
                      <option value="">-- Select a route --</option>
                      {userTrajectories.map(trajectory => (
                        <option key={trajectory.id} value={trajectory.id}>
                          {trajectory.name} ({trajectory.origin_location} to {trajectory.destination_location})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="pickupTime">Pickup Time</label>
                    <input 
                      type="datetime-local"
                      id="pickupTime"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="numberOfPassengers">Passengers</label>
                    <select 
                      id="numberOfPassengers"
                      value={numberOfPassengers}
                      onChange={(e) => setNumberOfPassengers(Number(e.target.value))}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </form>
                
                {loading ? (
                  <div className="loading-state">Finding compatible drivers...</div>
                ) : compatibleDrivers.length > 0 && selectedTrajectory ? (
                  <div className="compatible-drivers">
                    <h3>Compatible Drivers</h3>
                    <p>Select a driver that matches your preferences</p>
                    
                    <div className="driver-list">
                      {compatibleDrivers.map(driver => (
                        <div 
                          key={driver.id} 
                          className={`driver-card ${selectedDriver && selectedDriver.id === driver.id ? 'selected' : ''}`}
                          onClick={() => handleDriverSelect(driver.id)}
                        >
                          <div className="driver-avatar">
                            {driver.profile_pic ? (
                              <img src={driver.profile_pic} alt={`${driver.name}`} />
                            ) : (
                              <div className="avatar-placeholder">
                                {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                              </div>
                            )}
                          </div>
                          <div className="driver-info">
                            <h4>{driver.name}</h4>
                            <div className="driver-details">
                              <span className="rating">⭐ {driver.rating || '4.5'}</span>
                              <span className="match-score">
                                {driver.match_score || '95'}% match
                              </span>
                            </div>
                            <div className="driver-preferences">
                              {driver.preferences?.smoking && <span className="pref-tag">🚬</span>}
                              {driver.preferences?.pets && <span className="pref-tag">🐾</span>}
                              {driver.preferences?.music && <span className="pref-tag">🎵</span>}
                              {driver.preferences?.conversation && <span className="pref-tag">💬</span>}
                            </div>
                            <div className="price-estimate">
                              ~{driver.price?.toLocaleString() || '120,000'} VND
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      className="book-btn"
                      onClick={handleBookTrajectoryRide}
                      disabled={bookingInProgress || !selectedDriver || !pickupTime}
                    >
                      {bookingInProgress ? 'Booking...' : 'Book Now'}
                    </button>
                  </div>
                ) : selectedTrajectory ? (
                  <div className="no-drivers-found">
                    <p>No compatible drivers found at the moment. Try adjusting your preferences or selecting a different route.</p>
                    <Link to="/trajectory-matching" className="setup-link">
                      Update your preferences
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
        
        {rideType === 'activity-based' && (
          <div className="activity-booking-section">
            <h2>Activity-Based Matching</h2>
            <p>This feature will match you with drivers based on your activity schedule.</p>
            <Link to="/activity-schedule" className="setup-link">
              Set up your activity schedule
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookRidePage;