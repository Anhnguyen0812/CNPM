import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api.service';
import './AbraPage.css';

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
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]}>
      <Popup>Vị trí được chọn</Popup>
    </Marker>
  ) : null;
};

const activityTypes = [
  { value: 'work', label: 'Công việc', icon: '💼' },
  { value: 'school', label: 'Học tập', icon: '🎓' },
  { value: 'shopping', label: 'Mua sắm', icon: '🛒' },
  { value: 'gym', label: 'Tập luyện', icon: '🏋️' },
  { value: 'dining', label: 'Ăn uống', icon: '🍽️' },
  { value: 'entertainment', label: 'Giải trí', icon: '🎭' },
  { value: 'other', label: 'Khác', icon: '📍' },
];

const daysOfWeek = [
  { value: '1', label: 'Thứ 2' },
  { value: '2', label: 'Thứ 3' },
  { value: '3', label: 'Thứ 4' },
  { value: '4', label: 'Thứ 5' },
  { value: '5', label: 'Thứ 6' },
  { value: '6', label: 'Thứ 7' },
  { value: '7', label: 'Chủ nhật' },
];

const AbraPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedules');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTripMatches, setShowTripMatches] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [activityForm, setActivityForm] = useState({
    activity_type: 'work',
    location: '',
    latitude: '',
    longitude: '',
    start_time: '09:00',
    end_time: '17:00',
    days_of_week: '1,2,3,4,5',
    is_flexible: false,
    flexibility_radius: 500,
    max_detour_time: 15
  });
  const [mapCenter, setMapCenter] = useState([21.0278, 105.8342]); // Hanoi as default
  const [zoom, setZoom] = useState(13);
  const [locationPosition, setLocationPosition] = useState(null);
  const [selectingLocation, setSelectingLocation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchSchedules();
    }
  }, [currentUser]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/abra/schedules');
      setSchedules(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Không thể tải lịch trình');
      setLoading(false);
    }
  };

  const fetchActivities = async (scheduleId) => {
    try {
      setLoading(true);
      const response = await api.get(`/abra/schedules/${scheduleId}/activities`);
      setActivities(response.data.data || []);
      setSelectedSchedule(scheduleId);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải hoạt động');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleActivityInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivityForm({
      ...activityForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDayChange = (e) => {
    const { value, checked } = e.target;
    const currentDays = activityForm.days_of_week.split(',');
    
    let newDays;
    if (checked) {
      newDays = [...currentDays, value].filter(d => d !== '');
    } else {
      newDays = currentDays.filter(d => d !== value);
    }
    
    setActivityForm({
      ...activityForm,
      days_of_week: newDays.sort().join(',')
    });
  };

  const isDaySelected = (day) => {
    return activityForm.days_of_week.split(',').includes(day);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post('/abra/schedules', formData);
      toast.success('Lịch trình đã được tạo thành công!');
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
      await fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Không thể tạo lịch trình');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    
    if (!selectedSchedule) {
      toast.error('Vui lòng chọn một lịch trình');
      return;
    }
    
    try {
      setLoading(true);
      const activityData = {
        ...activityForm,
        schedule_id: selectedSchedule
      };
      
      const response = await api.post('/abra/activities', activityData);
      toast.success('Hoạt động đã được thêm thành công!');
      setActivityForm({
        activity_type: 'work',
        location: '',
        latitude: '',
        longitude: '',
        start_time: '09:00',
        end_time: '17:00',
        days_of_week: '1,2,3,4,5',
        is_flexible: false,
        flexibility_radius: 500,
        max_detour_time: 15
      });
      setLocationPosition(null);
      await fetchActivities(selectedSchedule);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Không thể tạo hoạt động');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
      try {
        await api.delete(`/abra/schedules/${scheduleId}`);
        toast.success('Lịch trình đã được xóa');
        fetchSchedules();
        if (selectedSchedule === scheduleId) {
          setSelectedSchedule(null);
          setActivities([]);
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast.error('Không thể xóa lịch trình');
      }
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
      try {
        await api.delete(`/abra/activities/${activityId}`);
        toast.success('Hoạt động đã được xóa');
        fetchActivities(selectedSchedule);
      } catch (error) {
        console.error('Error deleting activity:', error);
        toast.error('Không thể xóa hoạt động');
      }
    }
  };

  const handleSetLocation = () => {
    setSelectingLocation(true);
  };

  const handleSaveLocation = () => {
    if (locationPosition) {
      // Use reverse geocoding to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${locationPosition.lat}&lon=${locationPosition.lng}&format=json`)
        .then(response => response.json())
        .then(data => {
          const address = data.display_name || 'Địa điểm đã chọn';
          setActivityForm({
            ...activityForm,
            location: address,
            latitude: locationPosition.lat,
            longitude: locationPosition.lng
          });
        })
        .catch(error => {
          console.error('Error getting address:', error);
          setActivityForm({
            ...activityForm,
            location: 'Địa điểm đã chọn',
            latitude: locationPosition.lat,
            longitude: locationPosition.lng
          });
        });
    }
    setSelectingLocation(false);
  };

  const findTripMatches = async (activityId) => {
    try {
      setLoading(true);
      const response = await api.get(`/abra/activities/${activityId}/matches`);
      setMatchResults(response.data.data || []);
      setShowTripMatches(true);
      setLoading(false);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Không thể tìm chuyến đi phù hợp');
      setLoading(false);
    }
  };

  const handleCreateRide = async (match) => {
    try {
      const rideData = {
        customer_id: currentUser.id,
        driver_id: match.driver_id,
        vehicle_id: match.vehicle_id || null,
        pickup_location: match.pickup_location,
        pickup_latitude: match.pickup_latitude,
        pickup_longitude: match.pickup_longitude,
        dropoff_location: match.dropoff_location,
        dropoff_latitude: match.dropoff_latitude,
        dropoff_longitude: match.dropoff_longitude,
        distance: match.distance,
        duration: match.duration,
        price: match.price,
        scheduled_time: match.scheduled_time,
        passenger_activity_id: match.passenger_activity_id,
        driver_activity_id: match.driver_activity_id,
        match_score: match.match_score,
        detour_time: match.detour_time
      };
      
      const response = await api.post('/abra/rides', rideData);
      toast.success('Chuyến đi đã được đặt thành công!');
      navigate(`/active-ride/${response.data.data.id}`);
    } catch (error) {
      console.error('Error creating ride:', error);
      toast.error('Không thể đặt chuyến đi');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDaysOfWeek = (daysString) => {
    if (!daysString) return '';
    const days = daysString.split(',').map(d => {
      const day = daysOfWeek.find(dow => dow.value === d);
      return day ? day.label : '';
    });
    return days.join(', ');
  };
  
  const getActivityTypeIcon = (type) => {
    const activityType = activityTypes.find(at => at.value === type);
    return activityType ? activityType.icon : '📍';
  };

  return (
    <div className="abra-page">
      <div className="abra-container">
        <div className="abra-header">
          <h1>Đi chung theo hoạt động</h1>
          <p>Tạo lịch trình hoạt động thường xuyên của bạn và kết nối với những người có lịch trình tương tự</p>
        </div>
        
        <div className="abra-tabs">
          <button 
            className={activeTab === 'schedules' ? 'active' : ''} 
            onClick={() => setActiveTab('schedules')}
          >
            Lịch trình của tôi
          </button>
          <button 
            className={activeTab === 'matches' ? 'active' : ''} 
            onClick={() => setActiveTab('matches')}
          >
            Tìm người đi chung
          </button>
          <button 
            className={activeTab === 'upcoming' ? 'active' : ''} 
            onClick={() => setActiveTab('upcoming')}
          >
            Chuyến sắp tới
          </button>
        </div>
        
        <div className="abra-content">
          {activeTab === 'schedules' && (
            <div className="schedules-section">
              <div className="section-header">
                <h2>Lịch trình hàng ngày của tôi</h2>
                {!showAddForm && (
                  <button 
                    className="add-schedule-btn"
                    onClick={() => setShowAddForm(true)}
                  >
                    + Thêm lịch trình mới
                  </button>
                )}
              </div>
              
              {showAddForm && (
                <div className="add-schedule-form">
                  <h3>Tạo lịch trình mới</h3>
                  <form onSubmit={handleCreateSchedule}>
                    <div className="form-group">
                      <label htmlFor="name">Tên lịch trình</label>
                      <input 
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: Lịch học, Lịch làm việc,..."
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="description">Mô tả (tùy chọn)</label>
                      <textarea 
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Mô tả ngắn về lịch trình của bạn"
                        rows={3}
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setShowAddForm(false)}
                      >
                        Hủy
                      </button>
                      <button type="submit" className="submit-btn">
                        {loading ? 'Đang tạo...' : 'Tạo lịch trình'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {loading && schedules.length === 0 ? (
                <div className="loading-indicator">Đang tải lịch trình...</div>
              ) : schedules.length === 0 ? (
                <div className="no-data">
                  <p>Bạn chưa có lịch trình nào. Hãy tạo lịch trình đầu tiên!</p>
                </div>
              ) : (
                <div className="schedules-list">
                  {schedules.map(schedule => (
                    <div 
                      key={schedule.id} 
                      className={`schedule-card ${selectedSchedule === schedule.id ? 'selected' : ''}`}
                      onClick={() => fetchActivities(schedule.id)}
                    >
                      <div className="schedule-header">
                        <h3>{schedule.name}</h3>
                        <div className="schedule-actions">
                          <button 
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSchedule(schedule.id);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div className="schedule-body">
                        {schedule.description && (
                          <p className="schedule-description">{schedule.description}</p>
                        )}
                        <div className="schedule-meta">
                          <span className="activity-count">
                            {schedule.activity_count || 0} hoạt động
                          </span>
                          <span className="created-at">
                            Tạo ngày: {new Date(schedule.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedSchedule && (
                <div className="activities-section">
                  <div className="section-header">
                    <h2>Các hoạt động</h2>
                    <button 
                      className="add-activity-btn"
                      onClick={() => setLocationPosition(null)}
                    >
                      + Thêm hoạt động mới
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateActivity} className="activity-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="activity_type">Loại hoạt động</label>
                        <select 
                          id="activity_type"
                          name="activity_type"
                          value={activityForm.activity_type}
                          onChange={handleActivityInputChange}
                          required
                        >
                          {activityTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="location">Địa điểm</label>
                        <div className="location-input-group">
                          <input 
                            type="text"
                            id="location"
                            name="location"
                            value={activityForm.location}
                            onChange={handleActivityInputChange}
                            placeholder="Chọn vị trí trên bản đồ"
                            required
                            readOnly
                          />
                          <button 
                            type="button" 
                            className="pick-location-btn"
                            onClick={handleSetLocation}
                          >
                            Chọn vị trí
                          </button>
                        </div>
                        {selectingLocation && (
                          <div className="map-container">
                            <MapContainer 
                              center={mapCenter} 
                              zoom={zoom} 
                              style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              <LocationPicker position={locationPosition} setPosition={setLocationPosition} />
                            </MapContainer>
                            <div className="map-actions">
                              <button type="button" className="done-btn" onClick={handleSaveLocation}>
                                Hoàn tất
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="start_time">Thời gian bắt đầu</label>
                        <input 
                          type="time"
                          id="start_time"
                          name="start_time"
                          value={activityForm.start_time}
                          onChange={handleActivityInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="end_time">Thời gian kết thúc</label>
                        <input 
                          type="time"
                          id="end_time"
                          name="end_time"
                          value={activityForm.end_time}
                          onChange={handleActivityInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Các ngày trong tuần</label>
                      <div className="days-checkboxes">
                        {daysOfWeek.map(day => (
                          <label key={day.value} className="day-checkbox">
                            <input 
                              type="checkbox"
                              name="days_of_week"
                              value={day.value}
                              checked={isDaySelected(day.value)}
                              onChange={handleDayChange}
                            />
                            {day.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          name="is_flexible"
                          checked={activityForm.is_flexible}
                          onChange={handleActivityInputChange}
                        />
                        Linh hoạt về vị trí và thời gian
                      </label>
                    </div>
                    
                    {activityForm.is_flexible && (
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="flexibility_radius">Bán kính linh hoạt (m)</label>
                          <input 
                            type="number"
                            id="flexibility_radius"
                            name="flexibility_radius"
                            min="100"
                            max="2000"
                            step="100"
                            value={activityForm.flexibility_radius}
                            onChange={handleActivityInputChange}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="max_detour_time">Thời gian đi lệch tối đa (phút)</label>
                          <input 
                            type="number"
                            id="max_detour_time"
                            name="max_detour_time"
                            min="5"
                            max="60"
                            step="5"
                            value={activityForm.max_detour_time}
                            onChange={handleActivityInputChange}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">
                        {loading ? 'Đang thêm...' : 'Thêm hoạt động'}
                      </button>
                    </div>
                  </form>
                  
                  {loading && activities.length === 0 ? (
                    <div className="loading-indicator">Đang tải hoạt động...</div>
                  ) : activities.length === 0 ? (
                    <div className="no-data">
                      <p>Chưa có hoạt động nào. Hãy thêm hoạt động đầu tiên!</p>
                    </div>
                  ) : (
                    <div className="activities-list">
                      {activities.map(activity => (
                        <div key={activity.id} className="activity-card">
                          <div className="activity-header">
                            <h4>
                              {getActivityTypeIcon(activity.activity_type)} {
                                activityTypes.find(t => t.value === activity.activity_type)?.label || 'Hoạt động'
                              }
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
                                    Linh hoạt trong phạm vi {activity.flexibility_radius}m
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="activity-actions">
                            <button 
                              className="find-matches-btn"
                              onClick={() => findTripMatches(activity.id)}
                            >
                              Tìm người đi chung
                            </button>
                            <button 
                              className="delete-activity-btn"
                              onClick={() => handleDeleteActivity(activity.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'matches' && showTripMatches && (
            <div className="matches-section">
              <div className="section-header">
                <h2>Kết quả tìm kiếm người đi chung</h2>
                <button 
                  className="back-btn"
                  onClick={() => setShowTripMatches(false)}
                >
                  Quay lại
                </button>
              </div>
              
              {loading ? (
                <div className="loading-indicator">Đang tải kết quả...</div>
              ) : matchResults.length === 0 ? (
                <div className="no-matches">
                  <p>Không tìm thấy kết quả phù hợp. Hãy thử lại sau!</p>
                </div>
              ) : (
                <div className="matches-list">
                  {matchResults.map((match, index) => (
                    <div key={index} className="match-card">
                      <div className="match-header">
                        <div className="user-info">
                          <img 
                            src={match.driver_photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(match.driver_name)}
                            alt={match.driver_name}
                            className="user-avatar"
                          />
                          <div className="user-details">
                            <h3>{match.driver_name}</h3>
                            <div className="user-rating">⭐ {match.driver_rating || '4.5'}</div>
                          </div>
                        </div>
                        <div className="match-score">
                          <span className="score-value">{Math.round(match.match_score * 100)}%</span>
                          <span className="score-label">trùng khớp</span>
                        </div>
                      </div>
                      
                      <div className="match-body">
                        <div className="match-activity">
                          <div className="activity-icon">
                            {getActivityTypeIcon(match.driver_activity_type)}
                          </div>
                          <div className="activity-details">
                            <div className="activity-name">
                              {activityTypes.find(t => t.value === match.driver_activity_type)?.label || 'Hoạt động'}
                            </div>
                            <div className="activity-location">{match.driver_activity_location}</div>
                          </div>
                        </div>
                        
                        <div className="match-trip-details">
                          <div className="trip-row">
                            <span className="trip-label">Đón:</span>
                            <span className="trip-value">{match.pickup_location}</span>
                          </div>
                          <div className="trip-row">
                            <span className="trip-label">Đến:</span>
                            <span className="trip-value">{match.dropoff_location}</span>
                          </div>
                          <div className="trip-row">
                            <span className="trip-label">Thời gian:</span>
                            <span className="trip-value">{new Date(match.scheduled_time).toLocaleString()}</span>
                          </div>
                          <div className="trip-row">
                            <span className="trip-label">Khoảng cách:</span>
                            <span className="trip-value">{match.distance.toFixed(1)} km</span>
                          </div>
                          <div className="trip-row">
                            <span className="trip-label">Thời gian đi:</span>
                            <span className="trip-value">{match.duration} phút</span>
                          </div>
                          <div className="trip-row">
                            <span className="trip-label">Giá:</span>
                            <span className="trip-value highlight">{match.price.toLocaleString()} VNĐ</span>
                          </div>
                        </div>
                        
                        <div className="vehicle-info">
                          <div className="vehicle-icon">🚗</div>
                          <div className="vehicle-details">
                            {match.vehicle_make} {match.vehicle_model} - {match.license_plate}
                          </div>
                        </div>
                      </div>
                      
                      <div className="match-actions">
                        <button 
                          className="book-ride-btn"
                          onClick={() => handleCreateRide(match)}
                        >
                          Đặt chuyến đi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'matches' && !showTripMatches && (
            <div className="find-matches-section">
              <div className="section-info">
                <h2>Tìm người đi chung</h2>
                <p>
                  Để tìm người đi chung phù hợp với lịch trình của bạn,
                  hãy tạo lịch trình và các hoạt động trước, sau đó nhấn
                  vào nút "Tìm người đi chung" cho hoạt động cụ thể.
                </p>
                <button 
                  className="switch-tab-btn"
                  onClick={() => setActiveTab('schedules')}
                >
                  Đi đến quản lý lịch trình
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'upcoming' && (
            <div className="upcoming-rides-section">
              <h2>Các chuyến đi sắp tới</h2>
              <p className="section-note">
                Đây là các chuyến đi bạn đã đặt hoặc có người đã đặt với bạn
              </p>
              
              {/* Upcoming rides will be implemented here */}
              <div className="no-data">
                <p>Hiện tại bạn chưa có chuyến đi sắp tới nào.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbraPage;