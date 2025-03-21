import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import './DonationForm.css';
import AmountSelection from './AmountSelection';
import FormFields from './FormFields';
import CardInformation from './CardInformation';
import { createOneTimePayment, createSubscription } from '../../api/stripe';

// Initialize Stripe with or without connected account
const getStripePromise = (connectedAccountId) => {
  const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
  
  if (connectedAccountId) {
    console.log(`Initializing Stripe with connected account: ${connectedAccountId}`);
    return loadStripe(stripeKey, {
      stripeAccount: connectedAccountId
    });
  } else {
    console.log('Initializing Stripe with platform account');
    return loadStripe(stripeKey);
  }
};

// Default Stripe instance (platform account)
const stripePromise = getStripePromise();

// Your connected account ID - replace with your actual Stripe Connect account ID
const CONNECTED_ACCOUNT_ID = process.env.REACT_APP_CONNECTED_ACCOUNT_ID; // Replace with your actual ID

// New component for Express Checkout
const ExpressCheckout = ({ amount, isSubscription, fullName, email, onPaymentSuccess, onPaymentError, connectedAccountId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [expressCheckoutElement, setExpressCheckoutElement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe || !elements || !amount || amount <= 0) return;

    // Clean up previous elements
    if (expressCheckoutElement) {
      expressCheckoutElement.unmount();
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    console.log(`Setting up Express Checkout with amount: ${amount} (${amountInCents} cents)`);
    console.log(`Using Connected Account ID: ${connectedAccountId || 'none (platform account)'}`);
    
    const expressCheckoutOptions = {
      buttonType: {
        applePay: 'donate',
        googlePay: 'donate',
      }
    };

    // Create Elements instance with payment details
    const newElementsInstance = stripe.elements({
      mode: isSubscription ? 'subscription' : 'payment',
      amount: amountInCents,
      currency: 'usd',
      appearance: {
        theme: 'stripe',
      },
      // Add billing details
      paymentMethodCreationParams: {
        billing_details: {
          name: fullName,
          email: email,
        }
      },
      payment_method_types: ['card', 'link'],
      paymentMethodCreation: 'manual'
    });

    // Create and mount the Express Checkout Element
    const newExpressCheckoutElement = newElementsInstance.create(
      'expressCheckout',
      expressCheckoutOptions
    );

    newExpressCheckoutElement.on('loaderror', (event) => {
      console.error('Express Checkout load error:', event);
    });

    newExpressCheckoutElement.on('ready', () => {
      console.log('Express Checkout is ready');
    });

    newExpressCheckoutElement.on('confirm', async (event) => {
      try {
        setIsLoading(true);
        console.log('Express Checkout confirm event:', event);
        console.log(`Processing payment with Connected Account ID: ${connectedAccountId || 'none (platform account)'}`);
        
        // Create a payment method using the Elements instance with manual creation
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
          elements: newElementsInstance,
          params: {
            billing_details: {
              name: fullName,
              email: email,
            },
          },
        });
        
        if (paymentMethodError) {
          console.error('Payment method creation error:', paymentMethodError);
          throw new Error(`Payment method creation failed: ${paymentMethodError.message}`);
        }
        
        if (!paymentMethod || !paymentMethod.id) {
          throw new Error('Payment method information is missing');
        }
        
        const paymentMethodId = paymentMethod.id;
        console.log(`Created payment method ID: ${paymentMethodId} of type: ${paymentMethod.type}`);
        
        // Call the appropriate backend API endpoint based on donation type
        let response;
        try {
          if (isSubscription) {
            console.log(`Creating subscription with payment method ${paymentMethodId}`);
            response = await createSubscription({
              paymentMethodId,
              email,
              amount: parseFloat(amount),
              fullName,
              connectedAccountId
            });
          } else {
            console.log(`Creating one-time payment with payment method ${paymentMethodId}`);
            response = await createOneTimePayment({
              paymentMethodId,
              email,
              amount: parseFloat(amount),
              fullName,
              connectedAccountId
            });
          }
          
          console.log('Payment response:', response);
          onPaymentSuccess({
            amount, 
            fullName, 
            email, 
            paymentMethod: paymentMethodId,
            isSubscription,
            paymentType: isSubscription ? 'monthly' : 'one-time',
            paymentId: response.id,
            connectedAccountId
          });
        } catch (apiError) {
          console.error('API error:', apiError);
          throw new Error(apiError.message || 'Payment processing failed');
        }
      } catch (error) {
        console.error('Express Checkout error:', error);
        onPaymentError(`Payment processing failed: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    });

    newExpressCheckoutElement.mount('#express-checkout-element');
    setExpressCheckoutElement(newExpressCheckoutElement);

    return () => {
      if (newExpressCheckoutElement) {
        newExpressCheckoutElement.unmount();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, elements, amount, isSubscription, fullName, email, onPaymentSuccess, onPaymentError, connectedAccountId]);

  return (
    <div className="express-checkout-section">
      <div className="express-checkout-label">Pay faster with</div>
      <div id="express-checkout-element" className={`express-checkout-container ${isLoading ? 'loading' : ''}`}></div>
      {isLoading && <div className="express-checkout-loading">Processing payment...</div>}
    </div>
  );
};

const DonationFormContent = ({ initialConnectedAccountState, setUseConnectedAccount }) => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [useConnectedAccount, setConnectedAccountState] = useState(initialConnectedAccountState);
  
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

  const toggleConnectedAccount = () => {
    const newState = !useConnectedAccount;
    setConnectedAccountState(newState);
    setUseConnectedAccount(newState);
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

  const handlePaymentSuccess = (paymentData) => {
    navigate('/thank-you', { state: paymentData });
  };

  const handlePaymentError = (errorMessage) => {
    setMessage(errorMessage);
    setIsProcessing(false);
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
    const connectedAccountId = useConnectedAccount ? CONNECTED_ACCOUNT_ID : null;
    console.log(`Processing card payment with Connected Account ID: ${connectedAccountId || 'none (platform account)'}`);

    try {
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: fullName,
          email: email,
        },
      });

      if (paymentMethodError) {
        setMessage(`Payment failed: ${paymentMethodError.message}`);
        setIsProcessing(false);
        return;
      }
      
      console.log(`Created payment method ID: ${paymentMethod.id} of type: ${paymentMethod.type}`);

      try {
        // Get the connected account ID if enabled
        
        // Call the appropriate backend API endpoint based on donation type
        let response;
        if (isSubscription) {
          console.log(`Creating subscription with payment method ${paymentMethod.id}`);
          response = await createSubscription({
            paymentMethodId: paymentMethod.id,
            email,
            amount: parseFloat(amount),
            fullName,
            connectedAccountId
          });
        } else {
          console.log(`Creating one-time payment with payment method ${paymentMethod.id}`);
          response = await createOneTimePayment({
            paymentMethodId: paymentMethod.id,
            email,
            amount: parseFloat(amount),
            fullName,
            connectedAccountId
          });
        }
        
        console.log('Payment response:', response);

        // If we get here, the payment was successful
        navigate('/thank-you', { 
          state: { 
            amount, 
            fullName, 
            email, 
            paymentMethod: paymentMethod.id,
            isSubscription,
            paymentType: isSubscription ? 'monthly' : 'one-time',
            paymentId: response.id,
            connectedAccountId,
            recipientName: connectedAccountId ? 'Connected Account' : 'Main Organization'
          } 
        });
      } catch (error) {
        setMessage(`Payment processing failed: ${error.message}`);
        setIsProcessing(false);
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
        
        {/* Connected Account Toggle */}
        <div className="form-section connect-account-selector">
          <label className="form-label">Recipient</label>
          <div className="connect-account-options">
            <button
              type="button"
              className={`connect-account-option ${!useConnectedAccount ? 'selected' : ''}`}
              onClick={() => setUseConnectedAccount(false)}
            >
              Main Organization
            </button>
            <button
              type="button"
              className={`connect-account-option ${useConnectedAccount ? 'selected' : ''}`}
              onClick={() => setUseConnectedAccount(true)}
            >
              Connected Account
            </button>
          </div>
          {useConnectedAccount && (
            <div className="connect-account-info">
              <p>Your donation will go to our partner organization.</p>
              <p className="fee-note">A small platform fee will be deducted to cover operating costs.</p>
            </div>
          )}
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

        {amount > 0 && (
          <ExpressCheckout 
            amount={amount}
            isSubscription={isSubscription}
            fullName={fullName}
            email={email}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            connectedAccountId={useConnectedAccount ? CONNECTED_ACCOUNT_ID : null}
          />
        )}
        
        <div className="or-separator">
          <span>OR</span>
        </div>
        
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

const DonationForm = () => {
  const [useConnectedAccount, setUseConnectedAccount] = useState(true);
  const [stripeInstance, setStripeInstance] = useState(null);
  const connectedAccountId = useConnectedAccount ? CONNECTED_ACCOUNT_ID : null;
  
  // Initialize or reinitialize Stripe when connected account status changes
  useEffect(() => {
    const initializeStripe = async () => {
      const stripePromise = getStripePromise(connectedAccountId);
      setStripeInstance(stripePromise);
      
      // Log which account is being used
      if (connectedAccountId) {
        console.log(`Using Stripe with connected account: ${connectedAccountId}`);
      } else {
        console.log('Using Stripe with platform account');
      }
    };
    
    initializeStripe();
  }, [connectedAccountId]);
  
  if (!stripeInstance) {
    return <div>Loading payment system...</div>;
  }
  
  return (
    <Elements stripe={stripeInstance}>
      <DonationFormContent 
        initialConnectedAccountState={useConnectedAccount} 
        setUseConnectedAccount={setUseConnectedAccount}
      />
    </Elements>
  );
};

export default DonationForm;