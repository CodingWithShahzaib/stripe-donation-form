const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const createSubscription = async ({ paymentMethodId, email, amount, fullName, connectedAccountId }) => {
  try {
    // Log which account we're using
    console.log(`Creating subscription with account: ${connectedAccountId || 'platform'}`);
    
    // Create a return URL for redirect-based payment methods
    const returnUrl = `${window.location.origin}/thank-you`;
    console.log(`Using return URL: ${returnUrl}`);
    
    const response = await fetch(`${BACKEND_URL}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodId,
        email,
        amount,
        fullName,
        connectedAccountId,
        returnUrl
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Subscription processing failed');
    }

    const subscriptionData = await response.json();
    
    // Handle redirect if needed
    if (subscriptionData.next_action && subscriptionData.next_action.type === 'redirect_to_url') {
      console.log('Subscription requires redirect, navigating to:', subscriptionData.next_action.redirect_to_url.url);
      window.location.href = subscriptionData.next_action.redirect_to_url.url;
      return { redirecting: true };
    }
    
    return subscriptionData;
  } catch (error) {
    console.error('Subscription API Error:', error);
    throw error;
  }
};

export const createOneTimePayment = async ({ paymentMethodId, email, amount, fullName, connectedAccountId }) => {
  try {
    // Log which account we're using
    console.log(`Creating one-time payment with account: ${connectedAccountId || 'platform'}`);
    
    // Create a return URL for redirect-based payment methods
    const returnUrl = `${window.location.origin}/thank-you`;
    console.log(`Using return URL: ${returnUrl}`);
    
    const response = await fetch(`${BACKEND_URL}/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodId,
        email,
        amount,
        fullName,
        connectedAccountId,
        returnUrl
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment processing failed');
    }

    const paymentData = await response.json();
    
    // Handle redirect if needed
    if (paymentData.next_action && paymentData.next_action.type === 'redirect_to_url') {
      console.log('Payment requires redirect, navigating to:', paymentData.next_action.redirect_to_url.url);
      window.location.href = paymentData.next_action.redirect_to_url.url;
      return { redirecting: true };
    }
    
    return paymentData;
  } catch (error) {
    console.error('Payment API Error:', error);
    throw error;
  }
}; 