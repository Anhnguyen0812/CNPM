import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, TextField, Button, FormControl, 
  InputLabel, Select, MenuItem, Chip, Paper, Grid, Card, CardContent, 
  CircularProgress, Alert, Snackbar, Avatar, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, 
  ListItemText, ListItemAvatar, Divider, Rating, InputAdornment,
  FormHelperText, RadioGroup, FormControlLabel, Radio, LinearProgress, Checkbox } from '@mui/material';
import { Timeline, TimelineItem, TimelineOppositeContent,
  TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from '@mui/lab';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import LocationSelector from '../components/map/LocationSelector';
import MapDisplay from '../components/map/MapDisplay';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserActivityChains, createActivityChain, createActivityInChain } from '../services/activity-chain.service';
import { findMatchingDrivers, acceptDriverMatch, markAsPassengerChain } from '../services/ride-matching.service';
import { getUserVehicles } from '../services/user.service';
import { tr } from 'date-fns/locale';

const SearchByActivitiesPage = () => {
  // User's activity chains
  const [activityChains, setActivityChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [selectedChainActivities, setSelectedChainActivities] = useState([]);
  
  // User's vehicle information
  const [userHasVehicle, setUserHasVehicle] = useState(false);
  
  // Matching results
  const [matchResults, setMatchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchParams, setSearchParams] = useState({
    timeWindow: 15,
    maxDistance: 2000,
    prioritizeTimeMatching: false,
    enhancedMatching: true,
    considerTraffic: true,
    maxDetourPercent: 25, 
    weightTimeFactors: true,
    useTimeFlexibility: false,
    useAbraAlgorithm: true
  });
  
  // Advanced search params visibility toggle
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Create chain dialog states
  const [createChainDialogOpen, setCreateChainDialogOpen] = useState(false);
  const [allowDialogClose, setAllowDialogClose] = useState(true); // Add this state variable
  const [newChainName, setNewChainName] = useState('');
  const [newChainRole, setNewChainRole] = useState('passenger'); // 'driver' or 'passenger'
  const [newActivities, setNewActivities] = useState([{
    activity_name: '',
    location_name: '',
    start_lat: null,
    start_lon: null,
    activity_time: new Date(),
    duration: 60,
    type: 0, // 0 = fixed location, 1 = flexible location
    sequence_order: 0
  }]);
  const [activeStep, setActiveStep] = useState(0);
  const [isCreatingChain, setIsCreatingChain] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Map reference for displaying routes
  const mapRef = useRef(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch user's activity chains and vehicle information
  useEffect(() => {
    fetchActivityChains();
    fetchUserVehicles();
  }, [user]);

  const fetchActivityChains = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching activity chains for user ID:', user.id);
      const chainsData = await getUserActivityChains();
      
      if (!chainsData || chainsData.length === 0) {
        console.log('No chains data returned from API or empty array');
        setActivityChains([]);
        // Luôn mở dialog tạo chuỗi hoạt động mới khi không có dữ liệu
        setCreateChainDialogOpen(true);
        setNotification({
          open: true,
          message: 'Bạn chưa có chuỗi hoạt động nào. Hãy tạo một chuỗi để bắt đầu tìm kiếm.',
          severity: 'info'
        });
        setIsLoading(false);
        return;
      }
      
      console.log('Fetched activity chains:', chainsData);
      
      // Kiểm tra và lọc các chuỗi không hợp lệ
      const validChains = Array.isArray(chainsData) ? chainsData.filter(chain => chain && chain.id) : [];
      
      if (validChains.length !== chainsData.length) {
        console.warn(`Filtered out ${chainsData.length - validChains.length} invalid chains`);
      }
      
      setActivityChains(validChains || []);
      
      // Nếu chưa có chuỗi được chọn nhưng có chuỗi khả dụng, chọn chuỗi đầu tiên
      if (!selectedChain && validChains.length > 0) {
        handleChainSelect(validChains[0].id);
      }
      
      // Nếu không có chuỗi hoạt động nào, mở dialog tạo chuỗi mới
      if (validChains.length === 0) {
        setCreateChainDialogOpen(true);
        setNotification({
          open: true,
          message: 'Bạn chưa có chuỗi hoạt động nào. Hãy tạo một chuỗi để bắt đầu tìm kiếm.',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Failed to fetch activity chains:', err);
      setError('Failed to load activity chains. Please try again later.');
      setActivityChains([]); // Set empty array on error
      
      // Mở dialog tạo chuỗi mới nếu có lỗi
      setCreateChainDialogOpen(true);
      setNotification({
        open: true,
        message: 'Có lỗi khi tải chuỗi hoạt động. Hãy tạo một chuỗi mới.',
        severity: 'warning'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVehicles = async () => {
    //if (!user) return;
    
    try {
      const vehicles = await getUserVehicles();
      setUserHasVehicle(vehicles && vehicles.length > 0);
     // console.log('User vehicles:', vehicles.length);
    } catch (err) {
      console.error('Error fetching user vehicles:', err);
      setUserHasVehicle(false);
    }
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  // Handle selecting an activity chain
  const handleChainSelect = (chainId) => {
    const chain = activityChains.find(chain => chain.id === chainId);
    if (chain) {
      setSelectedChain(chain);
      setSelectedChainActivities(chain.Activities || []);
    }
  };

  // Search for matching drivers
  const handleSearch = async () => {
    if (!selectedChain) {
      setNotification({
        open: true,
        message: 'Vui lòng chọn một chuỗi hoạt động',
        severity: 'warning'
      });
      return;
    }

    setIsSearching(true);
    setMatchResults([]);
    
    try {
      // Mark the selected chain as a passenger chain if it's not already
      if (!selectedChain.is_passenger) {
        await markAsPassengerChain(selectedChain.id, {});
      }
      
      // Gọi API với đầy đủ các tùy chọn ABRA
      const matches = await findMatchingDrivers(selectedChain.id, searchParams);
      
      setMatchResults(matches);
      
      if (matches.length === 0) {
        setNotification({
          open: true,
          message: 'Không tìm thấy tài xế phù hợp. Hãy điều chỉnh tham số tìm kiếm.',
          severity: 'info'
        });
      } else {
        setNotification({
          open: true,
          message: `Đã tìm thấy ${matches.length} tài xế phù hợp!`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error searching for matching drivers:', err);
      setNotification({
        open: true,
        message: err.message || 'Lỗi khi tìm kiếm tài xế. Vui lòng thử lại.',
        severity: 'error'
      });
      setMatchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // View match details
  const handleViewMatch = (match) => {
    setSelectedMatch(match);
    setDialogOpen(true);
  };

  // Accept a driver match
  const handleAcceptMatch = (match) => {
    setSelectedMatch(match);
    setPaymentDialogOpen(true);
  };

  // Complete the matching process with payment
  const handleCompleteMatch = async () => {
    if (!selectedMatch || !paymentMethod) {
      setNotification({
        open: true,
        message: 'Please select a payment method',
        severity: 'warning'
      });
      return;
    }

    try {
      const result = await acceptDriverMatch(selectedChain.id, selectedMatch.driverChain.id);
      
      setPaymentDialogOpen(false);
      setDialogOpen(false);
      
      setNotification({
        open: true,
        message: 'Match accepted successfully! The driver has been notified.',
        severity: 'success'
      });
      
      // Navigate to booking history or ride details after successful match
      setTimeout(() => {
        navigate('/ride-details/' + result.passengerChain.id);
      }, 2000);
    } catch (err) {
      console.error('Error accepting driver match:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to accept match. Please try again.',
        severity: 'error'
      });
    }
  };

  // Close notification
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // Handle opening the create chain dialog
  const handleOpenCreateChainDialog = () => {
    
    console.log('you have vehicle:', userHasVehicle); 
    
    // Log user vehicle status for debugging
    setCreateChainDialogOpen(true);
    setNewChainName('');
    setNewChainRole(userHasVehicle ? 'passenger' : 'passenger'); // Default to passenger, but allow selection if user has vehicle
    setNewActivities([{
      activity_name: '',
      location_name: '',
      start_lat: null,
      start_lon: null,
      activity_time: new Date(),
      duration: 60,
      type: 0,
      sequence_order: 0
    }]);
    setActiveStep(0);
  };

  // Handle closing the create chain dialog
  const handleCloseCreateChainDialog = () => {
    setCreateChainDialogOpen(false);
  };

  // Handle adding a new activity to the chain being created
  const handleAddActivity = () => {
    setNewActivities([
      ...newActivities,
      {
        activity_name: '',
        location_name: '',
        start_lat: null,
        start_lon: null,
        activity_time: new Date(),
        duration: 60,
        type: 0,
        sequence_order: newActivities.length
      }
    ]);
  };

  // Handle removing an activity from the chain being created
  const handleRemoveActivity = (index) => {
    const updatedActivities = [...newActivities];
    updatedActivities.splice(index, 1);
    
    // Update sequence order
    updatedActivities.forEach((activity, idx) => {
      activity.sequence_order = idx;
    });
    
    setNewActivities(updatedActivities);
  };

  // Handle changing activity details
  const handleActivityChange = (index, field, value) => {
    const updatedActivities = [...newActivities];
    updatedActivities[index][field] = value;
    setNewActivities(updatedActivities);
  };

  // Handle location selection for an activity
  const handleActivityLocationSelect = (index, location) => {
    if (!location) return;
    
    const updatedActivities = [...newActivities];
    updatedActivities[index].start_lat = location.lat;
    updatedActivities[index].start_lon = location.lon;
    updatedActivities[index].location_name = location.name || `Location (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)})`;
    setNewActivities(updatedActivities);
    setSelectedLocation(null);
  };

  // Handle creating a new activity chain
  const handleCreateChain = async () => {
    if (!newChainName.trim()) {
      setNotification({
        open: true,
        message: 'Please enter a name for the activity chain',
        severity: 'warning'
      });
      return;
    }
    
    // Sửa điều kiện kiểm tra: Nếu là địa điểm linh hoạt thì không cần tọa độ
    if (newActivities.some(activity => 
      !activity.activity_name || 
      (activity.type === 0 && (!activity.start_lat || !activity.start_lon)))) {
      setNotification({
        open: true,
        message: 'Please fill in all activity details including locations for fixed locations',
        severity: 'warning'
      });
      return;
    }
    
    setIsCreatingChain(true);
    setAllowDialogClose(false); // Prevent dialog from closing during creation
    
    try {
      // Create the activity chain
      const chainData = {
        name: newChainName,
        description: `Created on ${new Date().toLocaleDateString()}`,
        is_recurring: false,
        is_passenger: newChainRole === 'passenger', // Set based on selected role
        is_driver: newChainRole === 'driver'
      };
      
      const newChain = await createActivityChain(chainData);
      console.log('Created new chain:', newChain);
      
      // Create activities for the chain sequentially to ensure proper order
      for (let i = 0; i < newActivities.length; i++) {
        const activity = newActivities[i];
        
        // Đối với địa điểm linh hoạt không có tọa độ, thiết lập giá trị mặc định
        const activityData = {
          ...activity,
          // Ensure date is in ISO format
          activity_time: new Date(activity.activity_time).toISOString()
        };
        
        // Nếu là địa điểm linh hoạt và không có tọa độ, đặt tọa độ mặc định là null
        if (activity.type === 1 && (!activity.start_lat || !activity.start_lon)) {
          activityData.start_lat = null;
          activityData.start_lon = null;
          activityData.location_name = `Any ${activity.poi_category || 'suitable'} location`;
        }
        
        await createActivityInChain(newChain.id, activityData);
      }
      
      // Close dialog first to prevent multiple submissions
      setCreateChainDialogOpen(false);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Activity chain created successfully!',
        severity: 'success'
      });
      
      // Reset form state to prevent accidental resubmission
      setNewChainName('');
      setNewActivities([{
        activity_name: '',
        location_name: '',
        start_lat: null,
        start_lon: null,
        activity_time: new Date(),
        duration: 60,
        type: 0,
        sequence_order: 0
      }]);
      setActiveStep(0);
      
      // Fetch updated chains after creation is complete
      const chainsData = await getUserActivityChains();
      setActivityChains(chainsData || []);
      
      // Find and select the newly created chain
      if (chainsData && chainsData.length > 0) {
        // Look for the chain with the matching name that was just created
        const createdChain = chainsData.find(chain => chain.name === newChainName);
        if (createdChain) {
          handleChainSelect(createdChain.id);
        } else {
          // If can't find by name, select the most recently created chain (assuming it's the one we just created)
          const mostRecentChain = chainsData.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest, chainsData[0]);
          handleChainSelect(mostRecentChain.id);
        }
      }
    } catch (err) {
      console.error('Error creating activity chain:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to create activity chain. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsCreatingChain(false);
      setAllowDialogClose(true); // Re-enable dialog close when done
    }
  };

  // Sửa điều kiện kiểm tra hợp lệ trước khi chuyển sang bước xem trước (review)
  const validateActivitiesBeforeReview = () => {
    // return newActivities.every(activity => 
    //   activity.activity_name && 
    //   (activity.type === 1 || (activity.start_lat && activity.start_lon))
    // );
    return true; // Temporarily return true for all activities
  };

  // Render the activity chain selection
  const renderActivityChainSelection = () => {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Your Activity Chains</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateChainDialog}
          >
            Create New Chain
          </Button>
        </Box>

        {activityChains.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary">
              You don't have any activity chains yet. Create one to start matching.
            </Typography>
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="chain-select-label">Select Activity Chain</InputLabel>
            <Select
              labelId="chain-select-label"
              id="chain-select"
              value={selectedChain ? selectedChain.id : ''}
              label="Select Activity Chain"
              onChange={(e) => handleChainSelect(e.target.value)}
            >
              {activityChains.map((chain) => (
                <MenuItem key={chain.id} value={chain.id}>
                  {chain.name || `Chain #${chain.id}`} - {chain.Activities?.length || 0} activities
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    );
  };

  // Render the selected chain's activities
  const renderSelectedChainActivities = () => {
    if (!selectedChain || !selectedChainActivities.length) {
      return null;
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Selected Chain Activities
        </Typography>
        <List>
          {selectedChainActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.activity_name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {activity.location_name}
                      </Typography>
                      <br />
                      {formatDateTime(activity.activity_time)}
                      {activity.duration && ` - Duration: ${activity.duration} min`}
                    </>
                  }
                />
              </ListItem>
              {index < selectedChainActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  };

  // Render the search parameters form
  const renderSearchParameters = () => {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tham số tìm kiếm
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Khoảng thời gian (phút)"
              type="number"
              value={searchParams.timeWindow}
              onChange={(e) => setSearchParams({...searchParams, timeWindow: parseInt(e.target.value, 10) || 15})}
              InputProps={{ inputProps: { min: 5, max: 60 } }}
              helperText="Độ chênh lệch thời gian tối đa giữa các hoạt động (5-60 phút)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Khoảng cách tối đa (mét)"
              type="number"
              value={searchParams.maxDistance}
              onChange={(e) => setSearchParams({...searchParams, maxDistance: parseInt(e.target.value, 10) || 2000})}
              InputProps={{ inputProps: { min: 500, max: 5000 } }}
              helperText="Khoảng cách tối đa cho các địa điểm linh hoạt (500-5000 m)"
            />
          </Grid>

          <Grid item xs={12}>
            <Button 
              size="small" 
              color="primary" 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} 
              sx={{ mb: 1 }}
              endIcon={showAdvancedOptions ? <ExpandMoreIcon /> : <NavigateNextIcon />}
            >
              {showAdvancedOptions ? "Ẩn tùy chọn nâng cao" : "Hiển thị tùy chọn nâng cao ABRA"}
            </Button>
            
            {showAdvancedOptions && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                mt: 1, 
                mb: 2,
                bgcolor: 'rgba(227, 242, 253, 0.3)'
              }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Tùy chọn nâng cao thuật toán ABRA
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.useAbraAlgorithm}
                          onChange={(e) => setSearchParams({...searchParams, useAbraAlgorithm: e.target.checked})}
                        />
                      }
                      label="Sử dụng thuật toán ABRA"
                    />
                    <FormHelperText>Thuật toán dựa trên chuỗi hoạt động</FormHelperText>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.useTimeFlexibility}
                          onChange={(e) => setSearchParams({...searchParams, useTimeFlexibility: e.target.checked})}
                        />
                      }
                      label="Độ linh hoạt về thời gian"
                    />
                    <FormHelperText>Cho phép điều chỉnh thời gian hoạt động</FormHelperText>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.prioritizeTimeMatching}
                          onChange={(e) => setSearchParams({...searchParams, prioritizeTimeMatching: e.target.checked})}
                        />
                      }
                      label="Ưu tiên khớp thời gian"
                    />
                    <FormHelperText>Xếp hạng kết quả theo mức độ phù hợp về thời gian</FormHelperText>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={searchParams.considerTraffic}
                          onChange={(e) => setSearchParams({...searchParams, considerTraffic: e.target.checked})}
                        />
                      }
                      label="Tính đến yếu tố giao thông"
                    />
                    <FormHelperText>Điều chỉnh thời gian dựa trên điều kiện giao thông</FormHelperText>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="% Độ lệch tối đa"
                      type="number"
                      value={searchParams.maxDetourPercent}
                      onChange={(e) => setSearchParams({...searchParams, maxDetourPercent: parseInt(e.target.value, 10) || 25})}
                      InputProps={{ inputProps: { min: 10, max: 50 } }}
                      helperText="Phần trăm đường vòng tối đa cho phép (10-50%)"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={isSearching || !selectedChain}
          >
            {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Tìm tài xế phù hợp'}
          </Button>
        </Box>
      </Paper>
    );
  };

  // Render the search results
  const renderSearchResults = () => {
    if (matchResults.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Tài xế phù hợp ({matchResults.length})
        </Typography>
        
        {matchResults.map((match, index) => (
          <Paper key={index} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={match.driver.profile_picture} 
                    alt={match.driver.name}
                    sx={{ mr: 2, width: 56, height: 56 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      {match.driver.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        Độ tương thích:
                      </Typography>
                      <Rating 
                        value={(match.compatibilityScore || 0) * 5} 
                        precision={0.5} 
                        readOnly 
                        size="small" 
                      />
                      <Typography variant="body2" color="text.primary" sx={{ ml: 1 }}>
                        {((match.compatibilityScore || 0) * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Hoạt động tương thích: {match.compatibleActivities}/{match.totalActivities}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`Khoảng cách: ${((match.combinedRoute?.geoJSONRoute?.properties?.distance || 0)/1000).toFixed(1)} km`} 
                    color="primary" 
                    size="small"
                    icon={<DirectionsCarIcon />}
                  />
                  
                  <Chip 
                    label={`Thời gian di chuyển: ${Math.round((match.combinedRoute?.geoJSONRoute?.properties?.duration || 0) / 60)} phút`} 
                    color="secondary" 
                    size="small"
                    icon={<AccessTimeIcon />}
                  />
                  
                  {match.driverChain.vehicle_details && (
                    <Chip 
                      label={JSON.parse(match.driverChain.vehicle_details).vehicle_type || 'Xe hơi'} 
                      variant="outlined" 
                      size="small"
                    />
                  )}
                </Box>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Hoạt động của tài xế</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Timeline position="alternate" sx={{ maxHeight: '300px', overflow: 'auto' }}>
                      {match.driverChain.Activities?.map((activity, idx) => (
                        <TimelineItem key={idx}>
                          <TimelineOppositeContent color="text.secondary">
                            {formatDateTime(activity.activity_time)}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="secondary" />
                            {idx < match.driverChain.Activities.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="body1">{activity.activity_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.location_name}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Hoạt động tương thích</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {match.matchedActivities?.map((matchedActivity, idx) => (
                        <ListItem key={idx}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: matchedActivity.score > 0.8 ? 'success.main' : 
                                      matchedActivity.score > 0.5 ? 'warning.main' : 'info.main' 
                            }}>
                              <CheckIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="body1">
                                  {matchedActivity.passengerActivity?.activity_name} ↔ {matchedActivity.driverActivity?.activity_name}
                                </Typography>
                                {matchedActivity.alternativePOIs && matchedActivity.alternativePOIs.length > 0 && (
                                  <Chip 
                                    size="small" 
                                    color="success" 
                                    label="Địa điểm linh hoạt" 
                                    sx={{ ml: 1, height: 20 }} 
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <>
                                {matchedActivity.alternativePOIs && matchedActivity.alternativePOIs.length > 0 ? (
                                  <Box>
                                    <Typography component="span" variant="body2" color="success.main">
                                      {matchedActivity.alternativePOIs.length} địa điểm thay thế có sẵn
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {matchedActivity.alternativePOIs.slice(0, 3).map((poi, i) => (
                                        <Chip
                                          key={i}
                                          size="small"
                                          label={poi.name}
                                          color="primary"
                                          variant="outlined"
                                          sx={{ height: 24 }}
                                        />
                                      ))}
                                      {matchedActivity.alternativePOIs.length > 3 && (
                                        <Chip
                                          size="small"
                                          label={`+${matchedActivity.alternativePOIs.length - 3} khác`}
                                          color="default"
                                          variant="outlined"
                                          sx={{ height: 24 }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Typography component="span" variant="body2">
                                    Khoảng cách: {((matchedActivity.distance || 0)/1000).toFixed(2)} km
                                  </Typography>
                                )}
                                <br />
                                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      Bạn: {formatDateTime(matchedActivity.passengerActivity?.activity_time)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                      Tài xế: {formatDateTime(matchedActivity.driverActivity?.activity_time)}
                                    </Typography>
                                  </Box>
                                </Box>
                                {matchedActivity.score !== undefined && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                      Độ tương thích:
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={matchedActivity.score * 100} 
                                      sx={{ width: '80px', mr: 1, borderRadius: 1 }}
                                      color={
                                        matchedActivity.score > 0.8 ? 'success' : 
                                        matchedActivity.score > 0.5 ? 'warning' : 'info'
                                      }
                                    />
                                    <Typography variant="body2" color="text.primary">
                                      {(matchedActivity.score * 100).toFixed(0)}%
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => handleViewMatch(match)}
                    startIcon={<LocationOnIcon />}
                    sx={{ mb: 2, width: '100%' }}
                  >
                    Xem lộ trình trên bản đồ
                  </Button>
                  
                  {match.combinedRoute && (
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 1, 
                      mb: 2,
                      bgcolor: 'rgba(227, 242, 253, 0.3)'
                    }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Thông tin lộ trình ABRA
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DirectionsCarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Tổng khoảng cách: {((match.combinedRoute.geoJSONRoute?.properties?.distance || 0)/1000).toFixed(1)} km
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Thời gian di chuyển: {Math.round((match.combinedRoute.geoJSONRoute?.properties?.duration || 0) / 60)} phút
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Người lái xe: {match.combinedRoute.driver === match.driver.id ? match.driver.name : 'Chưa xác định'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => handleAcceptMatch(match)}
                  startIcon={<CheckIcon />}
                  size="large"
                >
                  Chọn tài xế này
                </Button>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
    );
  };

  // Render the match details dialog
  const renderMatchDetailsDialog = () => {
    if (!selectedMatch) return null;
    
    return (
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Lộ trình với tài xế {selectedMatch.driver.name}
            </Typography>
            <Chip 
              color="primary" 
              label={`Độ tương thích: ${((selectedMatch.compatibilityScore || 0) * 100).toFixed(0)}%`}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box sx={{ height: 450, width: '100%', mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <MapDisplay
                  ref={mapRef}
                  center={[
                    selectedChainActivities[0]?.start_lat || 10.762622,
                    selectedChainActivities[0]?.start_lon || 106.660172
                  ]}
                  zoom={12}
                  markers={[
                    ...selectedChainActivities.map(activity => ({
                      id: `passenger-${activity.id}`,
                      position: [activity.start_lat, activity.start_lon],
                      popup: `${activity.activity_name} - ${formatDateTime(activity.activity_time)}`,
                      color: 'blue',
                      icon: 'person'
                    })),
                    ...selectedMatch.driverChain.Activities?.map(activity => ({
                      id: `driver-${activity.id}`,
                      position: [activity.start_lat, activity.start_lon],
                      popup: `${activity.activity_name} - ${formatDateTime(activity.activity_time)}`,
                      color: 'green',
                      icon: 'car'
                    })),
                    // Thêm các POI thay thế từ thuật toán ABRA
                    ...(selectedMatch.matchedActivities || [])
                      .filter(ma => ma.alternativePOIs && ma.alternativePOIs.length > 0)
                      .flatMap(ma => ma.alternativePOIs.map((poi, idx) => ({
                        id: `poi-${ma.id}-${idx}`,
                        position: [poi.coordinates[0], poi.coordinates[1]],
                        popup: `${poi.name} - ${poi.type || 'POI linh hoạt'}`,
                        color: 'orange',
                        icon: 'poi'
                      })))
                  ]}
                  routeGeoJSON={selectedMatch.combinedRoute?.geoJSONRoute || selectedMatch.mergedRoute?.route}
                />
              </Box>
              
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Thông tin lộ trình
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DirectionsCarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Tổng khoảng cách: {((selectedMatch.combinedRoute?.geoJSONRoute?.properties?.distance || 0)/1000).toFixed(1)} km
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Thời gian di chuyển: {Math.round((selectedMatch.combinedRoute?.geoJSONRoute?.properties?.duration || 0) / 60)} phút
                      </Typography>
                    </Box>
                  </Grid>
                  {selectedMatch.combinedRoute?.optimizedStops && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="body2" color="success.main">
                          Lộ trình đã được tối ưu với thuật toán ABRA
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Hoạt động được ghép đôi
              </Typography>
              
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {selectedMatch.matchedActivities?.map((matchedActivity, idx) => (
                  <Paper key={idx} sx={{ mb: 2, p: 2, border: matchedActivity.alternativePOIs?.length > 0 ? '1px solid #4caf50' : '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Ghép đôi #{idx + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          Độ tương thích:
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={matchedActivity.score * 100} 
                          sx={{ width: '60px', mr: 1, borderRadius: 1 }}
                          color={
                            matchedActivity.score > 0.8 ? 'success' : 
                            matchedActivity.score > 0.5 ? 'warning' : 'info'
                          }
                        />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {(matchedActivity.score * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: 'primary.light', 
                          color: 'primary.contrastText', 
                          borderRadius: 1,
                          mb: 1
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Hoạt động của bạn
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {matchedActivity.passengerActivity?.activity_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {matchedActivity.passengerActivity?.location_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(matchedActivity.passengerActivity?.activity_time)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: 'success.light', 
                          color: 'success.contrastText', 
                          borderRadius: 1,
                          mb: 1
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Hoạt động của tài xế
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {matchedActivity.driverActivity?.activity_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {matchedActivity.driverActivity?.location_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(matchedActivity.driverActivity?.activity_time)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {matchedActivity.alternativePOIs && matchedActivity.alternativePOIs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Có {matchedActivity.alternativePOIs.length} địa điểm thay thế phù hợp:
                        </Typography>
                        <List dense>
                          {matchedActivity.alternativePOIs.slice(0, 3).map((poi, poiIdx) => (
                            <ListItem key={poiIdx} dense sx={{ py: 0.5 }}>
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Chip size="small" label={poi.name} color="primary" variant="outlined" />
                                    {poi.score !== undefined && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          ({(poi.score * 100).toFixed(0)}% phù hợp)
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption">
                                    {poi.type} • Khoảng cách đến tài xế: {((poi.distanceToDriver || 0)/1000).toFixed(2)} km
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                          {matchedActivity.alternativePOIs.length > 3 && (
                            <ListItem>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2" color="text.secondary">
                                    +{matchedActivity.alternativePOIs.length - 3} địa điểm khác...
                                  </Typography>
                                }
                              />
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    )}
                    
                    {!matchedActivity.alternativePOIs && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <DirectionsCarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          Khoảng cách: {((matchedActivity.distance || 0)/1000).toFixed(2)} km
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          Chênh lệch thời gian: {Math.round((matchedActivity.timeDiff || 0) / 60000)} phút
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  size="large"
                  onClick={() => {
                    setDialogOpen(false);
                    handleAcceptMatch(selectedMatch);
                  }}
                  startIcon={<CheckIcon />}
                >
                  Chọn tài xế này
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render the payment method dialog
  const renderPaymentDialog = () => {
    return (
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>Select Payment Method</Typography>
            <IconButton 
              aria-label="close" 
              onClick={() => setPaymentDialogOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Please select a payment method to continue with this ride match.
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="payment-method-label">Payment Method</InputLabel>
            <Select
              labelId="payment-method-label"
              id="payment-method"
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="stripe">Credit/Debit Card (via Stripe)</MenuItem>
              <MenuItem value="vnpay">VNPay</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            By proceeding, you agree to our terms and conditions regarding ride sharing and payments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCompleteMatch} 
            color="primary" 
            variant="contained"
            disabled={!paymentMethod}
          >
            Confirm & Pay
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Render the create chain dialog
  const renderCreateChainDialog = () => {
    return (
      <Dialog
        open={createChainDialogOpen}
        onClose={allowDialogClose ? handleCloseCreateChainDialog : undefined}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={!allowDialogClose}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 1 }} />
            Create New Activity Chain
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 4 }}>
            <Step>
              <StepLabel>Basic Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>Activities</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review</StepLabel>
            </Step>
          </Stepper>
          
          {activeStep === 0 ? (
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                label="Chain Name"
                value={newChainName}
                onChange={(e) => setNewChainName(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                autoFocus
                placeholder="E.g., My Daily Routine, Weekend Activities"
                helperText="Give your activity chain a memorable name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              {userHasVehicle && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Your Role in this Activity Chain
                  </Typography>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        value={newChainRole}
                        onChange={(e) => setNewChainRole(e.target.value)}
                      >
                        <FormControlLabel 
                          value="passenger" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon color="primary" sx={{ mr: 1 }} />
                              <Box>
                                <Typography variant="body1">Passenger</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Find drivers to share rides with
                                </Typography>
                              </Box>
                            </Box>
                          }
                          sx={{ 
                            mr: 4, 
                            p: 1, 
                            border: newChainRole === 'passenger' ? '1px solid #1976d2' : '1px solid transparent',
                            borderRadius: 1
                          }}
                        />
                        <FormControlLabel 
                          value="driver" 
                          control={<Radio />} 
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <DirectionsCarIcon color="primary" sx={{ mr: 1 }} />
                              <Box>
                                <Typography variant="body1">Driver</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Offer rides to passengers
                                </Typography>
                              </Box>
                            </Box>
                          }
                          sx={{ 
                            p: 1, 
                            border: newChainRole === 'driver' ? '1px solid #1976d2' : '1px solid transparent',
                            borderRadius: 1
                          }}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Paper>
                </Box>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setActiveStep(1)}
                  disabled={!newChainName.trim()}
                  endIcon={<NavigateNextIcon />}
                >
                  Next
                </Button>
              </Box>
            </Box>
          ) : activeStep === 1 ? (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Add Activities</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleAddActivity}
                >
                  Add Activity
                </Button>
              </Box>
              
              {newActivities.map((activity, index) => (
                <Paper key={index} sx={{ 
                  p: 2, 
                  mb: 2, 
                  position: 'relative',
                  border: !activity.activity_name || !activity.start_lat ? '1px solid #ffcccc' : 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <IconButton 
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => handleRemoveActivity(index)}
                    disabled={newActivities.length <= 1}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{index + 1}</Avatar>
                    <Typography variant="subtitle1">
                      {activity.activity_name || 'New Activity'}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Activity Name"
                        value={activity.activity_name}
                        onChange={(e) => handleActivityChange(index, 'activity_name', e.target.value)}
                        margin="dense"
                        variant="outlined"
                        required
                        error={!activity.activity_name}
                        helperText={!activity.activity_name ? "Activity name is required" : ""}
                        placeholder="E.g., Gym, Grocery Shopping, Coffee"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                          label="Activity Time"
                          value={activity.activity_time}
                          onChange={(newValue) => handleActivityChange(index, 'activity_time', newValue)}
                          slotProps={{ 
                            textField: { 
                              fullWidth: true,
                              margin: "dense",
                              helperText: "When this activity starts"
                            } 
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Duration (minutes)"
                        type="number"
                        value={activity.duration}
                        onChange={(e) => handleActivityChange(index, 'duration', parseInt(e.target.value) || 30)}
                        margin="dense"
                        variant="outlined"
                        InputProps={{ 
                          inputProps: { min: 5, max: 480 },
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccessTimeIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        helperText="How long you'll spend at this location"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Location Type</InputLabel>
                        <Select
                          value={activity.type}
                          label="Location Type"
                          onChange={(e) => handleActivityChange(index, 'type', e.target.value)}
                        >
                          <MenuItem value={0}>Fixed Location (specific address)</MenuItem>
                          <MenuItem value={1}>Flexible Location (can be any suitable place)</MenuItem>
                        </Select>
                        <FormHelperText>
                          {activity.type === 0 
                            ? "You need to go to this exact location" 
                            : "Any suitable location of this type will work"
                          }
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    
                    {activity.type === 1 && (
                      <Grid item xs={12}>
                        <FormControl fullWidth margin="dense">
                          <InputLabel>Place Category</InputLabel>
                          <Select
                            value={activity.poi_category || 'any'}
                            label="Place Category"
                            onChange={(e) => handleActivityChange(index, 'poi_category', e.target.value)}
                          >
                            <MenuItem value="any">Any suitable place</MenuItem>
                            <MenuItem value="supermarket">Supermarket</MenuItem>
                            <MenuItem value="cafe">Café</MenuItem>
                            <MenuItem value="restaurant">Restaurant</MenuItem>
                            <MenuItem value="gym">Gym</MenuItem>
                            <MenuItem value="pharmacy">Pharmacy</MenuItem>
                            <MenuItem value="shopping_mall">Shopping Mall</MenuItem>
                            <MenuItem value="park">Park</MenuItem>
                            <MenuItem value="library">Library</MenuItem>
                          </Select>
                          <FormHelperText>
                            Type of place needed for this activity
                          </FormHelperText>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Hiển thị bản đồ chọn vị trí chỉ khi là địa điểm cố định */}
                    {activity.type === 0 ? (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                          Select location on map {!activity.start_lat && <span style={{ color: '#d32f2f' }}>(required)</span>}
                        </Typography>
                        <Box sx={{ 
                          height: 400, 
                          mb: 2, 
                          border: !activity.start_lat ? '1px solid #ffcccc' : '1px solid #e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <LocationSelector
                            mode="single"
                            onLocationSelect={(locations) => handleActivityLocationSelect(index, locations[0])}
                            initialLocations={activity.start_lat ? [{
                              lat: activity.start_lat,
                              lon: activity.start_lon,
                              name: activity.location_name
                            }] : []}
                          />
                        </Box>
                        
                        {activity.location_name ? (
                          <Chip
                            icon={<LocationOnIcon />}
                            label={activity.location_name}
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="error">
                            Please select a location for this activity
                          </Typography>
                        )}
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                          Any location of type "{activity.poi_category || 'suitable'}" will be used
                        </Typography>
                        <Alert severity="info" sx={{ mt: 1 }}>
                          You don't need to select a specific location. Our system will find suitable locations of this type during ride matching.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveStep(0)}
                  startIcon={<NavigateBeforeIcon />}
                >
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    // Check validation before moving to review step
                    const isValid = validateActivitiesBeforeReview();
                    
                    if (isValid) {
                      setActiveStep(2);
                    } else {
                      setNotification({
                        open: true,
                        message: 'Please fill in all required activity details',
                        severity: 'warning'
                      });
                    }
                  }}
                  endIcon={<NavigateNextIcon />}
                >
                  Review
                </Button>
              </Box>
            </Box>
          ) : (
            // Review Step
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Review Your Activity Chain
              </Typography>
              
              <Box sx={{ py: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Chain Name: {newChainName}
                </Typography>
                {userHasVehicle && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Role:
                    </Typography>
                    <Chip
                      icon={newChainRole === 'driver' ? <DirectionsCarIcon /> : <PersonIcon />}
                      label={newChainRole === 'driver' ? 'Driver' : 'Passenger'}
                      color={newChainRole === 'driver' ? 'secondary' : 'primary'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Total Activities: {newActivities.length}
                </Typography>
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Activity Timeline
                </Typography>
                <Timeline position="alternate">
                  {newActivities.map((activity, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent color="text.secondary">
                        {new Date(activity.activity_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="primary" />
                        {index < newActivities.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body1">
                          {activity.activity_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.location_name.split(',')[0]}
                        </Typography>
                        <Typography variant="caption">
                          Duration: {activity.duration} min
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Paper>
              
              <Box sx={{ height: 300, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Activity Locations
                </Typography>
                <MapDisplay
                  startPoint={newActivities.length > 0 ? {
                    lat: newActivities[0].start_lat,
                    lon: newActivities[0].start_lon,
                    name: newActivities[0].activity_name
                  } : null}
                  waypoints={newActivities.slice(1).map(activity => ({
                    lat: activity.start_lat,
                    lon: activity.start_lon,
                    name: activity.activity_name
                  }))}
                  height="300px"
                />
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                After creating this activity chain, you'll be able to search for matching drivers
                who can share rides to these locations.
              </Alert>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveStep(1)}
                  startIcon={<NavigateBeforeIcon />}
                >
                  Back to Edit
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleCreateChain}
                  disabled={isCreatingChain}
                  startIcon={isCreatingChain ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {isCreatingChain ? 'Creating...' : 'Create Activity Chain'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Find Rideshare Group by Activity Chain
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Match your daily activities with drivers going to similar locations at similar times
        </Typography>
      </Box>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            {renderActivityChainSelection()}
            {renderSelectedChainActivities()}
          </Paper>
          
          {selectedChain && renderSearchParameters()}
          {renderSearchResults()}
          {renderMatchDetailsDialog()}
          {renderPaymentDialog()}
          {renderCreateChainDialog()}
        </>
      )}
    </Container>
  );
};

export default SearchByActivitiesPage;