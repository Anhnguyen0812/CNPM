import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ActiveRidePage.css';

// Fix for Leaflet marker icons
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: '/driver-marker.png',
  iconRetinaUrl: '/driver-marker@2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const pickupIcon = new L.Icon({
  iconUrl: '/pickup-marker.png',
  iconRetinaUrl: '/pickup-marker@2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: '/dropoff-marker.png',
  iconRetinaUrl: '/dropoff-marker@2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Component to handle map updates
function MapUpdater({ rideData, driverLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (rideData && driverLocation) {
      const bounds = L.latLngBounds(
        L.latLng(rideData.pickup_latitude, rideData.pickup_longitude),
        L.latLng(rideData.dropoff_latitude, rideData.dropoff_longitude)
      );
      
      bounds.extend(L.latLng(driverLocation.latitude, driverLocation.longitude));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (rideData) {
      const bounds = L.latLngBounds(
        L.latLng(rideData.pickup_latitude, rideData.pickup_longitude),
        L.latLng(rideData.dropoff_latitude, rideData.dropoff_longitude)
      );
      
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [rideData, driverLocation, map]);
  
  return null;
}

const ActiveRidePage = () => {
  const { rideId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [rideData, setRideData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [rideStatus, setRideStatus] = useState('');
  
  const messagesEndRef = useRef(null);
  const isDriver = currentUser?.role === 'driver';
  const isCustomer = currentUser?.role === 'customer';
  
  // Fetch ride data
  useEffect(() => {
    const fetchRideData = async () => {
      try {
        const response = await api.get(`/rides/${rideId}`);
        setRideData(response.data.data);
        setRideStatus(response.data.data.status);
        
        // Fetch driver location if ride is accepted or in progress
        if (['accepted', 'in_progress'].includes(response.data.data.status)) {
          fetchDriverLocation();
        }
        
        // Fetch messages
        fetchMessages();
      } catch (error) {
        console.error('Error fetching ride data:', error);
        toast.error('Failed to load ride data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRideData();
    
    // Set up periodic polling for ride status and driver location
    const statusInterval = setInterval(() => {
      updateRideStatus();
      if (['accepted', 'in_progress'].includes(rideStatus)) {
        fetchDriverLocation();
      }
    }, 10000); // Poll every 10 seconds
    
    // Set up WebSocket connection for real-time updates
    // Note: This is a placeholder for the actual socket implementation
    // that would be used in production
    const socket = { connected: false };
    
    return () => {
      clearInterval(statusInterval);
      if (socket.connected) {
        // Disconnect socket
      }
    };
  }, [rideId, rideStatus]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Fetch driver's current location
  const fetchDriverLocation = async () => {
    try {
      const response = await api.get(`/drivers/${rideData.driver_id}/location`);
      setDriverLocation(response.data.data);
      
      // Calculate estimated arrival time
      if (rideStatus === 'accepted') {
        // For demo purposes, we're using a fixed arrival time
        // In a real app, this would be calculated based on distance and traffic
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + 10 * 60000); // 10 minutes from now
        setEstimatedArrival(arrivalTime);
      }
    } catch (error) {
      console.error('Error fetching driver location:', error);
    }
  };
  
  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/rides/${rideId}/messages`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  // Update ride status
  const updateRideStatus = async () => {
    try {
      const response = await api.get(`/rides/${rideId}/status`);
      setRideStatus(response.data.data.status);
      
      if (response.data.data.status !== rideStatus) {
        // Status has changed, refresh ride data
        const rideResponse = await api.get(`/rides/${rideId}`);
        setRideData(rideResponse.data.data);
        
        // Show notification based on status change
        switch (response.data.data.status) {
          case 'in_progress':
            toast.info('Your ride has started!');
            break;
          case 'completed':
            toast.success('Ride completed successfully!');
            break;
          case 'cancelled':
            toast.error('Ride has been cancelled');
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };
  
  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      await api.post(`/rides/${rideId}/messages`, {
        message: newMessage,
        sender_id: currentUser.id,
        sender_role: currentUser.role
      });
      
      // Add message to state
      setMessages([
        ...messages,
        {
          id: Date.now(), // Temporary ID until we fetch updated messages
          message: newMessage,
          sender_id: currentUser.id,
          sender_role: currentUser.role,
          sender_name: currentUser.name,
          created_at: new Date().toISOString()
        }
      ]);
      
      // Clear input
      setNewMessage('');
      
      // Fetch updated messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  // Handle ride actions based on status and user role
  const handleRideAction = async (action) => {
    try {
      switch (action) {
        case 'start':
          await api.put(`/rides/${rideId}/start`);
          toast.success('Ride started successfully');
          break;
        case 'complete':
          await api.put(`/rides/${rideId}/complete`);
          toast.success('Ride completed successfully');
          break;
        case 'cancel':
          await api.put(`/rides/${rideId}/cancel`);
          toast.info('Ride cancelled');
          break;
        default:
          break;
      }
      
      // Update ride status
      updateRideStatus();
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      toast.error(`Failed to ${action} ride`);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render ride status label
  const renderStatusLabel = () => {
    switch (rideStatus) {
      case 'pending':
        return <span className="status-label pending">Waiting for driver</span>;
      case 'accepted':
        return <span className="status-label accepted">Driver on the way</span>;
      case 'in_progress':
        return <span className="status-label in-progress">Ride in progress</span>;
      case 'completed':
        return <span className="status-label completed">Ride completed</span>;
      case 'cancelled':
        return <span className="status-label cancelled">Ride cancelled</span>;
      default:
        return null;
    }
  };
  
  // Render action buttons based on status and user role
  const renderActionButtons = () => {
    if (rideStatus === 'completed' || rideStatus === 'cancelled') {
      return (
        <button
          className="cta-button"
          onClick={() => navigate(isDriver ? '/driver-dashboard' : '/book-ride')}
        >
          {isDriver ? 'Back to Dashboard' : 'Book Another Ride'}
        </button>
      );
    }
    
    if (isDriver) {
      switch (rideStatus) {
        case 'accepted':
          return (
            <button 
              className="primary-btn" 
              onClick={() => handleRideAction('start')}
            >
              Start Ride
            </button>
          );
        case 'in_progress':
          return (
            <button 
              className="primary-btn" 
              onClick={() => handleRideAction('complete')}
            >
              Complete Ride
            </button>
          );
        default:
          return null;
      }
    }
    
    if (isCustomer && (rideStatus === 'pending' || rideStatus === 'accepted')) {
      return (
        <button 
          className="cancel-btn" 
          onClick={() => handleRideAction('cancel')}
        >
          Cancel Ride
        </button>
      );
    }
    
    return null;
  };
  
  if (loading) {
    return <div className="loading">Loading ride details...</div>;
  }
  
  if (!rideData) {
    return (
      <div className="error-container">
        <h2>Ride Not Found</h2>
        <p>The requested ride could not be found or you do not have permission to view it.</p>
        <button 
          className="primary-btn" 
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="active-ride-page">
      <div className="ride-header">
        <h1>Ride #{rideId.slice(0, 8)}</h1>
        {renderStatusLabel()}
      </div>
      
      <div className="ride-container">
        <div className="ride-map-section">
          <MapContainer 
            center={[10.7758, 106.7022]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {rideData && (
              <>
                <Marker 
                  position={[rideData.pickup_latitude, rideData.pickup_longitude]}
                >
                  <Popup>Pickup: {rideData.pickup_location}</Popup>
                </Marker>
                
                <Marker 
                  position={[rideData.dropoff_latitude, rideData.dropoff_longitude]}
                >
                  <Popup>Dropoff: {rideData.dropoff_location}</Popup>
                </Marker>
              </>
            )}
            
            {driverLocation && (
              <Marker 
                position={[driverLocation.latitude, driverLocation.longitude]}
              >
                <Popup>Driver: {rideData.driver?.name || 'Your driver'}</Popup>
              </Marker>
            )}
            
            <MapUpdater rideData={rideData} driverLocation={driverLocation} />
          </MapContainer>
        </div>
        
        <div className="ride-details-section">
          <div className="ride-info-card">
            <h3>Ride Details</h3>
            
            <div className="ride-locations">
              <div className="location pickup">
                <i className="location-icon pickup-icon"></i>
                <div>
                  <span className="location-label">Pickup</span>
                  <p className="location-address">{rideData.pickup_location}</p>
                </div>
              </div>
              
              <div className="location dropoff">
                <i className="location-icon dropoff-icon"></i>
                <div>
                  <span className="location-label">Dropoff</span>
                  <p className="location-address">{rideData.dropoff_location}</p>
                </div>
              </div>
            </div>
            
            <div className="ride-details-grid">
              <div className="detail-item">
                <span className="detail-label">Ride Type</span>
                <span className="detail-value">
                  {rideData.ride_type === 'direct' ? 'Direct Ride' : 
                  rideData.ride_type === 'activity_based' ? 'Đi chung theo hoạt động' : 
                  'Đi chung theo hồ sơ'}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Vehicle Type</span>
                <span className="detail-value">
                  {rideData.vehicle_type.charAt(0).toUpperCase() + rideData.vehicle_type.slice(1)}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Price</span>
                <span className="detail-value highlight">
                  {rideData.price.toLocaleString('vi-VN')} VND
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Distance</span>
                <span className="detail-value">{rideData.distance.toFixed(1)} km</span>
              </div>
              
              {rideStatus === 'accepted' && estimatedArrival && (
                <div className="detail-item full-width">
                  <span className="detail-label">Estimated Arrival</span>
                  <span className="detail-value arrival-time">
                    {estimatedArrival.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
            
            {rideStatus === 'completed' && (
              <div className="rating-section">
                <h4>Rate your {isDriver ? 'passenger' : 'driver'}</h4>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} className="star-btn">★</button>
                  ))}
                </div>
                <textarea 
                  placeholder={`Leave feedback for your ${isDriver ? 'passenger' : 'driver'}...`} 
                  className="feedback-input"
                ></textarea>
                <button className="submit-rating-btn">Submit Review</button>
              </div>
            )}
            
            <div className="ride-actions">
              {renderActionButtons()}
            </div>
          </div>
          
          <div className="chat-card">
            <h3>
              {isDriver ? 'Chat with Passenger' : 'Chat with Driver'}
            </h3>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.message}</p>
                      <span className="message-time">{formatDate(msg.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="chat-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={['completed', 'cancelled'].includes(rideStatus)}
              />
              <button 
                type="submit"
                disabled={['completed', 'cancelled'].includes(rideStatus) || !newMessage.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRidePage;