import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api.service';
import { toast } from 'react-toastify';

const PaymentMethodsPage = () => {
  const { currentUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    isDefault: false
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment-methods');
      setPaymentMethods(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch payment methods');
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
      await api.post('/payment-methods', formData);
      toast.success('Payment method added successfully!');
      setFormData({
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        isDefault: false
      });
      fetchPaymentMethods();
    } catch (error) {
      toast.error('Failed to add payment method');
      console.error(error);
    }
  };

  const deletePaymentMethod = async (id) => {
    try {
      await api.delete(`/payment-methods/${id}`);
      toast.success('Payment method deleted successfully!');
      fetchPaymentMethods();
    } catch (error) {
      toast.error('Failed to delete payment method');
      console.error(error);
    }
  };

  const setDefaultPaymentMethod = async (id) => {
    try {
      await api.put(`/payment-methods/${id}/set-default`);
      toast.success('Default payment method updated!');
      fetchPaymentMethods();
    } catch (error) {
      toast.error('Failed to update default payment method');
      console.error(error);
    }
  };

  return (
    <div className="payment-methods-container">
      <h1>Payment Methods</h1>
      
      <div className="add-payment-method-section">
        <h2>Add New Payment Method</h2>
        <form onSubmit={handleSubmit} className="payment-method-form">
          <div className="form-group">
            <label htmlFor="cardNumber">Card Number</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              placeholder="XXXX XXXX XXXX XXXX"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="cardholderName">Cardholder Name</label>
            <input
              type="text"
              id="cardholderName"
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryMonth">Expiry Month</label>
              <select
                id="expiryMonth"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleChange}
                required
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = (i + 1).toString().padStart(2, '0');
                  return <option key={month} value={month}>{month}</option>;
                })}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="expiryYear">Expiry Year</label>
              <select
                id="expiryYear"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleChange}
                required
              >
                <option value="">Year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = (new Date().getFullYear() + i).toString();
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                maxLength="4"
                required
              />
            </div>
          </div>
          
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
              />
              Set as default payment method
            </label>
          </div>
          
          <button type="submit" className="btn btn-primary">Add Payment Method</button>
        </form>
      </div>
      
      <div className="payment-methods-list">
        <h2>Your Payment Methods</h2>
        {loading ? (
          <p>Loading payment methods...</p>
        ) : paymentMethods.length === 0 ? (
          <p>No payment methods found. Add your first payment method above!</p>
        ) : (
          <div className="payment-methods-grid">
            {paymentMethods.map(method => (
              <div key={method.id} className={`payment-method-card ${method.isDefault ? 'default' : ''}`}>
                <div className="card-type-icon">
                  {/* Card type icon would go here */}
                </div>
                <div className="card-details">
                  <h3>{method.cardType}</h3>
                  <p>**** **** **** {method.last4}</p>
                  <p>Expires: {method.expiryMonth}/{method.expiryYear}</p>
                  {method.isDefault && <div className="default-badge">Default</div>}
                </div>
                <div className="payment-method-actions">
                  {!method.isDefault && (
                    <button 
                      className="btn btn-sm"
                      onClick={() => setDefaultPaymentMethod(method.id)}
                    >
                      Set as Default
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deletePaymentMethod(method.id)}
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

export default PaymentMethodsPage;