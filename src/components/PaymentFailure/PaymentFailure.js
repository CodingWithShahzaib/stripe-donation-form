import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentFailure.css';

const PaymentFailure = () => {
  const location = useLocation();
  const { error } = location.state || {};
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <div className="payment-failure-container">
      <div className="payment-failure-card">
        <div className="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <h1>Payment Failed</h1>
        <p className="error-message">
          {error || "We couldn't process your payment. Please try again."}
        </p>
        
        <div className="error-details">
          <h2>What happened?</h2>
          <p>Your payment could not be processed due to one of the following reasons:</p>
          <ul>
            <li>Insufficient funds in your account</li>
            <li>Card information was entered incorrectly</li>
            <li>Your card issuer declined the transaction</li>
            <li>There was a temporary technical issue</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <button onClick={handleRetry} className="primary-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Try Again
          </button>
          
          <button onClick={() => window.location.href = 'mailto:support@example.com'} className="secondary-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
