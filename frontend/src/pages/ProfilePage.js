import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile, getUserVehicles, addVehicle, updateVehicle, deleteVehicle } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // User profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    smokingPreference: 'no_smoking',
    password: '',
    confirmPassword: '',
    changePassword: false,
  });
  
  // Vehicle management state
  const [vehicles, setVehicles] = useState([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    capacity: 4,
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleSuccess, setVehicleSuccess] = useState('');

  // Helper: map backend vehicle fields to frontend fields
  const mapBackendToFrontendVehicle = (vehicle) => {
    // Defensive: fallback to empty string if undefined
    let make = '', model = '';
    if (vehicle.vehicle_name) {
      const parts = vehicle.vehicle_name.split(' ');
      make = parts[0] || '';
      model = parts.slice(1).join(' ') || '';
    }
    return {
      id: vehicle.id,
      make,
      model,
      year: vehicle.year || '',
      color: vehicle.vehicle_color || '',
      licensePlate: vehicle.vehicle_number || '',
      capacity: vehicle.capacity || '',
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const userData = await getUserProfile();
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          gender: userData.gender || 'male',
          smokingPreference: userData.smokingPreference || 'no_smoking',
          password: '',
          confirmPassword: '',
          changePassword: false,
        });
        
        // Fetch user vehicles
        const vehiclesData = await getUserVehicles();
        // Map backend fields to frontend fields for display
        setVehicles(Array.isArray(vehiclesData)
          ? vehiclesData.map(mapBackendToFrontendVehicle)
          : []);
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Profile form handlers
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData({
      ...profileData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Validate passwords if changing
      if (profileData.changePassword) {
        if (!profileData.password) {
          throw new Error('Please enter a new password');
        }
        if (profileData.password !== profileData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
      }
      
      // Prepare data for update
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        gender: profileData.gender,
        smokingPreference: profileData.smokingPreference
      };
      
      // Include password only if changing
      if (profileData.changePassword && profileData.password) {
        updateData.password = profileData.password;
      }
      
      // Update profile
      await updateUserProfile(updateData);
      
      // Reset password fields
      setProfileData({
        ...profileData,
        password: '',
        confirmPassword: '',
        changePassword: false,
      });
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Vehicle form handlers
  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value
    });
  };

  const handleAddVehicle = () => {
    setVehicleData({
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      capacity: 4,
    });
    setEditingVehicleId(null);
    setShowVehicleForm(true);
    setVehicleError('');
    setVehicleSuccess('');
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      capacity: vehicle.capacity,
    });
    setEditingVehicleId(vehicle.id);
    setShowVehicleForm(true);
    setVehicleError('');
    setVehicleSuccess('');
  };

  const handleCancelVehicleForm = () => {
    setShowVehicleForm(false);
    setEditingVehicleId(null);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setVehicleError('');
    setVehicleSuccess('');
    setLoading(true);
    
    try {
      // Validate form
      if (!vehicleData.make || !vehicleData.model || !vehicleData.year || !vehicleData.licensePlate) {
        throw new Error('Please fill in all required fields');
      }
      
      const formattedVehicle = {
        ...vehicleData,
        year: parseInt(vehicleData.year),
        capacity: parseInt(vehicleData.capacity),
      };
      
      let response;
      if (editingVehicleId) {
        // Update existing vehicle
        response = await updateVehicle(editingVehicleId, formattedVehicle);
        setVehicles(vehicles.map(v => v.id === editingVehicleId ? response : v));
        setVehicleSuccess('Vehicle updated successfully');
      } else {
        // Add new vehicle
        response = await addVehicle(formattedVehicle);
        setVehicles([...vehicles, response]);
        setVehicleSuccess('Vehicle added successfully');
      }
      
      setShowVehicleForm(false);
      setEditingVehicleId(null);
    } catch (err) {
      setVehicleError(err.message || 'Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }
    
    setVehicleError('');
    setVehicleSuccess('');
    setLoading(true);
    
    try {
      await deleteVehicle(vehicleId);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      setVehicleSuccess('Vehicle deleted successfully');
    } catch (err) {
      setVehicleError(err.message || 'Failed to delete vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData.name) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h2>My Profile</h2>
      
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user"></i> Profile Info
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          <i className="fas fa-car"></i> Vehicles
        </button>
        <button 
          className={`tab-btn ${activeTab === 'journey-chains' ? 'active' : ''}`}
          onClick={() => setActiveTab('journey-chains')}
        >
          <i className="fas fa-route"></i> Journey Chains
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => navigate('/history')}
        >
          <i className="fas fa-history"></i> History
        </button>
      </div>
      
      {activeTab === 'profile' && (
        <div className="profile-section">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name:</label>
              <input
                id="name"
                name="name"
                type="text"
                value={profileData.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                disabled
              />
              <small>Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number:</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleProfileChange}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="smokingPreference">Smoking Preference:</label>
              <select
                id="smokingPreference"
                name="smokingPreference"
                value={profileData.smokingPreference}
                onChange={handleProfileChange}
                required
              >
                <option value="smoking">I smoke</option>
                <option value="no_smoking">I don't smoke</option>
                <option value="no_preference">No preference</option>
              </select>
              <small>This helps match you with compatible riders</small>
            </div>
            
            <div className="form-group checkbox-group">
              <input
                id="changePassword"
                name="changePassword"
                type="checkbox"
                checked={profileData.changePassword}
                onChange={handleProfileChange}
              />
              <label htmlFor="changePassword">Change Password</label>
            </div>
            
            {profileData.changePassword && (
              <>
                <div className="form-group">
                  <label htmlFor="password">New Password:</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={profileData.password}
                    onChange={handleProfileChange}
                    minLength="6"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    minLength="6"
                  />
                </div>
              </>
            )}
            
            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="danger-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'vehicles' && (
        <div className="vehicles-section">
          {vehicleError && <div className="error-message">{vehicleError}</div>}
          {vehicleSuccess && <div className="success-message">{vehicleSuccess}</div>}
          
          {!showVehicleForm ? (
            <>
              <div className="section-header">
                <h3>My Vehicles</h3>
                <button 
                  className="add-btn"
                  onClick={handleAddVehicle}
                >
                  Add Vehicle
                </button>
              </div>
              
              {vehicles.length === 0 ? (
                <div className="no-vehicles">
                  <p>You don't have any vehicles yet. Add one to start offering rides.</p>
                </div>
              ) : (
                <div className="vehicle-list">
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="vehicle-item">
                      <div className="vehicle-info">
                        <h4>{vehicle.make} {vehicle.model} ({vehicle.year})</h4>
                        <div className="vehicle-details">
                          <div className="detail-row">
                            <span className="label">Color:</span>
                            <span className="value">{vehicle.color}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">License Plate:</span>
                            <span className="value">{vehicle.licensePlate}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Capacity:</span>
                            <span className="value">{vehicle.capacity} seats</span>
                          </div>
                        </div>
                      </div>
                      <div className="vehicle-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditVehicle(vehicle)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="vehicle-form-container">
              <h3>{editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              
              <form onSubmit={handleVehicleSubmit} className="vehicle-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="make">Make:</label>
                    <input
                      id="make"
                      name="make"
                      type="text"
                      value={vehicleData.make}
                      onChange={handleVehicleChange}
                      required
                      placeholder="e.g., Toyota"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="model">Model:</label>
                    <input
                      id="model"
                      name="model"
                      type="text"
                      value={vehicleData.model}
                      onChange={handleVehicleChange}
                      required
                      placeholder="e.g., Camry"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Year:</label>
                    <input
                      id="year"
                      name="year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={vehicleData.year}
                      onChange={handleVehicleChange}
                      required
                      placeholder="e.g., 2020"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="color">Color:</label>
                    <input
                      id="color"
                      name="color"
                      type="text"
                      value={vehicleData.color}
                      onChange={handleVehicleChange}
                      required
                      placeholder="e.g., Blue"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="licensePlate">License Plate:</label>
                    <input
                      id="licensePlate"
                      name="licensePlate"
                      type="text"
                      value={vehicleData.licensePlate}
                      onChange={handleVehicleChange}
                      required
                      placeholder="e.g., ABC123"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="capacity">Passenger Capacity:</label>
                    <select
                      id="capacity"
                      name="capacity"
                      value={vehicleData.capacity}
                      onChange={handleVehicleChange}
                      required
                    >
                      <option value="1">1 seat</option>
                      <option value="2">2 seats</option>
                      <option value="3">3 seats</option>
                      <option value="4">4 seats</option>
                      <option value="5">5 seats</option>
                      <option value="6">6 seats</option>
                      <option value="7">7 seats</option>
                      <option value="8">8+ seats</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Saving...' : (editingVehicleId ? 'Update Vehicle' : 'Add Vehicle')}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCancelVehicleForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'journey-chains' && (
        <div className="journey-chains-section">
          <h3>My Journey Chains</h3>
          
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-route"></i>
            </div>
            <h4>No Journey Chains</h4>
            <p>Create journey chains to offer rides on regular routes you travel.</p>
            <Link to="/create-trajectory-group" className="primary-btn">
              Create Journey Chain
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;