import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import SearchIcon from '@mui/icons-material/Search';
import MapDisplay from './MapDisplay';

/**
 * Component for selecting locations on a map
 * 
 * @param {Object} props
 * @param {boolean} props.multipleLocations - Allow selection of multiple locations or just start/end
 * @param {function} props.onLocationSelect - Callback when locations are selected
 * @param {Array} props.initialLocations - Initial locations to display
 * @param {string} props.mode - 'activities' or 'trajectory'
 */
const LocationSelector = ({ 
  multipleLocations = false,
  onLocationSelect,
  initialLocations = [],
  mode = 'activities'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState(initialLocations);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Cập nhật hiển thị bản đồ khi locations thay đổi
    if (mode === 'trajectory') {
      if (selectedLocations.length > 0) {
        setStartPoint(selectedLocations[0]);
      }
      if (selectedLocations.length > 1) {
        setEndPoint(selectedLocations[selectedLocations.length - 1]);
      }
      if (selectedLocations.length > 2) {
        setWaypoints(selectedLocations.slice(1, selectedLocations.length - 1));
      } else {
        setWaypoints([]);
      }
    } else {
      // Chế độ activities - mỗi địa điểm là một marker riêng biệt
      setWaypoints(selectedLocations);
    }

    // Thông báo cho component cha về các địa điểm đã chọn
    if (onLocationSelect) {
      onLocationSelect(selectedLocations);
    }
  }, [selectedLocations, mode, onLocationSelect]);

  // Xử lý search địa điểm
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Sử dụng Nominatim OpenStreetMap API để tìm kiếm địa điểm
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`
      );
      const data = await response.json();
      
      const formattedResults = data.map(item => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        name: item.display_name,
        id: item.place_id
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching for location:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Xử lý khi người dùng chọn địa điểm từ kết quả tìm kiếm
  const handleSelectSearchResult = (location) => {
    if (mode === 'trajectory') {
      // Trong chế độ trajectory, thêm điểm vào cuối mảng
      setSelectedLocations([...selectedLocations, location]);
    } else {
      // Trong chế độ activities, chỉ thêm nếu không trùng lặp
      if (!selectedLocations.find(loc => loc.id === location.id)) {
        setSelectedLocations([...selectedLocations, location]);
      }
    }
    setSearchResults([]); // Xóa kết quả tìm kiếm sau khi chọn
    setSearchQuery(''); // Xóa query tìm kiếm
  };

  // Xử lý khi người dùng click trực tiếp trên bản đồ
  const handleMapClick = (coords) => {
    // Lấy tên địa điểm từ tọa độ (reverse geocoding)
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`
    )
      .then(response => response.json())
      .then(data => {
        const newLocation = {
          lat: coords.lat,
          lon: coords.lon,
          name: data.display_name || `Location at (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`,
          id: Date.now() // Sử dụng timestamp làm ID tạm thời
        };

        if (mode === 'trajectory') {
          setSelectedLocations([...selectedLocations, newLocation]);
        } else {
          if (!selectedLocations.find(loc => 
            Math.abs(loc.lat - coords.lat) < 0.0001 && 
            Math.abs(loc.lon - coords.lon) < 0.0001
          )) {
            setSelectedLocations([...selectedLocations, newLocation]);
          }
        }
      })
      .catch(error => {
        console.error('Error in reverse geocoding:', error);
        // Fallback nếu không lấy được tên địa điểm
        const newLocation = {
          lat: coords.lat,
          lon: coords.lon,
          name: `Location at (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`,
          id: Date.now()
        };
        
        if (mode === 'trajectory') {
          setSelectedLocations([...selectedLocations, newLocation]);
        } else {
          setSelectedLocations([...selectedLocations, newLocation]);
        }
      });
  };

  // Xử lý khi người dùng xóa một địa điểm
  const handleRemoveLocation = (index) => {
    const newLocations = [...selectedLocations];
    newLocations.splice(index, 1);
    setSelectedLocations(newLocations);
  };

  // Xử lý khi người dùng kéo marker trên bản đồ
  const handleMarkerDragEnd = (type, coords) => {
    // Cập nhật tọa độ mới cho marker được kéo
    if (type.startsWith('waypoint-')) {
      const index = parseInt(type.split('-')[1], 10);
      const updatedLocations = [...selectedLocations];
      
      if (mode === 'trajectory') {
        // Trong chế độ trajectory, waypoints bắt đầu từ index 1
        const actualIndex = index + 1;
        if (actualIndex < updatedLocations.length - 1) {
          updatedLocations[actualIndex] = {
            ...updatedLocations[actualIndex],
            lat: coords.lat,
            lon: coords.lon
          };
        }
      } else {
        // Trong chế độ activities, waypoints là tất cả các điểm
        if (index < updatedLocations.length) {
          updatedLocations[index] = {
            ...updatedLocations[index],
            lat: coords.lat,
            lon: coords.lon
          };
        }
      }
      
      setSelectedLocations(updatedLocations);
    } else if (type === 'start' && mode === 'trajectory') {
      const updatedLocations = [...selectedLocations];
      if (updatedLocations.length > 0) {
        updatedLocations[0] = {
          ...updatedLocations[0],
          lat: coords.lat,
          lon: coords.lon
        };
        setSelectedLocations(updatedLocations);
      }
    } else if (type === 'end' && mode === 'trajectory') {
      const updatedLocations = [...selectedLocations];
      if (updatedLocations.length > 1) {
        updatedLocations[updatedLocations.length - 1] = {
          ...updatedLocations[updatedLocations.length - 1],
          lat: coords.lat,
          lon: coords.lon
        };
        setSelectedLocations(updatedLocations);
      }
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {mode === 'activities' ? 'Select Activity Locations' : 'Select Route Points'}
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            label="Search for a location"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            variant="outlined"
            size="small"
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSearch} 
            disabled={isSearching}
            startIcon={<SearchIcon />}
            sx={{ ml: 1 }}
          >
            Search
          </Button>
        </Box>

        {searchResults.length > 0 && (
          <Paper variant="outlined" sx={{ mb: 2, maxHeight: '200px', overflow: 'auto' }}>
            <List dense>
              {searchResults.map((result) => (
                <ListItem 
                  key={result.id} 
                  button 
                  onClick={() => handleSelectSearchResult(result)}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleSelectSearchResult(result)}>
                      <AddLocationIcon color="primary" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={result.name.split(',')[0]}
                    secondary={result.name} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        <Box sx={{ height: '400px', width: '100%', mb: 2 }}>
          <MapDisplay
            startPoint={startPoint}
            endPoint={endPoint}
            waypoints={waypoints}
            height="400px"
            onMapClick={handleMapClick}
            markerDraggable={true}
            onMarkerDragEnd={handleMarkerDragEnd}
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          {mode === 'activities' ? 'Selected Activity Locations:' : 'Selected Route Points:'}
        </Typography>
        
        {selectedLocations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No locations selected. Click on the map or search for a location.
          </Typography>
        ) : (
          <List dense>
            {selectedLocations.map((location, index) => (
              <ListItem 
                key={location.id || index} 
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveLocation(index)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={
                    mode === 'trajectory' 
                      ? `${index === 0 ? 'Start' : index === selectedLocations.length - 1 ? 'End' : 'Waypoint ' + index}` 
                      : `Location ${index + 1}`
                  }
                  secondary={location.name} 
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default LocationSelector;