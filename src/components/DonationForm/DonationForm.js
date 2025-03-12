import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import './DonationForm.css';
import AmountSelection from './AmountSelection';
import FormFields from './FormFields';
import CardInformation from './CardInformation';
import { createOneTimePayment, createSubscription } from '../../api/stripe';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const DonationFormContent = () => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
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

  const toggleSubscription = () => {
    setIsSubscription(!isSubscription);
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
        try {
          // Call the appropriate backend API endpoint based on donation type
          let response;
          if (isSubscription) {
            response = await createSubscription({
              paymentMethodId: paymentMethod.id,
              email,
              amount: parseFloat(amount),
              fullName
            });
          } else {
            response = await createOneTimePayment({
              paymentMethodId: paymentMethod.id,
              email,
              amount: parseFloat(amount),
              fullName
            });
          }

          // If we get here, the payment was successful
          navigate('/thank-you', { 
            state: { 
              amount, 
              fullName, 
              email, 
              paymentMethod: paymentMethod.id,
              isSubscription,
              paymentType: isSubscription ? 'monthly' : 'one-time',
              paymentId: response.id
            } 
          });
        } catch (error) {
          setMessage(`Payment processing failed: ${error.message}`);
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
        
        <div className="form-section donation-type-selector">
          <label className="form-label">Donation Type</label>
          <div className="donation-type-options">
            <button
              type="button"
              className={`donation-type-option ${!isSubscription ? 'selected' : ''}`}
              onClick={() => setIsSubscription(false)}
            >
              One-time
            </button>
            <button
              type="button"
              className={`donation-type-option ${isSubscription ? 'selected' : ''}`}
              onClick={() => setIsSubscription(true)}
            >
              Monthly
            </button>
          </div>
        </div>
        
        <AmountSelection 
          predefinedAmounts={predefinedAmounts} 
          amount={amount} 
          customAmount={customAmount} 
          handleAmountSelect={handleAmountSelect} 
          handleCustomAmountChange={handleCustomAmountChange} 
        />
        
        {isSubscription && (
          <div className="subscription-info-box">
            <p>You will be charged ${amount || '0'} monthly until you cancel.</p>
          </div>
        )}
        
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
          {isProcessing ? 'Processing...' : isSubscription 
            ? `Subscribe $${amount || '0'}/month` 
            : `Donate $${amount || '0'}`}
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