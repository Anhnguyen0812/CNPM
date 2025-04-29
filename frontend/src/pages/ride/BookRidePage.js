import React, { useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
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
      <Popup>{markerType === 'pickup' ? 'Điểm đón' : 'Điểm đến'}</Popup>
    </Marker> : null;
};

const BookRidePage = () => {
  const { currentUser: user } = useAuth();
  const [rideType, setRideType] = useState('activity');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [preferences, setPreferences] = useState({
    gender: '',
    ageGroup: '',
    smoking: false,
    pets: false,
    music: false,
    conversation: false
  });
  
  // Location suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  
  // Map state
  const [mapCenter, setMapCenter] = useState([21.0278, 105.8342]); // Hanoi, Vietnam as default
  const [zoom, setZoom] = useState(13);
  const [pickupPosition, setPickupPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [selectingLocation, setSelectingLocation] = useState(null); // 'pickup', 'destination', or null
  
  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  // Sample location data for suggestions
  // In a real app, this would come from an API call to a geocoding service
  const suggestedLocations = [
    { name: "Đại học Bách Khoa Hà Nội", address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội", coords: [21.0072, 105.8427] },
    { name: "Hồ Hoàn Kiếm", address: "Hoàn Kiếm, Hà Nội", coords: [21.0287, 105.8524] },
    { name: "Lăng Chủ tịch Hồ Chí Minh", address: "2 Hùng Vương, Điện Bàn, Ba Đình, Hà Nội", coords: [21.0370, 105.8348] },
    { name: "Đại học Quốc gia Hà Nội", address: "144 Xuân Thủy, Cầu Giấy, Hà Nội", coords: [21.0373, 105.7828] },
    { name: "Chợ Đồng Xuân", address: "Đồng Xuân, Hoàn Kiếm, Hà Nội", coords: [21.0386, 105.8494] },
    { name: "AEON Mall Long Biên", address: "27 Cổ Linh, Long Biên, Hà Nội", coords: [21.0141, 105.9113] },
    { name: "Keangnam Hanoi Landmark Tower", address: "Phạm Hùng, Cầu Giấy, Hà Nội", coords: [21.0166, 105.7837] },
    { name: "Bệnh viện Bạch Mai", address: "78 Đường Giải Phóng, Phương Mai, Đống Đa, Hà Nội", coords: [20.9999, 105.8411] },
    { name: "Công viên Thống Nhất", address: "Đường Trần Nhân Tông, Hai Bà Trưng, Hà Nội", coords: [21.0125, 105.8469] },
    { name: "Sân vận động Mỹ Đình", address: "Lê Đức Thọ, Mỹ Đình, Nam Từ Liêm, Hà Nội", coords: [21.0203, 105.7637] }
  ];

  // Calculate price estimate based on pickup and destination
  useEffect(() => {
    if (pickupLocation && destination) {
      // This would normally call an API to get an estimate
      // For now, we'll simulate a price calculation
      const basePrice = Math.floor(Math.random() * 50) + 50;
      const discount = rideType === 'profile' ? 0.1 : 0;
      
      setEstimatedPrice({
        basePrice,
        discount,
        finalPrice: basePrice * (1 - discount)
      });
    }
  }, [pickupLocation, destination, rideType]);

  const handlePreferenceChange = (e) => {
    const { name, checked, value, type } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real application, this would call an API to book the ride
    alert('Ride booking request submitted! You will be matched with a driver soon.');
    
    // Log the data that would be sent to the API
    console.log({
      rideType,
      pickupLocation,
      destination,
      departureTime,
      preferences: rideType === 'profile' ? preferences : null,
      userId: user?.id
    });
  };

  // Function to handle location selection from map
  const handleMapSelection = (type) => {
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
    if (destinationPosition) {
      // In a real app, you would use a geocoding service to get address from coordinates
      setDestination(`${destinationPosition.lat.toFixed(6)}, ${destinationPosition.lng.toFixed(6)}`);
    }
  }, [destinationPosition]);

  // Handle location input change and show suggestions
  const handlePickupInputChange = async (e) => {
    const value = e.target.value;
    setPickupLocation(value);
    
    if (value.length > 2) {
      const filteredSuggestions = suggestedLocations.filter(
        location => location.name.toLowerCase().includes(value.toLowerCase()) || 
                   location.address.toLowerCase().includes(value.toLowerCase())
      );
      setPickupSuggestions(filteredSuggestions);
      setShowPickupSuggestions(true);

      // Fetch locations from Nominatim API
      const apiSuggestions = await searchLocations(value);
      setPickupSuggestions(apiSuggestions);
      setShowPickupSuggestions(true);
    } else {
      setShowPickupSuggestions(false);
    }
  };

  const handleDestinationInputChange = async (e) => {
    const value = e.target.value;
    setDestination(value);
    
    if (value.length > 2) {
      const filteredSuggestions = suggestedLocations.filter(
        location => location.name.toLowerCase().includes(value.toLowerCase()) || 
                   location.address.toLowerCase().includes(value.toLowerCase())
      );
      setDestinationSuggestions(filteredSuggestions);
      setShowDestinationSuggestions(true);

      // Fetch locations from Nominatim API
      const apiSuggestions = await searchLocations(value);
      setDestinationSuggestions(apiSuggestions);
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handlePickupSuggestionClick = (suggestion) => {
    setPickupLocation(suggestion.name);
    setPickupPosition({ lat: suggestion.coords[0], lng: suggestion.coords[1] });
    setShowPickupSuggestions(false);
    
    // Update map to show the selection
    if (mapRef.current) {
      mapRef.current.flyTo(suggestion.coords, 15);
    }
  };

  const handleDestinationSuggestionClick = (suggestion) => {
    setDestination(suggestion.name);
    setDestinationPosition({ lat: suggestion.coords[0], lng: suggestion.coords[1] });
    setShowDestinationSuggestions(false);
    
    // Update map to show the selection
    if (mapRef.current) {
      mapRef.current.flyTo(suggestion.coords, 15);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickupInputRef.current && !pickupInputRef.current.contains(event.target)) {
        setShowPickupSuggestions(false);
      }
      if (destinationInputRef.current && !destinationInputRef.current.contains(event.target)) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for locations using Nominatim API (OpenStreetMap)
  const searchLocations = async (query) => {
    if (!query || query.length < 3) return [];
    
    try {
      // Sử dụng Nominatim API của OpenStreetMap
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json', 
          addressdetails: 1,
          limit: 10,
          countrycodes: 'vn', // Giới hạn tìm kiếm ở Việt Nam
          'accept-language': 'vi',  // Ưu tiên kết quả tiếng Việt
          bounded: 1,
          viewbox: '102.14,8.18,109.46,23.39', // Phạm vi bao phủ toàn Việt Nam
        },
        headers: {
          'User-Agent': 'RideSharingApp/1.0' // Nominatim yêu cầu định danh nguồn gọi API
        }
      });

      return response.data.map(location => {
        // Xử lý địa chỉ để chuẩn hóa và định dạng lại cho người dùng Việt Nam
        const nameParts = location.display_name.split(',');
        const mainName = nameParts[0].trim();
        
        // Lọc bỏ các phần không cần thiết của địa chỉ và tạo địa chỉ ngắn gọn hơn
        const shortenedAddress = nameParts
          .slice(1, Math.min(nameParts.length, 4)) // Chỉ lấy tối đa 3 phần tiếp theo
          .map(part => part.trim())
          .join(', ');
          
        return {
          name: mainName,
          address: `${mainName}, ${shortenedAddress}`,
          fullAddress: location.display_name,
          coords: [parseFloat(location.lat), parseFloat(location.lon)]
        };
      });
    } catch (error) {
      console.error('Error searching for locations:', error);
      return [];
    }
  };

  return (
    <div className="book-ride-page">
      <div className="page-header">
        <h1>Đặt chuyến xe</h1>
        <p>Chọn địa điểm và tùy chỉnh chuyến đi của bạn</p>
      </div>

      <div className="book-ride-container">
        <div className="ride-map-container">
          <MapContainer 
            center={mapCenter} 
            zoom={zoom} 
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => { mapRef.current = map; }}
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

            {selectingLocation === 'destination' && (
              <LocationMarker 
                position={destinationPosition} 
                setPosition={setDestinationPosition} 
                markerType="destination" 
              />
            )}

            {(pickupPosition && selectingLocation !== 'pickup') && (
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
                <Popup>Điểm đón</Popup>
              </Marker>
            )}

            {(destinationPosition && selectingLocation !== 'destination') && (
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
                <Popup>Điểm đến</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className="ride-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pickup">Điểm đón</label>
              <div className="location-input-group" ref={pickupInputRef}>
                <input
                  id="pickup"
                  type="text"
                  value={pickupLocation}
                  onChange={handlePickupInputChange}
                  placeholder="Nhập địa điểm đón"
                  required
                />
                <button 
                  type="button" 
                  className="map-select-btn"
                  onClick={() => handleMapSelection('pickup')}
                >
                  Chọn trên bản đồ
                </button>
                
                {showPickupSuggestions && pickupSuggestions.length > 0 && (
                  <div className="location-suggestions">
                    {pickupSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="suggestion-item"
                        onClick={() => handlePickupSuggestionClick(suggestion)}
                      >
                        <div className="suggestion-name">{suggestion.name}</div>
                        <div className="suggestion-address">{suggestion.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="destination">Điểm đến</label>
              <div className="location-input-group" ref={destinationInputRef}>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={handleDestinationInputChange}
                  placeholder="Nhập điểm đến"
                  required
                />
                <button 
                  type="button" 
                  className="map-select-btn"
                  onClick={() => handleMapSelection('destination')}
                >
                  Chọn trên bản đồ
                </button>
                
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="location-suggestions">
                    {destinationSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="suggestion-item"
                        onClick={() => handleDestinationSuggestionClick(suggestion)}
                      >
                        <div className="suggestion-name">{suggestion.name}</div>
                        <div className="suggestion-address">{suggestion.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="departure-time">Thời gian khởi hành</label>
              <input
                id="departure-time"
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Loại chuyến đi</label>
              <div className="ride-type-options">
                <label className="ride-type-option">
                  <input
                    type="radio"
                    name="rideType"
                    value="activity"
                    checked={rideType === 'activity'}
                    onChange={() => setRideType('activity')}
                  />
                  <div>
                    <h4>Đi chung theo hoạt động</h4>
                    <p>Ghép chuyến dựa trên lịch trình giống nhau, tiết kiệm chi phí và thời gian.</p>
                  </div>
                </label>

                <label className="ride-type-option">
                  <input
                    type="radio"
                    name="rideType"
                    value="profile"
                    checked={rideType === 'profile'}
                    onChange={() => setRideType('profile')}
                  />
                  <div>
                    <h4>Đi chung theo hồ sơ</h4>
                    <p>Ghép chuyến dựa trên sở thích, tính cách và dân cư phù hợp. Giảm 10% giá.</p>
                  </div>
                </label>
              </div>
            </div>

            {rideType === 'profile' && (
              <div className="form-group">
                <label>Tùy chọn ghép chuyến</label>
                <p>Chọn tùy chọn để ghép đôi với những người đi chung phù hợp với bạn hơn</p>
                
                <div className="profile-preferences">
                  <div className="form-group">
                    <label htmlFor="gender">Giới tính</label>
                    <select 
                      id="gender" 
                      name="gender" 
                      value={preferences.gender}
                      onChange={handlePreferenceChange}
                    >
                      <option value="">Không quan trọng</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ageGroup">Độ tuổi</label>
                    <select 
                      id="ageGroup" 
                      name="ageGroup"
                      value={preferences.ageGroup}
                      onChange={handlePreferenceChange}
                    >
                      <option value="">Không quan trọng</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-50">36-50</option>
                      <option value="50+">Trên 50</option>
                    </select>
                  </div>
                </div>

                <div className="profile-preferences">
                  <label className="profile-preference-option">
                    <input 
                      type="checkbox" 
                      name="smoking"
                      checked={preferences.smoking}
                      onChange={handlePreferenceChange}
                    />
                    Không hút thuốc
                  </label>

                  <label className="profile-preference-option">
                    <input 
                      type="checkbox" 
                      name="pets"
                      checked={preferences.pets}
                      onChange={handlePreferenceChange}
                    />
                    Cho phép thú cưng
                  </label>

                  <label className="profile-preference-option">
                    <input 
                      type="checkbox" 
                      name="music"
                      checked={preferences.music}
                      onChange={handlePreferenceChange}
                    />
                    Thích nghe nhạc
                  </label>

                  <label className="profile-preference-option">
                    <input 
                      type="checkbox" 
                      name="conversation"
                      checked={preferences.conversation}
                      onChange={handlePreferenceChange}
                    />
                    Thích trò chuyện
                  </label>
                </div>
              </div>
            )}

            {estimatedPrice && (
              <div className="price-estimate">
                <h3>Ước tính chi phí</h3>
                <p>Giá cơ bản: {estimatedPrice.basePrice.toLocaleString()} VND</p>
                {rideType === 'profile' && (
                  <p className="discount-note">Giảm 10% khi đi theo hồ sơ: -{(estimatedPrice.basePrice * 0.1).toLocaleString()} VND</p>
                )}
                <div className="price">
                  {estimatedPrice.finalPrice.toLocaleString()} VND
                </div>
                <p>Chi phí có thể thay đổi tùy thuộc vào điều kiện thực tế</p>
              </div>
            )}

            <button type="submit" className="book-ride-btn">
              Đặt chuyến
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookRidePage;