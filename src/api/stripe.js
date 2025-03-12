const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const createSubscription = async ({ paymentMethodId, email, amount, fullName }) => {
  console.log(`Creating subscription with: ${JSON.stringify({ paymentMethodId, email, amount, fullName })}`);
  
  try {
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Subscription API error:', errorData);
      throw new Error(errorData.message || 'Subscription creation failed');
    }

    const data = await response.json();
    console.log('Subscription created successfully:', data);
    return data;
  } catch (error) {
    console.error('Subscription creation error:', error);
    throw error;
  }
};

export const createOneTimePayment = async ({ paymentMethodId, email, amount, fullName }) => {
  console.log(`Creating one-time payment with: ${JSON.stringify({ paymentMethodId, email, amount, fullName })}`);
  
  try {
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Payment API error:', errorData);
      throw new Error(errorData.message || 'Payment processing failed');
    }

    const data = await response.json();
    console.log('Payment created successfully:', data);
    return data;
  } catch (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
}; 