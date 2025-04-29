import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    bio: '',
    address: ''
  });
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setUserProfile(response.data.data);
        
        // Initialize form data with user profile data
        setFormData({
          name: response.data.data.name || '',
          phone: response.data.data.phone || '',
          date_of_birth: response.data.data.date_of_birth || '',
          gender: response.data.data.gender || '',
          bio: response.data.data.bio || '',
          address: response.data.data.address || ''
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update basic user information
      const userUpdateData = {
        name: formData.name,
        phone: formData.phone
      };
      
      // Update profile data
      const profileUpdateData = {
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        bio: formData.bio || null,
        address: formData.address || null
      };
      
      // Update user basic data
      await updateProfile(userUpdateData);
      
      // Update user profile data
      await api.put(`/users/${currentUser.id}/profile`, profileUpdateData);
      
      // Refresh profile data
      const response = await api.get('/auth/profile');
      setUserProfile(response.data.data);
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG or PNG image');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      setIsSubmitting(true);
      const response = await api.post(`/users/${currentUser.id}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user profile with new profile picture
      setUserProfile({
        ...userProfile,
        profile_picture: response.data.data.profile_picture
      });
      
      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Your Profile</h1>
        <p>View and manage your personal information</p>
      </div>
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-picture-container">
            {userProfile.profile_picture ? (
              <img 
                src={userProfile.profile_picture} 
                alt={userProfile.name} 
                className="profile-picture" 
              />
            ) : (
              <div className="profile-picture-placeholder">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <label className="upload-picture-btn">
              Change Picture
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleProfilePictureUpload} 
                disabled={isSubmitting}
              />
            </label>
          </div>
          
          <div className="profile-info">
            <h2>{userProfile.name}</h2>
            <p className="user-role">{userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}</p>
            <p className="user-email">{userProfile.email}</p>
            <p className="user-phone">{userProfile.phone}</p>
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">4.8</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">23</span>
                <span className="stat-label">Rides</span>
              </div>
            </div>
            
            {!isEditing && (
              <button 
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        <div className="profile-content">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <h3>Edit Profile</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us a bit about yourself"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <h3>Profile Details</h3>
              
              <div className="profile-detail-group">
                <h4>Basic Information</h4>
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{userProfile.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{userProfile.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{userProfile.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">
                    {userProfile.date_of_birth || 'Not provided'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">
                    {userProfile.gender ? 
                      userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 
                      'Not provided'}
                  </span>
                </div>
              </div>
              
              <div className="profile-detail-group">
                <h4>Additional Information</h4>
                <div className="detail-item">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">
                    {userProfile.address || 'Not provided'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bio</span>
                  <p className="detail-value bio-text">
                    {userProfile.bio || 'No bio added yet.'}
                  </p>
                </div>
              </div>
              
              {userProfile.role === 'driver' && (
                <div className="profile-detail-group">
                  <h4>Driver Information</h4>
                  <div className="detail-item">
                    <span className="detail-label">Vehicle Count</span>
                    <span className="detail-value">2 vehicles</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Active Vehicle</span>
                    <span className="detail-value">Toyota Vios (51A-12345)</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Rides</span>
                    <span className="detail-value">43 rides</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;