import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import './DonationForm.css';
import AmountSelection from './AmountSelection';
import FormFields from './FormFields';
import CardInformation from './CardInformation';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const DonationFormContent = () => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const predefinedAmounts = [10, 25, 50, 100];

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setAmount(e.target.value);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'Inter, Arial, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#6772e5',
      },
      invalid: {
        color: '#e53e3e',
        iconColor: '#e53e3e',
      },
    },
    hidePostalCode: true,
    iconStyle: 'solid',
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !amount || amount <= 0) {
      setMessage('Please select a valid donation amount.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    const cardElement = elements.getElement(CardElement);

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: fullName,
          email: email,
        },
      });

      if (error) {
        setMessage(`Payment failed: ${error.message}`);
        setIsProcessing(false);
      } else {
        // Simulate a server confirmation of payment success
        const paymentSuccess = true; // Replace with actual backend confirmation

        if (paymentSuccess) {
          navigate('/thank-you', { state: { amount, fullName, email, paymentMethod } });
        } else {
          setMessage('Payment failed. Please try again.');
          setIsProcessing(false);
        }
      }
    } catch (error) {
      setMessage(`An error occurred: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="donation-container">
      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-header">
          <h2>Make a Donation</h2>
          <p>Your support helps us make a difference</p>
        </div>
        
        <AmountSelection 
          predefinedAmounts={predefinedAmounts} 
          amount={amount} 
          customAmount={customAmount} 
          handleAmountSelect={handleAmountSelect} 
          handleCustomAmountChange={handleCustomAmountChange} 
        />
        
        <FormFields 
          fullName={fullName} 
          setFullName={setFullName} 
          email={email} 
          setEmail={setEmail} 
        />
        
        <CardInformation cardElementOptions={cardElementOptions} />
        
        <button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="donation-submit-button"
        >
          {isProcessing ? 'Processing...' : `Donate $${amount || '0'}`}
        </button>
        
        {message && (
          <div className={`message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="secure-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Secure donation via Stripe</span>
        </div>
      </form>
    </div>
  );
};

const DonationForm = () => (
  <Elements stripe={stripePromise}>
    <DonationFormContent />
  </Elements>
);

export default DonationForm;
