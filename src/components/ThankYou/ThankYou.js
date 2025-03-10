import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ThankYou.css';

const ThankYou = () => {
  const location = useLocation();
  const { amount, fullName, email, paymentMethod } = location.state || {};
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="thank-you-container">
      <div className="thank-you-card">
        <div className="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        
        <h1>Thank You for Your Donation!</h1>
        <p className="subtitle">Your generosity makes our work possible</p>
        
        {amount && (
          <div className="donation-details">
            <h2>Donation Receipt</h2>
            
            <div className="receipt-info">
              <div className="receipt-row">
                <span className="receipt-label">Date:</span>
                <span className="receipt-value">{formatDate()}</span>
              </div>
              
              {fullName && (
                <div className="receipt-row">
                  <span className="receipt-label">Name:</span>
                  <span className="receipt-value">{fullName}</span>
                </div>
              )}
              
              {email && (
                <div className="receipt-row">
                  <span className="receipt-label">Email:</span>
                  <span className="receipt-value">{email}</span>
                </div>
              )}
              
              <div className="receipt-row">
                <span className="receipt-label">Amount:</span>
                <span className="receipt-value receipt-amount">${amount}</span>
              </div>
              
              {paymentMethod && (
                <div className="receipt-row">
                  <span className="receipt-label">Payment Method:</span>
                  <span className="receipt-value">
                    {paymentMethod.card.brand.toUpperCase()} ending in {paymentMethod.card.last4}
                  </span>
                </div>
              )}
            </div>
            
            <div className="receipt-message">
              <p>A receipt has been sent to your email address.</p>
            </div>
          </div>
        )}
        
        <div className="action-buttons">
          <button onClick={handleGoBack} className="primary-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Return Home
          </button>
          
          <button onClick={() => window.print()} className="secondary-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
