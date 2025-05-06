import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './ActivitySchedulePage.css';

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

const ActivitySchedulePage = () => {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [scheduleActivities, setScheduleActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [activityMarkerPosition, setActivityMarkerPosition] = useState(null);
  const [alternativeLocations, setAlternativeLocations] = useState([]);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [tripChains, setTripChains] = useState([]);
  const [showTripChains, setShowTripChains] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [activityMatches, setActivityMatches] = useState([]);
  
  // New activity form state
  const [newActivity, setNewActivity] = useState({
    schedule_id: '',
    activity_type: 'work',
    location: '',
    latitude: '',
    longitude: '',
    start_time: '',
    end_time: '',
    days_of_week: '1,2,3,4,5', // Default to weekdays
    is_flexible: false,
    flexibility_radius: 500,
    max_detour_time: 10
  });

  // Fetch user schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const response = await api.get('/abra/schedules');
        setSchedules(response.data.data);
        
        // If there are schedules, select the first one
        if (response.data.data.length > 0) {
          setCurrentSchedule(response.data.data[0]);
          fetchScheduleActivities(response.data.data[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        toast.error('Failed to load schedules');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSchedules();
    }
  }, [currentUser]);

  // Fetch activities for a schedule
  const fetchScheduleActivities = async (scheduleId) => {
    try {
      setLoading(true);
      const response = await api.get(`/abra/schedules/${scheduleId}/activities`);
      setScheduleActivities(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule activities:', error);
      toast.error('Failed to load activities');
      setLoading(false);
    }
  };

  // Create a new schedule
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    if (!newScheduleName.trim()) {
      toast.error('Please enter a schedule name');
      return;
    }
    
    try {
      const response = await api.post('/abra/schedules', {
        name: newScheduleName
      });
      
      setSchedules([...schedules, response.data.data]);
      setCurrentSchedule(response.data.data);
      setScheduleActivities([]);
      setNewScheduleName('');
      setShowAddScheduleForm(false);
      
      toast.success('Schedule created successfully');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  // Handle activity form input change
  const handleActivityInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewActivity({
      ...newActivity,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle location selection from map
  const handleLocationSelect = () => {
    if (activityMarkerPosition) {
      setNewActivity({
        ...newActivity,
        latitude: activityMarkerPosition.lat,
        longitude: activityMarkerPosition.lng,
        location: `${activityMarkerPosition.lat.toFixed(6)}, ${activityMarkerPosition.lng.toFixed(6)}`
      });
      setShowLocationSelector(false);
    }
  };

  // Create a new activity
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newActivity.location || !newActivity.start_time || !newActivity.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // Include the current schedule ID
      const activityData = {
        ...newActivity,
        schedule_id: currentSchedule.id
      };
      
      const response = await api.post('/abra/activities', activityData);
      
      // Add the new activity to the list
      setScheduleActivities([...scheduleActivities, response.data.data]);
      
      // Reset the form
      setNewActivity({
        schedule_id: currentSchedule.id,
        activity_type: 'work',
        location: '',
        latitude: '',
        longitude: '',
        start_time: '',
        end_time: '',
        days_of_week: '1,2,3,4,5',
        is_flexible: false,
        flexibility_radius: 500,
        max_detour_time: 10
      });
      
      setActivityMarkerPosition(null);
      setShowAddActivityForm(false);
      
      toast.success('Activity created successfully');
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    }
  };

  // Delete an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      await api.delete(`/abra/activities/${activityId}`);
      
      // Remove the activity from the list
      setScheduleActivities(scheduleActivities.filter(activity => activity.id !== activityId));
      
      toast.success('Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  // Find alternative locations
  const handleFindAlternativeLocations = async (activityId) => {
    try {
      const response = await api.get(`/abra/activities/${activityId}/alternative-locations`);
      setAlternativeLocations(response.data.data);
      toast.info(`Found ${response.data.data.length} alternative locations`);
    } catch (error) {
      console.error('Error finding alternative locations:', error);
      toast.error('Failed to find alternative locations');
    }
  };

  // Generate trip chains
  const handleGenerateTripChains = async () => {
    try {
      const response = await api.get('/abra/trip-chains');
      setTripChains(response.data.data);
      setShowTripChains(true);
      
      if (response.data.data.length === 0) {
        toast.info('No trip chains found. Try adding more activities to your schedule.');
      } else {
        toast.success(`Generated ${response.data.data.length} trip chains`);
      }
    } catch (error) {
      console.error('Error generating trip chains:', error);
      toast.error('Failed to generate trip chains');
    }
  };

  // Find activity-based matches
  const handleFindMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/abra/matches');
      setActivityMatches(response.data.data);
      setShowMatches(true);
      setShowTripChains(false);
      setLoading(false);
      
      if (response.data.data.length === 0) {
        toast.info('No matches found at this time. Try again later or modify your schedule.');
      } else {
        toast.success(`Found ${response.data.data.length} potential matches`);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find matches');
      setLoading(false);
    }
  };

  // Create a ride from a match
  const handleCreateRide = async (match) => {
    try {
      // Prepare ride data from the match
      const rideData = {
        customer_id: currentUser.id,
        driver_id: match.match_user_id,
        pickup_location: match.activity_location,
        pickup_latitude: match.latitude,
        pickup_longitude: match.longitude,
        dropoff_location: match.trip_chain.destination_activity.location,
        dropoff_latitude: match.trip_chain.destination_activity.latitude,
        dropoff_longitude: match.trip_chain.destination_activity.longitude,
        distance: match.detour_distance,
        duration: 30, // Estimated duration in minutes
        price: Math.floor(match.detour_distance * 10000), // Simple price estimation
        scheduled_time: new Date().toISOString(),
        passenger_activity_id: match.activity_id,
        driver_activity_id: null, // Will be set by the driver
        match_score: match.match_score,
        detour_time: 10 // Default detour time
      };
      
      const response = await api.post('/abra/rides', rideData);
      
      toast.success('Ride request submitted successfully!');
      
      // Redirect to ride details page
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
    
    // Time is in HH:MM:SS format, convert to HH:MM AM/PM
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your schedules...</p>
      </div>
    );
  }

  return (
    <div className="activity-schedule-page">
      <div className="page-header">
        <h1>Activity Schedules</h1>
        <p>Manage your daily activities to find better ride matches</p>
      </div>
      
      <div className="schedule-container">
        <div className="schedules-sidebar">
          <h2>Your Schedules</h2>
          
          {schedules.length === 0 && !showAddScheduleForm ? (
            <div className="no-schedules">
              <p>You don't have any activity schedules yet.</p>
              <button 
                className="add-schedule-btn"
                onClick={() => setShowAddScheduleForm(true)}
              >
                Create Your First Schedule
              </button>
            </div>
          ) : (
            <>
              <ul className="schedule-list">
                {schedules.map(schedule => (
                  <li 
                    key={schedule.id} 
                    className={currentSchedule && schedule.id === currentSchedule.id ? 'active' : ''}
                    onClick={() => {
                      setCurrentSchedule(schedule);
                      fetchScheduleActivities(schedule.id);
                      setShowAddActivityForm(false);
                      setShowTripChains(false);
                      setShowMatches(false);
                    }}
                  >
                    <span className="schedule-name">{schedule.name}</span>
                    <span className="schedule-status">
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </li>
                ))}
              </ul>
              
              {!showAddScheduleForm ? (
                <button 
                  className="add-schedule-btn"
                  onClick={() => setShowAddScheduleForm(true)}
                >
                  + New Schedule
                </button>
              ) : (
                <div className="add-schedule-form">
                  <h3>Create New Schedule</h3>
                  <form onSubmit={handleCreateSchedule}>
                    <div className="form-group">
                      <label htmlFor="scheduleName">Schedule Name</label>
                      <input 
                        type="text" 
                        id="scheduleName"
                        placeholder="e.g., Weekday Routine"
                        value={newScheduleName}
                        onChange={(e) => setNewScheduleName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">Create</button>
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => {
                          setShowAddScheduleForm(false);
                          setNewScheduleName('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {currentSchedule && (
                <div className="schedule-actions">
                  <button 
                    className="generate-trips-btn"
                    onClick={handleGenerateTripChains}
                  >
                    Generate Trip Chains
                  </button>
                  
                  <button 
                    className="find-matches-btn"
                    onClick={handleFindMatches}
                  >
                    Find Activity Matches
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="activities-main">
          {currentSchedule ? (
            <>
              <div className="activities-header">
                <h2>{currentSchedule.name}</h2>
                <button 
                  className="add-activity-btn"
                  onClick={() => {
                    setShowAddActivityForm(!showAddActivityForm);
                    setShowTripChains(false);
                    setShowMatches(false);
                  }}
                >
                  {showAddActivityForm ? 'Cancel' : '+ Add Activity'}
                </button>
              </div>
              
              {showAddActivityForm && (
                <div className="add-activity-form">
                  <h3>Add New Activity</h3>
                  
                  {showLocationSelector ? (
                    <div className="location-selector">
                      <div className="map-container">
                        <MapContainer 
                          center={[21.0278, 105.8342]} 
                          zoom={13} 
                          style={{ height: '300px', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <LocationPicker 
                            position={activityMarkerPosition} 
                            setPosition={setActivityMarkerPosition} 
                          />
                        </MapContainer>
                      </div>
                      
                      <div className="location-selector-actions">
                        <button 
                          className="select-location-btn"
                          onClick={handleLocationSelect}
                          disabled={!activityMarkerPosition}
                        >
                          Select This Location
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => setShowLocationSelector(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateActivity}>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="activity_type">Activity Type</label>
                          <select 
                            id="activity_type"
                            name="activity_type"
                            value={newActivity.activity_type}
                            onChange={handleActivityInputChange}
                            required
                          >
                            <option value="work">Work</option>
                            <option value="school">School/University</option>
                            <option value="shopping">Shopping</option>
                            <option value="gym">Gym/Exercise</option>
                            <option value="dining">Dining</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="days_of_week">Days of Week</label>
                          <select 
                            id="days_of_week"
                            name="days_of_week"
                            value={newActivity.days_of_week}
                            onChange={handleActivityInputChange}
                            required
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
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="start_time">Start Time</label>
                          <input 
                            type="time" 
                            id="start_time"
                            name="start_time"
                            value={newActivity.start_time}
                            onChange={handleActivityInputChange}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="end_time">End Time</label>
                          <input 
                            type="time" 
                            id="end_time"
                            name="end_time"
                            value={newActivity.end_time}
                            onChange={handleActivityInputChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="form-group location-input">
                        <label htmlFor="location">Location</label>
                        <div className="location-input-group">
                          <input 
                            type="text" 
                            id="location"
                            name="location"
                            placeholder="Enter address or select on map"
                            value={newActivity.location}
                            onChange={handleActivityInputChange}
                            required
                            readOnly={activityMarkerPosition !== null}
                          />
                          <button 
                            type="button" 
                            className="map-select-btn"
                            onClick={() => setShowLocationSelector(true)}
                          >
                            Select on Map
                          </button>
                        </div>
                        {(newActivity.latitude && newActivity.longitude) && (
                          <span className="coordinates">
                            Lat: {parseFloat(newActivity.latitude).toFixed(6)}, 
                            Lng: {parseFloat(newActivity.longitude).toFixed(6)}
                          </span>
                        )}
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              name="is_flexible"
                              checked={newActivity.is_flexible}
                              onChange={handleActivityInputChange}
                            />
                            Flexible Location
                          </label>
                        </div>
                        
                        {newActivity.is_flexible && (
                          <>
                            <div className="form-group">
                              <label htmlFor="flexibility_radius">Flexibility Radius (m)</label>
                              <input 
                                type="number" 
                                id="flexibility_radius"
                                name="flexibility_radius"
                                min="100"
                                max="5000"
                                step="100"
                                value={newActivity.flexibility_radius}
                                onChange={handleActivityInputChange}
                              />
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="max_detour_time">Max Detour (min)</label>
                              <input 
                                type="number" 
                                id="max_detour_time"
                                name="max_detour_time"
                                min="5"
                                max="60"
                                step="5"
                                value={newActivity.max_detour_time}
                                onChange={handleActivityInputChange}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="form-actions">
                        <button type="submit" className="submit-btn">Add Activity</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              
              {showTripChains && (
                <div className="trip-chains-container">
                  <h3>Your Trip Chains</h3>
                  {tripChains.length === 0 ? (
                    <div className="no-data">
                      <p>No trip chains found for your schedule.</p>
                      <p>Add at least two activities to generate trip chains.</p>
                    </div>
                  ) : (
                    <div className="trip-chains-list">
                      {tripChains.map((chain, index) => (
                        <div key={index} className="trip-chain-card">
                          <div className="trip-chain-header">
                            <h4>Trip Chain #{index + 1}</h4>
                            <span className="chain-date">{new Date(chain.date).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="trip-chain-body">
                            <div className="chain-location">
                              <div className="location-dot origin"></div>
                              <div className="location-details">
                                <div className="location-name">{chain.origin_activity.activity_type}</div>
                                <div className="location-address">{chain.origin_activity.location}</div>
                                <div className="location-time">{formatTime(chain.departure_time)}</div>
                              </div>
                            </div>
                            
                            <div className="chain-arrow">→</div>
                            
                            <div className="chain-location">
                              <div className="location-dot destination"></div>
                              <div className="location-details">
                                <div className="location-name">{chain.destination_activity.activity_type}</div>
                                <div className="location-address">{chain.destination_activity.location}</div>
                                <div className="location-time">{formatTime(chain.arrival_time)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {showMatches && (
                <div className="matches-container">
                  <h3>Activity-Based Matches</h3>
                  {activityMatches.length === 0 ? (
                    <div className="no-data">
                      <p>No matches found at this time.</p>
                      <p>Try again later or modify your schedule.</p>
                    </div>
                  ) : (
                    <div className="matches-list">
                      {activityMatches.map((match, index) => (
                        <div key={index} className="match-card">
                          <div className="match-header">
                            <h4>Match with {match.user_name}</h4>
                            <span className="match-score">
                              Score: {(match.match_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          
                          <div className="match-body">
                            <div className="match-activity">
                              <div className="activity-icon">
                                {match.activity_type === 'work' && '💼'}
                                {match.activity_type === 'school' && '🎓'}
                                {match.activity_type === 'shopping' && '🛒'}
                                {match.activity_type === 'gym' && '🏋️'}
                                {match.activity_type === 'dining' && '🍽️'}
                                {match.activity_type === 'entertainment' && '🎭'}
                                {match.activity_type === 'other' && '📍'}
                              </div>
                              <div className="activity-details">
                                <div className="activity-name">{match.activity_type}</div>
                                <div className="activity-location">{match.activity_location}</div>
                              </div>
                            </div>
                            
                            <div className="match-trip-chain">
                              <h5>Potential Trip</h5>
                              <div className="trip-details">
                                <div className="trip-from">
                                  <strong>From:</strong> {match.trip_chain.origin_activity.location}
                                </div>
                                <div className="trip-to">
                                  <strong>To:</strong> {match.trip_chain.destination_activity.location}
                                </div>
                                <div className="trip-times">
                                  <span>{formatTime(match.trip_chain.departure_time)}</span>
                                  <span>→</span>
                                  <span>{formatTime(match.trip_chain.arrival_time)}</span>
                                </div>
                              </div>
                              <div className="trip-metrics">
                                <div className="metric">
                                  <span className="metric-label">Detour:</span>
                                  <span className="metric-value">{match.detour_distance.toFixed(1)} km</span>
                                </div>
                                <div className="metric">
                                  <span className="metric-label">Role:</span>
                                  <span className="metric-value">{match.user_role === 'driver' ? 'Driver' : 'Passenger'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="match-actions">
                            <button 
                              className="book-match-btn"
                              onClick={() => handleCreateRide(match)}
                            >
                              Book This Ride
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {!showAddActivityForm && !showTripChains && !showMatches && (
                <div className="activities-list">
                  {scheduleActivities.length === 0 ? (
                    <div className="no-activities">
                      <p>No activities in this schedule yet.</p>
                      <p>Click "Add Activity" to create your first activity.</p>
                    </div>
                  ) : (
                    <>
                      {scheduleActivities.map(activity => (
                        <div key={activity.id} className="activity-card">
                          <div className="activity-header">
                            <h4>
                              {activity.activity_type === 'work' && '💼 '}
                              {activity.activity_type === 'school' && '🎓 '}
                              {activity.activity_type === 'shopping' && '🛒 '}
                              {activity.activity_type === 'gym' && '🏋️ '}
                              {activity.activity_type === 'dining' && '🍽️ '}
                              {activity.activity_type === 'entertainment' && '🎭 '}
                              {activity.activity_type === 'other' && '📍 '}
                              {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                            </h4>
                            <div className="activity-days">
                              {formatDaysOfWeek(activity.days_of_week)}
                            </div>
                          </div>
                          
                          <div className="activity-body">
                            <div className="activity-time">
                              {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                            </div>
                            
                            <div className="activity-location">
                              <div className="location-icon">📍</div>
                              <div className="location-details">
                                <div className="location-address">{activity.location}</div>
                                {activity.is_flexible && (
                                  <div className="location-flexible">
                                    Flexible within {activity.flexibility_radius}m
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="activity-actions">
                            {activity.is_flexible && (
                              <button 
                                className="alt-locations-btn"
                                onClick={() => handleFindAlternativeLocations(activity.id)}
                              >
                                Find Alternatives
                              </button>
                            )}
                            <button 
                              className="delete-activity-btn"
                              onClick={() => handleDeleteActivity(activity.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="no-schedule-selected">
              <h3>No Schedule Selected</h3>
              <p>Please select a schedule from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitySchedulePage;