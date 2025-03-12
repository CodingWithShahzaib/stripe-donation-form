const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const createSubscription = async ({ paymentMethodId, email, amount, fullName }) => {
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
    const error = await response.json();
    throw new Error(error.message || 'Subscription creation failed');
  }

  return response.json();
};

export const createOneTimePayment = async ({ paymentMethodId, email, amount, fullName }) => {
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
    const error = await response.json();
    throw new Error(error.message || 'Payment processing failed');
  }

  return response.json();
}; 