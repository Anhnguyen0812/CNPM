import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './TrajectoryMatchingPage.css';
import { useLocation } from 'react-router-dom';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Location picker component
const LocationPicker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click: (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Selected location</Popup>
    </Marker>
  ) : null;
};

const TrajectoryMatchingPage = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [trajectories, setTrajectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTrajectory, setCurrentTrajectory] = useState(null);
  const [originPosition, setOriginPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [selectingLocation, setSelectingLocation] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [preferences, setPreferences] = useState({
    smoking: false,
    pets: false,
    music: false,
    conversation: false,
    gender_preference: '',
    ageGroup: ''
  });

  // New trajectory form state
  const [newTrajectory, setNewTrajectory] = useState({
    name: '',
    origin_location: '',
    origin_latitude: '',
    origin_longitude: '',
    destination_location: '',
    destination_latitude: '',
    destination_longitude: '',
    usual_departure_time: '',
    usual_days: '1,2,3,4,5',
    waypoints: []
  });

  // Fetch user trajectories
  useEffect(() => {
    const fetchTrajectories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/trajectory/trajectories');
        setTrajectories(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trajectories:', error);
        toast.error('Failed to load trajectories');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTrajectories();
    }
  }, [currentUser]);

  // Check for URL query parameters
  useEffect(() => {
    // Check if we should automatically open the add form
    const params = new URLSearchParams(location.search);
    if (params.get('addRoute') === 'true') {
      setShowAddForm(true);
      setShowMatches(false);
    }
  }, [location]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrajectory({
      ...newTrajectory,
      [name]: value
    });
  };

  // Handle preferences change
  const handlePreferenceChange = (e) => {
    const { name, value, checked, type } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Update user profile with preferences
  const updateProfilePreferences = async () => {
    try {
      await api.post(`/users/profile/${currentUser.id}`, {
        preferences: JSON.stringify(preferences)
      });
      toast.success('Profile preferences updated successfully');
    } catch (error) {
      console.error('Error updating profile preferences:', error);
      toast.error('Failed to update profile preferences');
    }
  };

  // Handle location selection
  const handleLocationSelect = (type) => {
    setSelectingLocation(type);
  };

  // Save selected location
  const handleSaveLocation = () => {
    if (selectingLocation === 'origin' && originPosition) {
      setNewTrajectory({
        ...newTrajectory,
        origin_latitude: originPosition.lat,
        origin_longitude: originPosition.lng,
        origin_location: `${originPosition.lat.toFixed(6)}, ${originPosition.lng.toFixed(6)}`
      });
    } else if (selectingLocation === 'destination' && destinationPosition) {
      setNewTrajectory({
        ...newTrajectory,
        destination_latitude: destinationPosition.lat,
        destination_longitude: destinationPosition.lng,
        destination_location: `${destinationPosition.lat.toFixed(6)}, ${destinationPosition.lng.toFixed(6)}`
      });
    } else if (selectingLocation === 'waypoint') {
      const newWaypoint = {
        location: `Waypoint ${waypoints.length + 1}`,
        latitude: waypoints[waypoints.length - 1].lat,
        longitude: waypoints[waypoints.length - 1].lng
      };
      
      setNewTrajectory({
        ...newTrajectory,
        waypoints: [...newTrajectory.waypoints, newWaypoint]
      });
    }
    
    setSelectingLocation(null);
  };

  // Add waypoint to trajectory
  const handleAddWaypoint = () => {
    if (!originPosition || !destinationPosition) {
      toast.error('Please set origin and destination first');
      return;
    }

    setSelectingLocation('waypoint');
    toast.info('Click on the map to add a waypoint');
  };

  // Remove waypoint
  const handleRemoveWaypoint = (index) => {
    const updatedWaypoints = [...newTrajectory.waypoints];
    updatedWaypoints.splice(index, 1);
    setNewTrajectory({
      ...newTrajectory,
      waypoints: updatedWaypoints
    });
  };

  // Create a new trajectory
  const handleCreateTrajectory = async (e) => {
    e.preventDefault();
    
    if (!newTrajectory.name || !newTrajectory.origin_location || !newTrajectory.destination_location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await api.post('/trajectory/trajectories', newTrajectory);
      
      setTrajectories([...trajectories, response.data.data]);
      
      // Reset form
      setNewTrajectory({
        name: '',
        origin_location: '',
        origin_latitude: '',
        origin_longitude: '',
        destination_location: '',
        destination_latitude: '',
        destination_longitude: '',
        usual_departure_time: '',
        usual_days: '1,2,3,4,5',
        waypoints: []
      });
      
      setOriginPosition(null);
      setDestinationPosition(null);
      setWaypoints([]);
      setShowAddForm(false);
      
      toast.success('Trajectory created successfully');
    } catch (error) {
      console.error('Error creating trajectory:', error);
      toast.error('Failed to create trajectory');
    }
  };

  // Delete a trajectory
  const handleDeleteTrajectory = async (trajectoryId) => {
    try {
      await api.delete(`/trajectory/trajectories/${trajectoryId}`);
      
      // Remove the trajectory from the list
      setTrajectories(trajectories.filter(traj => traj.id !== trajectoryId));
      
      toast.success('Trajectory deleted successfully');
    } catch (error) {
      console.error('Error deleting trajectory:', error);
      toast.error('Failed to delete trajectory');
    }
  };

  // Find matches for a trajectory
  const handleFindMatches = async (trajectoryId) => {
    try {
      setLoading(true);
      const response = await api.get('/trajectory/matches', {
        params: {
          trajectoryId: trajectoryId,
          minSimilarity: 0.6
        }
      });
      
      setMatches(response.data.data);
      setShowMatches(true);
      setLoading(false);
      
      if (response.data.data.length === 0) {
        toast.info('No matches found for this trajectory.');
      } else {
        toast.success(`Found ${response.data.data.length} potential matches!`);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find matches');
      setLoading(false);
    }
  };

  // Create a trajectory-based ride
  const handleCreateRide = async (match) => {
    try {
      // Prepare ride data from the match
      const rideData = {
        customer_id: currentUser.id,
        driver_id: match.match_user_id,
        pickup_location: match.user_trajectory.origin_location,
        pickup_latitude: match.user_trajectory.origin_latitude,
        pickup_longitude: match.user_trajectory.origin_longitude,
        dropoff_location: match.user_trajectory.destination_location,
        dropoff_latitude: match.user_trajectory.destination_latitude,
        dropoff_longitude: match.user_trajectory.destination_longitude,
        distance: 10, // Placeholder, would be calculated
        duration: 30, // Estimated duration in minutes
        price: 150000, // Placeholder price
        scheduled_time: new Date().toISOString(),
        passenger_trajectory_id: match.user_trajectory.id,
        driver_trajectory_id: match.match_trajectory.id,
        trajectory_similarity: match.trajectory_similarity,
        profile_compatibility: match.profile_compatibility,
        combined_score: match.combined_score
      };
      
      const response = await api.post('/trajectory/rides', rideData);
      
      toast.success('Ride request submitted successfully!');
      
      // Redirect to ride details page or show confirmation
      // history.push(`/active-ride/${response.data.data.id}`);
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error('Failed to create ride');
    }
  };

  // Format days of week display
  const formatDaysOfWeek = (daysString) => {
    if (!daysString) return '';
    
    const days = daysString.split(',');
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map(day => dayNames[parseInt(day) - 1]).join(', ');
  };

  // Format time display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && trajectories.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your trajectories...</p>
      </div>
    );
  }

  return (
    <div className="trajectory-matching-page">
      <div className="page-header">
        <h1>Profile & Trajectory Matching</h1>
        <p>Set up your regular routes and find compatible ride matches</p>
      </div>
      
      <div className="trajectory-container">
        <div className="sidebar">
          <div className="sidebar-section">
            <h2>Your Travel Routes</h2>
            
            {trajectories.length === 0 && !showAddForm ? (
              <div className="no-trajectories">
                <p>You haven't added any regular routes yet.</p>
                <button 
                  className="add-trajectory-btn"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Your First Route
                </button>
              </div>
            ) : (
              <>
                {!showAddForm && (
                  <button 
                    className="add-trajectory-btn"
                    onClick={() => {
                      setShowAddForm(true);
                      setShowMatches(false);
                    }}
                  >
                    + Add New Route
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="sidebar-section">
            <h2>Travel Preferences</h2>
            <div className="preferences-form">
              <div className="preference-group">
                <label htmlFor="gender_preference">Preferred Gender</label>
                <select 
                  id="gender_preference"
                  name="gender_preference"
                  value={preferences.gender_preference}
                  onChange={handlePreferenceChange}
                >
                  <option value="">No preference</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div className="preference-group">
                <label htmlFor="ageGroup">Age Group</label>
                <select 
                  id="ageGroup"
                  name="ageGroup"
                  value={preferences.ageGroup}
                  onChange={handlePreferenceChange}
                >
                  <option value="">No preference</option>
                  <option value="18-25">18-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-50">36-50</option>
                  <option value="51+">51+</option>
                </select>
              </div>
              
              <div className="preference-options">
                <label className="preference-checkbox">
                  <input 
                    type="checkbox"
                    name="smoking"
                    checked={preferences.smoking}
                    onChange={handlePreferenceChange}
                  />
                  No smoking
                </label>
                
                <label className="preference-checkbox">
                  <input 
                    type="checkbox"
                    name="pets"
                    checked={preferences.pets}
                    onChange={handlePreferenceChange}
                  />
                  Pet friendly
                </label>
                
                <label className="preference-checkbox">
                  <input 
                    type="checkbox"
                    name="music"
                    checked={preferences.music}
                    onChange={handlePreferenceChange}
                  />
                  Enjoys music
                </label>
                
                <label className="preference-checkbox">
                  <input 
                    type="checkbox"
                    name="conversation"
                    checked={preferences.conversation}
                    onChange={handlePreferenceChange}
                  />
                  Enjoys conversation
                </label>
              </div>
              
              <button 
                className="save-preferences-btn"
                onClick={updateProfilePreferences}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
        
        <div className="main-content">
          {showAddForm ? (
            <div className="add-trajectory-form">
              <div className="form-header">
                <h2>Add New Route</h2>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddForm(false);
                    setOriginPosition(null);
                    setDestinationPosition(null);
                    setWaypoints([]);
                  }}
                >
                  Cancel
                </button>
              </div>
              
              <div className="form-content">
                <div className="map-container">
                  <MapContainer 
                    center={[21.0278, 105.8342]} 
                    zoom={13} 
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {selectingLocation === 'origin' && (
                      <LocationPicker 
                        position={originPosition} 
                        setPosition={setOriginPosition} 
                      />
                    )}
                    
                    {selectingLocation === 'destination' && (
                      <LocationPicker 
                        position={destinationPosition} 
                        setPosition={setDestinationPosition} 
                      />
                    )}
                    
                    {selectingLocation === 'waypoint' && (
                      <LocationPicker 
                        position={waypoints[waypoints.length - 1]} 
                        setPosition={(pos) => {
                          const updatedWaypoints = [...waypoints];
                          updatedWaypoints[waypoints.length - 1] = pos;
                          setWaypoints(updatedWaypoints);
                        }} 
                      />
                    )}
                    
                    {originPosition && selectingLocation !== 'origin' && (
                      <Marker 
                        position={originPosition}
                        icon={new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                        })}
                      >
                        <Popup>Origin: {newTrajectory.origin_location}</Popup>
                      </Marker>
                    )}
                    
                    {destinationPosition && selectingLocation !== 'destination' && (
                      <Marker 
                        position={destinationPosition}
                        icon={new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                        })}
                      >
                        <Popup>Destination: {newTrajectory.destination_location}</Popup>
                      </Marker>
                    )}
                    
                    {newTrajectory.waypoints.length > 0 && (
                      newTrajectory.waypoints.map((waypoint, index) => (
                        <Marker 
                          key={index}
                          position={[waypoint.latitude, waypoint.longitude]}
                          icon={new L.Icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                          })}
                        >
                          <Popup>Waypoint {index + 1}</Popup>
                        </Marker>
                      ))
                    )}
                    
                    {/* Draw route lines if origin and destination are set */}
                    {originPosition && destinationPosition && (
                      <Polyline 
                        positions={[
                          [originPosition.lat, originPosition.lng],
                          ...newTrajectory.waypoints.map(wp => [wp.latitude, wp.longitude]),
                          [destinationPosition.lat, destinationPosition.lng]
                        ]}
                        color="#4e4376"
                        weight={4}
                        opacity={0.7}
                      />
                    )}
                  </MapContainer>
                  
                  {selectingLocation && (
                    <div className="map-instructions">
                      <p>
                        {selectingLocation === 'origin' && 'Click on the map to set your origin point'}
                        {selectingLocation === 'destination' && 'Click on the map to set your destination point'}
                        {selectingLocation === 'waypoint' && 'Click on the map to add a waypoint'}
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
                
                <form onSubmit={handleCreateTrajectory}>
                  <div className="form-group">
                    <label htmlFor="name">Route Name</label>
                    <input 
                      type="text"
                      id="name"
                      name="name"
                      placeholder="e.g., Home to Work"
                      value={newTrajectory.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="origin_location">Origin</label>
                      <div className="location-input-group">
                        <input 
                          type="text"
                          id="origin_location"
                          name="origin_location"
                          placeholder="e.g., Home"
                          value={newTrajectory.origin_location}
                          onChange={handleInputChange}
                          required
                          readOnly={originPosition !== null}
                        />
                        <button 
                          type="button"
                          className="map-select-btn"
                          onClick={() => handleLocationSelect('origin')}
                        >
                          Select on Map
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="destination_location">Destination</label>
                      <div className="location-input-group">
                        <input 
                          type="text"
                          id="destination_location"
                          name="destination_location"
                          placeholder="e.g., Work"
                          value={newTrajectory.destination_location}
                          onChange={handleInputChange}
                          required
                          readOnly={destinationPosition !== null}
                        />
                        <button 
                          type="button"
                          className="map-select-btn"
                          onClick={() => handleLocationSelect('destination')}
                        >
                          Select on Map
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="usual_departure_time">Usual Departure Time</label>
                      <input 
                        type="time"
                        id="usual_departure_time"
                        name="usual_departure_time"
                        value={newTrajectory.usual_departure_time}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="usual_days">Usual Days</label>
                      <select 
                        id="usual_days"
                        name="usual_days"
                        value={newTrajectory.usual_days}
                        onChange={handleInputChange}
                      >
                        <option value="1,2,3,4,5">Weekdays (Mon-Fri)</option>
                        <option value="6,7">Weekends (Sat-Sun)</option>
                        <option value="1,2,3,4,5,6,7">Every day</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="7">Sunday</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="waypoints-section">
                    <div className="waypoints-header">
                      <h3>Waypoints</h3>
                      <button 
                        type="button"
                        className="add-waypoint-btn"
                        onClick={() => {
                          if (originPosition && destinationPosition) {
                            const midpoint = {
                              lat: (originPosition.lat + destinationPosition.lat) / 2,
                              lng: (originPosition.lng + destinationPosition.lng) / 2
                            };
                            setWaypoints([...waypoints, midpoint]);
                            handleAddWaypoint();
                          } else {
                            toast.error('Please set origin and destination first');
                          }
                        }}
                      >
                        + Add Waypoint
                      </button>
                    </div>
                    
                    {newTrajectory.waypoints.length > 0 ? (
                      <div className="waypoints-list">
                        {newTrajectory.waypoints.map((waypoint, index) => (
                          <div key={index} className="waypoint-item">
                            <div className="waypoint-details">
                              <span className="waypoint-number">#{index + 1}</span>
                              <span className="waypoint-coords">
                                {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                              </span>
                            </div>
                            <button 
                              type="button"
                              className="remove-waypoint-btn"
                              onClick={() => handleRemoveWaypoint(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-waypoints">No waypoints added yet</p>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      Create Route
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : showMatches ? (
            <div className="matches-container">
              <div className="matches-header">
                <h2>Matching Results</h2>
                <button 
                  className="back-btn"
                  onClick={() => setShowMatches(false)}
                >
                  Back to Routes
                </button>
              </div>
              
              {matches.length === 0 ? (
                <div className="no-matches">
                  <p>No compatible matches found at this time.</p>
                  <p>Try again later or create a different route.</p>
                </div>
              ) : (
                <div className="matches-list">
                  {matches.map((match, index) => (
                    <div key={index} className="match-card">
                      <div className="match-header">
                        <h3>Match with {match.user_name}</h3>
                        <div className="match-score">
                          <div className="score-item">
                            <span className="score-label">Overall</span>
                            <span className="score-value">{(match.combined_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="match-body">
                        <div className="match-routes">
                          <div className="route-item your-route">
                            <h4>Your Route</h4>
                            <div className="route-details">
                              <div className="route-endpoints">
                                <div className="endpoint origin">
                                  <div className="endpoint-icon">A</div>
                                  <div className="endpoint-location">{match.user_trajectory.origin_location}</div>
                                </div>
                                <div className="endpoint-arrow">→</div>
                                <div className="endpoint destination">
                                  <div className="endpoint-icon">B</div>
                                  <div className="endpoint-location">{match.user_trajectory.destination_location}</div>
                                </div>
                              </div>
                              
                              {match.user_trajectory.usual_departure_time && (
                                <div className="route-time">
                                  Departure: {formatTime(match.user_trajectory.usual_departure_time)} on {formatDaysOfWeek(match.user_trajectory.usual_days)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="route-item match-route">
                            <h4>{match.user_name}'s Route</h4>
                            <div className="route-details">
                              <div className="route-endpoints">
                                <div className="endpoint origin">
                                  <div className="endpoint-icon">A</div>
                                  <div className="endpoint-location">{match.match_trajectory.origin_location}</div>
                                </div>
                                <div className="endpoint-arrow">→</div>
                                <div className="endpoint destination">
                                  <div className="endpoint-icon">B</div>
                                  <div className="endpoint-location">{match.match_trajectory.destination_location}</div>
                                </div>
                              </div>
                              
                              {match.match_trajectory.usual_departure_time && (
                                <div className="route-time">
                                  Departure: {formatTime(match.match_trajectory.usual_departure_time)} on {formatDaysOfWeek(match.match_trajectory.usual_days)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="match-metrics">
                          <div className="metric-item">
                            <span className="metric-label">Route Similarity</span>
                            <div className="progress-bar">
                              <div 
                                className="progress" 
                                style={{ width: `${match.trajectory_similarity * 100}%` }}
                              ></div>
                            </div>
                            <span className="metric-value">{(match.trajectory_similarity * 100).toFixed(0)}%</span>
                          </div>
                          
                          <div className="metric-item">
                            <span className="metric-label">Profile Compatibility</span>
                            <div className="progress-bar">
                              <div 
                                className="progress" 
                                style={{ width: `${match.profile_compatibility * 100}%` }}
                              ></div>
                            </div>
                            <span className="metric-value">{(match.profile_compatibility * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="match-actions">
                        <button 
                          className="book-ride-btn"
                          onClick={() => handleCreateRide(match)}
                        >
                          Book Ride with {match.user_name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="trajectories-list">
              {trajectories.length === 0 ? (
                <div className="no-trajectories">
                  <p>You haven't added any regular routes yet.</p>
                  <p>Click the "Add Your First Route" button to get started.</p>
                </div>
              ) : (
                <>
                  <h2>Your Saved Routes</h2>
                  <div className="trajectory-cards">
                    {trajectories.map(trajectory => (
                      <div key={trajectory.id} className="trajectory-card">
                        <div className="trajectory-header">
                          <h3>{trajectory.name}</h3>
                          {trajectory.is_active && (
                            <span className="active-badge">Active</span>
                          )}
                        </div>
                        
                        <div className="trajectory-body">
                          <div className="endpoints">
                            <div className="endpoint origin">
                              <div className="endpoint-icon">A</div>
                              <div className="endpoint-location">{trajectory.origin_location}</div>
                            </div>
                            
                            <div className="route-line">
                              {trajectory.waypoints && trajectory.waypoints.length > 0 && (
                                <div className="waypoints">
                                  {trajectory.waypoints.map((_, index) => (
                                    <div key={index} className="waypoint-dot"></div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="endpoint destination">
                              <div className="endpoint-icon">B</div>
                              <div className="endpoint-location">{trajectory.destination_location}</div>
                            </div>
                          </div>
                          
                          {trajectory.usual_departure_time && (
                            <div className="schedule">
                              <div className="schedule-time">
                                <span className="schedule-label">Departure:</span>
                                <span className="time">{formatTime(trajectory.usual_departure_time)}</span>
                              </div>
                              
                              <div className="schedule-days">
                                <span className="schedule-label">Days:</span>
                                <span className="days">{formatDaysOfWeek(trajectory.usual_days)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="trajectory-actions">
                          <button 
                            className="find-matches-btn"
                            onClick={() => handleFindMatches(trajectory.id)}
                          >
                            Find Matches
                          </button>
                          
                          <button 
                            className="delete-trajectory-btn"
                            onClick={() => handleDeleteTrajectory(trajectory.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrajectoryMatchingPage;