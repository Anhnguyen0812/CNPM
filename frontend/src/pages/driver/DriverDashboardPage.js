import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import './DriverDashboardPage.css';

const DriverDashboardPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    rating: 0,
    completionRate: 0,
  });
  const [activeTab, setActiveTab] = useState('available');
  const [availableRides, setAvailableRides] = useState([]);
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch driver stats
        const statsResponse = await api.get('/drivers/stats');
        setStats(statsResponse.data.data);
        
        // Fetch driver's current status
        const statusResponse = await api.get('/drivers/status');
        setIsOnline(statusResponse.data.data.isOnline);
        
        // Fetch available rides based on active tab
        await fetchRides();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Poll for available rides every 30 seconds
    const pollingInterval = setInterval(() => {
      if (activeTab === 'available' && isOnline) {
        fetchAvailableRides();
      }
    }, 30000);
    
    return () => clearInterval(pollingInterval);
  }, [isOnline]);
  
  // Fetch rides based on active tab
  const fetchRides = async () => {
    if (activeTab === 'available') {
      await fetchAvailableRides();
    } else if (activeTab === 'upcoming') {
      await fetchUpcomingRides();
    }
  };
  
  // Switch tabs
  useEffect(() => {
    fetchRides();
  }, [activeTab]);
  
  // Fetch available rides
  const fetchAvailableRides = async () => {
    try {
      const response = await api.get('/rides/available');
      setAvailableRides(response.data.data);
    } catch (error) {
      console.error('Error fetching available rides:', error);
    }
  };
  
  // Fetch upcoming rides
  const fetchUpcomingRides = async () => {
    try {
      const response = await api.get('/rides/driver/upcoming');
      setUpcomingRides(response.data.data);
    } catch (error) {
      console.error('Error fetching upcoming rides:', error);
    }
  };
  
  // Toggle driver online status
  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      await api.put('/drivers/status', { isOnline: newStatus });
      setIsOnline(newStatus);
      toast.success(`You are now ${newStatus ? 'online' : 'offline'}`);
      
      if (newStatus) {
        // If going online, fetch available rides
        fetchAvailableRides();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };
  
  // Accept a ride
  const acceptRide = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/accept`);
      toast.success('Ride accepted successfully');
      // Remove the ride from available rides
      setAvailableRides(availableRides.filter(ride => ride.id !== rideId));
      // Refresh upcoming rides
      fetchUpcomingRides();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error('Failed to accept ride');
    }
  };
  
  // Format price
  const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + ' VND';
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance.toFixed(1);
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };
  
  if (loading && !stats) {
    return <div className="loading">Loading dashboard...</div>;
  }
  
  return (
    <div className="driver-dashboard-page">
      <div className="dashboard-header">
        <h1>Driver Dashboard</h1>
        <div className="driver-status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
          <button 
            className={`toggle-status-btn ${isOnline ? 'online' : 'offline'}`} 
            onClick={toggleOnlineStatus}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value">{stats.totalRides}</div>
          <div className="stat-label">Total Rides</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatPrice(stats.totalEarnings)}</div>
          <div className="stat-label">Total Earnings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatPrice(stats.todayEarnings)}</div>
          <div className="stat-label">Today's Earnings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">⭐ {stats.rating.toFixed(1)}</div>
          <div className="stat-label">Rating</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>
      
      <div className="quick-actions">
        <Link to="/vehicles" className="quick-action-btn">
          <i className="fa fa-car"></i>
          Manage Vehicles
        </Link>
        <Link to="/driver-earnings" className="quick-action-btn">
          <i className="fa fa-money"></i>
          Earnings
        </Link>
        <Link to="/ride-history" className="quick-action-btn">
          <i className="fa fa-history"></i>
          Ride History
        </Link>
        <Link to="/profile" className="quick-action-btn">
          <i className="fa fa-user"></i>
          Profile
        </Link>
      </div>
      
      <div className="rides-section">
        <div className="rides-tabs">
          <button 
            className={activeTab === 'available' ? 'active' : ''} 
            onClick={() => setActiveTab('available')}
          >
            Available Rides
          </button>
          <button 
            className={activeTab === 'upcoming' ? 'active' : ''} 
            onClick={() => setActiveTab('upcoming')}
          >
            Your Upcoming Rides
          </button>
        </div>
        
        <div className="rides-container">
          {activeTab === 'available' && (
            <>
              {!isOnline && (
                <div className="offline-message">
                  <p>You are currently offline. Go online to see available rides.</p>
                  <button className="go-online-btn" onClick={toggleOnlineStatus}>Go Online</button>
                </div>
              )}
              
              {isOnline && availableRides.length === 0 && (
                <div className="no-rides-message">
                  <p>No available rides at the moment. Check back soon!</p>
                </div>
              )}
              
              {isOnline && availableRides.map(ride => (
                <div key={ride.id} className="ride-card">
                  <div className="ride-header">
                    <div className="ride-type">
                      {ride.ride_type === 'direct' ? 'Direct Ride' : 
                      ride.ride_type === 'activity_based' ? 'Đi chung theo hoạt động' : 
                      'Đi chung theo hồ sơ'}
                    </div>
                    <div className="ride-time">{formatDate(ride.created_at)}</div>
                  </div>
                  
                  <div className="ride-locations">
                    <div className="pickup">
                      <div className="location-dot pickup-dot"></div>
                      <div className="location-details">
                        <div className="location-label">Pickup</div>
                        <div className="location-address">{ride.pickup_location}</div>
                      </div>
                    </div>
                    
                    <div className="location-connector"></div>
                    
                    <div className="dropoff">
                      <div className="location-dot dropoff-dot"></div>
                      <div className="location-details">
                        <div className="location-label">Dropoff</div>
                        <div className="location-address">{ride.dropoff_location}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ride-details">
                    <div className="detail-row">
                      <span className="detail-label">Customer Rating</span>
                      <span className="detail-value">⭐ {ride.customer.rating || '4.5'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Distance</span>
                      <span className="detail-value">
                        {calculateDistance(
                          ride.pickup_latitude,
                          ride.pickup_longitude,
                          ride.dropoff_latitude,
                          ride.dropoff_longitude
                        )} km
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Estimated Fare</span>
                      <span className="detail-value highlight">{formatPrice(ride.price)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Payment Method</span>
                      <span className="detail-value">{ride.payment_method}</span>
                    </div>
                  </div>
                  
                  <div className="ride-actions">
                    <button 
                      className="accept-ride-btn"
                      onClick={() => acceptRide(ride.id)}
                    >
                      Accept Ride
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {activeTab === 'upcoming' && (
            <>
              {upcomingRides.length === 0 && (
                <div className="no-rides-message">
                  <p>You don't have any upcoming rides.</p>
                </div>
              )}
              
              {upcomingRides.map(ride => (
                <div key={ride.id} className="ride-card">
                  <div className="ride-header">
                    <div className="ride-type">
                      {ride.ride_type === 'direct' ? 'Direct Ride' : 
                      ride.ride_type === 'activity_based' ? 'Đi chung theo hoạt động' : 
                      'Đi chung theo hồ sơ'}
                    </div>
                    <div className={`ride-status status-${ride.status}`}>
                      {ride.status.replace('_', ' ').charAt(0).toUpperCase() + ride.status.replace('_', ' ').slice(1)}
                    </div>
                  </div>
                  
                  <div className="ride-locations">
                    <div className="pickup">
                      <div className="location-dot pickup-dot"></div>
                      <div className="location-details">
                        <div className="location-label">Pickup</div>
                        <div className="location-address">{ride.pickup_location}</div>
                      </div>
                    </div>
                    
                    <div className="location-connector"></div>
                    
                    <div className="dropoff">
                      <div className="location-dot dropoff-dot"></div>
                      <div className="location-details">
                        <div className="location-label">Dropoff</div>
                        <div className="location-address">{ride.dropoff_location}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ride-details">
                    <div className="detail-row">
                      <span className="detail-label">Customer</span>
                      <span className="detail-value">{ride.customer.name}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Schedule Time</span>
                      <span className="detail-value">{formatDate(ride.scheduled_time || ride.created_at)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">Fare</span>
                      <span className="detail-value highlight">{formatPrice(ride.price)}</span>
                    </div>
                  </div>
                  
                  <div className="ride-actions">
                    <Link 
                      to={`/active-ride/${ride.id}`} 
                      className="view-ride-btn"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboardPage;