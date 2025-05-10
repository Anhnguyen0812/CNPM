import React, { useState } from 'react';
import { Container, Typography, Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Chip, Paper, Grid, Slider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationSelector from '../components/map/LocationSelector';

const SearchByTrajectoryPage = () => {
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [departureTime, setDepartureTime] = useState('');
  const [maxDeviation, setMaxDeviation] = useState(2); // km
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Xử lý khi người dùng chọn địa điểm trên bản đồ
  const handleLocationSelect = (locations) => {
    setSelectedLocations(locations);
  };

  // Xử lý thay đổi độ lệch tối đa
  const handleDeviationChange = (event, newValue) => {
    setMaxDeviation(newValue);
  };

  // Hàm tìm kiếm chuyến đi dựa trên lộ trình
  const handleSearch = () => {
    if (selectedLocations.length < 2) {
      alert('Please select at least start and end locations');
      return;
    }

    setIsSearching(true);
    
    // Dữ liệu gửi đi để tìm kiếm chuyến đi theo lộ trình
    const searchData = {
      locations: selectedLocations.map(loc => ({
        lat: loc.lat,
        lon: loc.lon,
        name: loc.name
      })),
      departureTime: departureTime || null,
      maxDeviation
    };

    console.log('Searching for rides by trajectory:', searchData);

    // TODO: Gọi API để tìm kiếm chuyến đi
    // Mô phỏng kết quả tìm kiếm
    setTimeout(() => {
      const mockResults = [
        {
          id: 1,
          driver: {
            id: 101,
            name: 'Nguyễn Văn A',
            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            rating: 4.8
          },
          startTime: '2023-05-08T08:00:00',
          endTime: '2023-05-08T10:00:00',
          startLocation: 'Bến Thành Market, Ho Chi Minh City',
          endLocation: 'Landmark 81, Ho Chi Minh City',
          waypoints: ['Saigon Notre-Dame Cathedral', 'Thao Dien, District 2'],
          deviation: 1.2,
          price: 120000,
          availableSeats: 3
        },
        {
          id: 2,
          driver: {
            id: 102,
            name: 'Trần Thị B',
            avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
            rating: 4.5
          },
          startTime: '2023-05-08T09:30:00',
          endTime: '2023-05-08T12:00:00',
          startLocation: 'Saigon Central Post Office, Ho Chi Minh City',
          endLocation: 'Dam Sen Water Park, Ho Chi Minh City',
          waypoints: ['District 5, Ho Chi Minh City'],
          deviation: 0.8,
          price: 150000,
          availableSeats: 2
        }
      ];

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Search Rides by Trajectory
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Select your route points on the map to find rides that follow a similar trajectory
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Departure Time (Optional)"
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography id="deviation-slider" gutterBottom>
              Maximum Route Deviation: {maxDeviation} km
            </Typography>
            <Slider
              value={maxDeviation}
              onChange={handleDeviationChange}
              aria-labelledby="deviation-slider"
              step={0.5}
              marks={[
                { value: 0.5, label: '0.5 km' },
                { value: 5, label: '5 km' }
              ]}
              min={0.5}
              max={5}
            />
          </Grid>
        </Grid>

        {/* Component chọn lộ trình */}
        <LocationSelector 
          mode="trajectory"
          onLocationSelect={handleLocationSelect}
          initialLocations={[]}
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={isSearching || selectedLocations.length < 2}
          >
            Search Rides
          </Button>
        </Box>
      </Paper>

      {/* Kết quả tìm kiếm */}
      {searchResults.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Search Results
          </Typography>
          
          {searchResults.map(ride => (
            <Paper key={ride.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">
                    {ride.startLocation} → {ride.endLocation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(ride.startTime).toLocaleString()} - {new Date(ride.endTime).toLocaleString()}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Waypoints:</strong> {ride.waypoints.join(' → ')}
                  </Typography>
                  
                  <Chip 
                    label={`Deviation: ${ride.deviation} km`} 
                    color={ride.deviation <= 1 ? "success" : "warning"}
                    size="small" 
                    sx={{ mt: 1 }} 
                  />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" color="primary">
                    {ride.price.toLocaleString()} VND
                  </Typography>
                  <Typography variant="body2">
                    {ride.availableSeats} seats available
                  </Typography>
                  <Button variant="outlined" color="primary" sx={{ mt: 1 }}>
                    View Details
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default SearchByTrajectoryPage;