import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import './TrajectoryRidesPage.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TrajectoryRidesPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [pastRides, setPastRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rideDetail, setRideDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchRides();
    }
  }, [currentUser, activeTab]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      if (activeTab === 'upcoming') {
        const response = await api.get('/trajectory/rides/upcoming');
        setUpcomingRides(response.data.data || []);
      } else {
        const response = await api.get('/trajectory/rides/history');
        setPastRides(response.data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching ${activeTab} rides:`, error);
      toast.error(`Không thể tải chuyến đi ${activeTab === 'upcoming' ? 'sắp tới' : 'đã hoàn thành'}`);
      setLoading(false);
    }
  };

  const fetchRideDetail = async (rideId) => {
    try {
      setLoading(true);
      const response = await api.get(`/trajectory/rides/${rideId}/match`);
      setRideDetail(response.data.data);
      setShowDetail(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ride detail:', error);
      toast.error('Không thể tải chi tiết chuyến đi');
      setLoading(false);
    }
  };

  const handleUpdateRideStatus = async (rideId, status) => {
    try {
      setLoading(true);
      await api.put(`/trajectory/rides/${rideId}/status`, { status });
      
      // Success message based on status
      const statusMessages = {
        'accepted': 'Chuyến đi đã được chấp nhận',
        'rejected': 'Chuyến đi đã bị từ chối',
        'cancelled': 'Chuyến đi đã bị hủy',
        'completed': 'Chuyến đi đã hoàn thành'
      };
      
      toast.success(statusMessages[status] || 'Cập nhật trạng thái thành công');
      
      // Refresh ride list
      fetchRides();
      
      // If in detail view, close it
      if (showDetail) {
        setShowDetail(false);
        setRideDetail(null);
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast.error('Không thể cập nhật trạng thái chuyến đi');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDaysOfWeek = (daysString) => {
    if (!daysString) return '';
    const dayNames = {
      '1': 'Thứ 2',
      '2': 'Thứ 3',
      '3': 'Thứ 4',
      '4': 'Thứ 5',
      '5': 'Thứ 6',
      '6': 'Thứ 7',
      '7': 'Chủ nhật'
    };
    
    return daysString.split(',').map(day => dayNames[day] || day).join(', ');
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString('vi-VN') + ' VND' : '';
  };

  const renderRideStatus = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'accepted': 'status-accepted',
      'in_progress': 'status-in-progress',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'rejected': 'status-rejected'
    };
    
    const statusLabels = {
      'pending': 'Chờ xác nhận',
      'accepted': 'Đã chấp nhận',
      'in_progress': 'Đang diễn ra',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'rejected': 'Từ chối'
    };
    
    return (
      <span className={`ride-status ${statusClasses[status] || ''}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const renderRideActions = (ride) => {
    const isDriver = currentUser.role === 'driver';
    
    if (ride.status === 'pending') {
      if (isDriver) {
        return (
          <div className="ride-action-buttons">
            <button 
              className="accept-ride-btn"
              onClick={() => handleUpdateRideStatus(ride.id, 'accepted')}
            >
              Chấp nhận
            </button>
            <button 
              className="reject-ride-btn"
              onClick={() => handleUpdateRideStatus(ride.id, 'rejected')}
            >
              Từ chối
            </button>
          </div>
        );
      } else {
        return (
          <button 
            className="cancel-ride-btn"
            onClick={() => handleUpdateRideStatus(ride.id, 'cancelled')}
          >
            Hủy chuyến
          </button>
        );
      }
    }
    
    if (ride.status === 'accepted') {
      if (isDriver) {
        return (
          <Link 
            to={`/active-ride/${ride.id}`} 
            className="view-ride-btn"
          >
            Bắt đầu chuyến đi
          </Link>
        );
      } else {
        return (
          <div className="ride-action-buttons">
            <Link 
              to={`/active-ride/${ride.id}`} 
              className="view-ride-btn"
            >
              Xem chi tiết
            </Link>
            <button 
              className="cancel-ride-btn"
              onClick={() => handleUpdateRideStatus(ride.id, 'cancelled')}
            >
              Hủy chuyến
            </button>
          </div>
        );
      }
    }
    
    if (ride.status === 'in_progress') {
      return (
        <Link 
          to={`/active-ride/${ride.id}`} 
          className="view-ride-btn"
        >
          Xem chuyến đi
        </Link>
      );
    }
    
    return null;
  };

  const renderRideList = (rides) => {
    if (loading && rides.length === 0) {
      return <div className="loading-indicator">Đang tải chuyến đi...</div>;
    }
    
    if (rides.length === 0) {
      return (
        <div className="no-rides">
          <p>Không có chuyến đi {activeTab === 'upcoming' ? 'sắp tới' : 'đã hoàn thành'} nào.</p>
          {activeTab === 'upcoming' && (
            <Link to="/trajectory-matching" className="find-matches-btn">
              Tìm người đi chung
            </Link>
          )}
        </div>
      );
    }
    
    return (
      <div className="ride-list">
        {rides.map(ride => (
          <div 
            key={ride.id} 
            className={`ride-card ${ride.status}`}
            onClick={() => fetchRideDetail(ride.id)}
          >
            <div className="ride-header">
              <div className="ride-date">
                {formatDateTime(ride.scheduled_time)}
              </div>
              {renderRideStatus(ride.status)}
            </div>
            
            <div className="ride-body">
              <div className="user-info">
                <img 
                  src={
                    currentUser.role === 'driver' 
                      ? (ride.customer_profile_picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(ride.customer_first_name + ' ' + ride.customer_last_name))
                      : (ride.driver_profile_picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(ride.driver_first_name + ' ' + ride.driver_last_name))
                  }
                  alt={
                    currentUser.role === 'driver' 
                      ? (ride.customer_first_name + ' ' + ride.customer_last_name)
                      : (ride.driver_first_name + ' ' + ride.driver_last_name)
                  }
                  className="user-avatar"
                />
                <div className="user-details">
                  <div className="user-name">
                    {currentUser.role === 'driver' 
                      ? (ride.customer_first_name + ' ' + ride.customer_last_name)
                      : (ride.driver_first_name + ' ' + ride.driver_last_name)
                    }
                  </div>
                  <div className="match-info">
                    <span className="similarity">
                      Tương đồng tuyến đường: {Math.round(ride.trajectory_similarity * 100)}%
                    </span>
                    <span className="compatibility">
                      Tương thích hồ sơ: {Math.round(ride.profile_compatibility * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="ride-locations">
                <div className="location pickup">
                  <div className="location-dot pickup-dot"></div>
                  <div className="location-details">
                    <div className="location-label">Điểm đón</div>
                    <div className="location-address">{ride.pickup_location}</div>
                  </div>
                </div>
                
                <div className="location-connector"></div>
                
                <div className="location dropoff">
                  <div className="location-dot dropoff-dot"></div>
                  <div className="location-details">
                    <div className="location-label">Điểm đến</div>
                    <div className="location-address">{ride.dropoff_location}</div>
                  </div>
                </div>
              </div>
              
              <div className="ride-info">
                <div className="info-item">
                  <span className="info-label">Khoảng cách:</span>
                  <span className="info-value">{ride.distance} km</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Thời gian:</span>
                  <span className="info-value">{ride.duration} phút</span>
                </div>
                <div className="info-item price">
                  <span className="info-label">Giá:</span>
                  <span className="info-value">{formatPrice(ride.price)}</span>
                </div>
              </div>
            </div>
            
            <div className="ride-footer">
              {renderRideActions(ride)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRideDetail = () => {
    if (!rideDetail) return null;
    
    const { passenger_origin, passenger_destination, driver_origin, driver_destination,
            passenger_usual_time, driver_usual_time, passenger_usual_days, driver_usual_days,
            price, status, scheduled_time, trajectory_similarity, profile_compatibility, combined_score } = rideDetail;
            
    // Calculate waypoints for visualization (simplified for example)
    const passengerRoute = [
      [rideDetail.passenger_origin_latitude, rideDetail.passenger_origin_longitude],
      [rideDetail.passenger_destination_latitude, rideDetail.passenger_destination_longitude]
    ];
    
    const driverRoute = [
      [rideDetail.driver_origin_latitude, rideDetail.driver_origin_longitude],
      [rideDetail.driver_destination_latitude, rideDetail.driver_destination_longitude]
    ];
    
    // Calculate map bounds to fit all points
    const allPoints = [...passengerRoute, ...driverRoute];
    const bounds = L.latLngBounds(allPoints);
    
    return (
      <div className="ride-detail-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Chi tiết chuyến đi</h2>
            <button 
              className="close-modal-btn"
              onClick={() => {
                setShowDetail(false);
                setRideDetail(null);
              }}
            >
              &times;
            </button>
          </div>
          
          <div className="modal-body">
            <div className="detail-section map-section">
              <h3>Bản đồ tuyến đường</h3>
              <div className="map-container">
                <MapContainer 
                  bounds={bounds}
                  style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {/* Passenger route */}
                  <Marker 
                    position={passengerRoute[0]}
                    icon={new L.Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>Điểm xuất phát của hành khách</Popup>
                  </Marker>
                  <Marker 
                    position={passengerRoute[1]}
                    icon={new L.Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>Điểm đến của hành khách</Popup>
                  </Marker>
                  <Polyline 
                    positions={passengerRoute}
                    color="green"
                    weight={4}
                    opacity={0.7}
                  />
                  
                  {/* Driver route */}
                  <Marker 
                    position={driverRoute[0]}
                    icon={new L.Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>Điểm xuất phát của tài xế</Popup>
                  </Marker>
                  <Marker 
                    position={driverRoute[1]}
                    icon={new L.Icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>Điểm đến của tài xế</Popup>
                  </Marker>
                  <Polyline 
                    positions={driverRoute}
                    color="blue"
                    weight={4}
                    opacity={0.7}
                  />
                </MapContainer>
              </div>
            </div>
            
            <div className="detail-section compatibility-section">
              <h3>Độ tương thích</h3>
              <div className="compatibility-metrics">
                <div className="metric-item">
                  <div className="metric-label">Tuyến đường</div>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${trajectory_similarity * 100}%` }}
                    ></div>
                  </div>
                  <div className="metric-value">{Math.round(trajectory_similarity * 100)}%</div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">Hồ sơ cá nhân</div>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${profile_compatibility * 100}%` }}
                    ></div>
                  </div>
                  <div className="metric-value">{Math.round(profile_compatibility * 100)}%</div>
                </div>
                
                <div className="metric-item total">
                  <div className="metric-label">Tổng hợp</div>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{ width: `${combined_score * 100}%` }}
                    ></div>
                  </div>
                  <div className="metric-value">{Math.round(combined_score * 100)}%</div>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Chi tiết tuyến đường</h3>
              <div className="routes-comparison">
                <div className="route passenger-route">
                  <h4>Tuyến đường của hành khách</h4>
                  <div className="route-details">
                    <div className="endpoint">
                      <div className="endpoint-icon">A</div>
                      <div className="endpoint-location">{passenger_origin}</div>
                    </div>
                    <div className="route-line">
                      <div className="waypoints">
                        {/* Waypoints would be rendered here */}
                      </div>
                    </div>
                    <div className="endpoint">
                      <div className="endpoint-icon">B</div>
                      <div className="endpoint-location">{passenger_destination}</div>
                    </div>
                  </div>
                  
                  <div className="schedule-details">
                    <div className="schedule-time">
                      <span className="schedule-label">Giờ thường đi:</span>
                      <span className="time">{formatTime(passenger_usual_time)}</span>
                    </div>
                    <div className="schedule-days">
                      <span className="schedule-label">Ngày thường đi:</span>
                      <span className="days">{formatDaysOfWeek(passenger_usual_days)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="route driver-route">
                  <h4>Tuyến đường của tài xế</h4>
                  <div className="route-details">
                    <div className="endpoint">
                      <div className="endpoint-icon">A</div>
                      <div className="endpoint-location">{driver_origin}</div>
                    </div>
                    <div className="route-line">
                      <div className="waypoints">
                        {/* Waypoints would be rendered here */}
                      </div>
                    </div>
                    <div className="endpoint">
                      <div className="endpoint-icon">B</div>
                      <div className="endpoint-location">{driver_destination}</div>
                    </div>
                  </div>
                  
                  <div className="schedule-details">
                    <div className="schedule-time">
                      <span className="schedule-label">Giờ thường đi:</span>
                      <span className="time">{formatTime(driver_usual_time)}</span>
                    </div>
                    <div className="schedule-days">
                      <span className="schedule-label">Ngày thường đi:</span>
                      <span className="days">{formatDaysOfWeek(driver_usual_days)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Thông tin chuyến đi</h3>
              <div className="ride-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">{renderRideStatus(status)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Thời gian đặt lịch</span>
                  <span className="detail-value">{formatDateTime(scheduled_time)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Giá chuyến đi</span>
                  <span className="detail-value price">{formatPrice(price)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="close-btn"
              onClick={() => {
                setShowDetail(false);
                setRideDetail(null);
              }}
            >
              Đóng
            </button>
            {status === 'pending' && renderRideActions(rideDetail)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trajectory-rides-page">
      <div className="page-header">
        <h1>Chuyến đi theo quỹ đạo</h1>
        <p>Quản lý các chuyến đi dựa trên quỹ đạo tương đồng với những người đi chung đường</p>
      </div>
      
      <div className="page-tabs">
        <button 
          className={activeTab === 'upcoming' ? 'active' : ''} 
          onClick={() => setActiveTab('upcoming')}
        >
          Chuyến đi sắp tới
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          Lịch sử chuyến đi
        </button>
      </div>
      
      <div className="page-content">
        {activeTab === 'upcoming' && renderRideList(upcomingRides)}
        {activeTab === 'history' && renderRideList(pastRides)}
      </div>
      
      {showDetail && renderRideDetail()}
    </div>
  );
};

export default TrajectoryRidesPage;