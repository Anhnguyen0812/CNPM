import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import './RideHistoryPage.css';

const RideHistoryPage = () => {
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRides: 0,
    limit: 10
  });

  // Fetch ride history
  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        setLoading(true);
        const status = activeTab !== 'all' ? activeTab : '';
        const page = pagination.currentPage;
        const limit = pagination.limit;
        
        // Use different endpoints based on user role
        const endpoint = currentUser.role === 'driver' 
          ? `/rides/driver/${currentUser.id}?status=${status}&page=${page}&limit=${limit}` 
          : `/rides/customer/${currentUser.id}?status=${status}&page=${page}&limit=${limit}`;
          
        const response = await api.get(endpoint);
        
        setRides(response.data.data.rides);
        setPagination({
          ...pagination,
          totalPages: response.data.data.totalPages,
          totalRides: response.data.data.totalRides
        });
      } catch (error) {
        console.error('Error fetching ride history:', error);
        toast.error('Failed to load ride history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRideHistory();
  }, [currentUser, activeTab, pagination.currentPage, pagination.limit]);
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        currentPage: newPage
      });
    }
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  const getRideStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'in_progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };
  
  const getRideTypeLabel = (type) => {
    switch (type) {
      case 'direct':
        return 'Direct Ride';
      case 'activity_based':
        return 'Đi chung theo hoạt động';
      case 'profile_based':
        return 'Đi chung theo hồ sơ';
      default:
        return type;
    }
  };
  
  if (loading && rides.length === 0) {
    return <div className="loading">Loading ride history...</div>;
  }
  
  return (
    <div className="ride-history-page">
      <div className="page-header">
        <h1>Ride History</h1>
        <p>View details of your past and upcoming rides</p>
      </div>
      
      <div className="ride-history-container">
        <div className="ride-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            All Rides
          </button>
          <button 
            className={activeTab === 'completed' ? 'active' : ''} 
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button 
            className={activeTab === 'in_progress' ? 'active' : ''} 
            onClick={() => setActiveTab('in_progress')}
          >
            In Progress
          </button>
          <button 
            className={activeTab === 'pending' ? 'active' : ''} 
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={activeTab === 'cancelled' ? 'active' : ''} 
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled
          </button>
        </div>
        
        {rides.length === 0 ? (
          <div className="no-rides">
            <p>No rides found for the selected filter.</p>
          </div>
        ) : (
          <>
            <div className="rides-list">
              {rides.map(ride => (
                <div key={ride.id} className="ride-card">
                  <div className="ride-header">
                    <div className="ride-date">{formatDate(ride.created_at)}</div>
                    <div className={`ride-status ${getRideStatusClass(ride.status)}`}>
                      {ride.status.replace('_', ' ').charAt(0).toUpperCase() + ride.status.replace('_', ' ').slice(1)}
                    </div>
                  </div>
                  
                  <div className="ride-body">
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
                    
                    <div className="ride-info">
                      <div className="info-row">
                        <span className="info-label">Ride Type</span>
                        <span className="info-value">{getRideTypeLabel(ride.ride_type)}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="info-label">Distance</span>
                        <span className="info-value">{ride.distance.toFixed(1)} km</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="info-label">Price</span>
                        <span className="info-value">{ride.price.toLocaleString()} VND</span>
                      </div>
                      
                      {currentUser.role === 'customer' && ride.driver && (
                        <div className="info-row">
                          <span className="info-label">Driver</span>
                          <span className="info-value">{ride.driver.name}</span>
                        </div>
                      )}
                      
                      {currentUser.role === 'driver' && ride.customer && (
                        <div className="info-row">
                          <span className="info-label">Customer</span>
                          <span className="info-value">{ride.customer.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ride-footer">
                    {ride.status === 'in_progress' && (
                      <Link to={`/active-ride/${ride.id}`} className="view-details-btn primary-btn">
                        Track Ride
                      </Link>
                    )}
                    
                    {ride.status === 'pending' && (
                      <Link to={`/active-ride/${ride.id}`} className="view-details-btn primary-btn">
                        View Details
                      </Link>
                    )}
                    
                    {ride.status === 'completed' && (
                      <Link to={`/ride-details/${ride.id}`} className="view-details-btn secondary-btn">
                        View Details
                      </Link>
                    )}
                    
                    {ride.status === 'completed' && !ride.is_rated && currentUser.role === 'customer' && (
                      <button className="rate-ride-btn">Rate Ride</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination">
              <button 
                className="pagination-btn"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </button>
              
              <div className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              
              <button 
                className="pagination-btn"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RideHistoryPage;