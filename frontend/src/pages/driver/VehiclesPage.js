import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api.service';
import { toast } from 'react-toastify';

const VehiclesPage = () => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    isActive: true
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      setVehicles(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch vehicles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', formData);
      toast.success('Vehicle added successfully!');
      setFormData({
        make: '',
        model: '',
        year: '',
        color: '',
        licensePlate: '',
        isActive: true
      });
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to add vehicle');
      console.error(error);
    }
  };

  return (
    <div className="vehicles-container">
      <h1>My Vehicles</h1>
      
      <div className="add-vehicle-section">
        <h2>Add New Vehicle</h2>
        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-group">
            <label htmlFor="make">Make</label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Color</label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="licensePlate">License Plate</label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Set as active vehicle
            </label>
          </div>
          
          <button type="submit" className="btn btn-primary">Add Vehicle</button>
        </form>
      </div>
      
      <div className="vehicles-list">
        <h2>My Vehicles</h2>
        {loading ? (
          <p>Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <p>No vehicles found. Add your first vehicle above!</p>
        ) : (
          <div className="vehicles-grid">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className={`vehicle-card ${vehicle.isActive ? 'active' : ''}`}>
                <h3>{vehicle.make} {vehicle.model}</h3>
                <p>Year: {vehicle.year}</p>
                <p>Color: {vehicle.color}</p>
                <p>License Plate: {vehicle.licensePlate}</p>
                <p>Status: {vehicle.isActive ? 'Active' : 'Inactive'}</p>
                <div className="vehicle-actions">
                  <button 
                    className="btn btn-sm"
                    onClick={() => {
                      // Edit vehicle logic would go here
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      // Delete vehicle logic would go here
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclesPage;