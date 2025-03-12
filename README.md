# Stripe Donation Form

A React application that allows users to make one-time donations or subscribe to monthly donations using Stripe.

## Features

- One-time donations
- Monthly subscription donations
- Secure payment processing with Stripe
- Responsive design

## Project Structure

- `src/` - Frontend React application
- `server/` - Backend Express server for Stripe integration

## Setup

### Frontend

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with your Stripe publishable key:
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   REACT_APP_BACKEND_URL=http://localhost:3001
   ```

3. Start the development server:
   ```
   npm start
   ```

### Backend

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

4. Start the server:
   ```
   npm start
   ```

## Webhook Testing

To test webhooks locally, use the Stripe CLI:

```
stripe listen --forward-to localhost:3001/webhook
```

The CLI will output a webhook signing secret that looks like:
```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx
```

Copy this value to your server's `.env` file as `STRIPE_WEBHOOK_SECRET`.

## Troubleshooting

If you see the error "No stripe-signature header value was provided", make sure:

1. You're using the Stripe CLI to forward webhook events
2. You've set the correct webhook secret in your server's `.env` file
3. The server is using `express.raw()` middleware for the webhook route

## Google Pay and Apple Pay Integration

This donation form now supports Google Pay and Apple Pay for a faster checkout experience. Here's what you need to know:

### Requirements

- **Google Pay**: Works on Chrome, Firefox, Safari, and Microsoft Edge on Android devices and desktop.
- **Apple Pay**: Works on Safari on iOS devices (iPhone, iPad) and macOS.

### Testing

- **Google Pay**: You can test Google Pay in Chrome's developer mode. No real card is required.
- **Apple Pay**: Testing Apple Pay requires an Apple device with Safari and a card added to Apple Wallet.

### Implementation Details

The implementation uses Stripe's Payment Request Button which automatically detects the available payment methods based on the browser and device. The button will only appear if at least one digital wallet payment method is available.

### Configuration

Make sure your Stripe account is properly configured to accept these payment methods:

1. Log in to your Stripe Dashboard
2. Go to Settings > Payment methods
3. Enable Google Pay and Apple Pay
4. For Apple Pay, you'll need to register your domain with Apple

### Troubleshooting

If the wallet payment options don't appear:

- Ensure you're using a supported browser and device
- Check that you have cards added to your digital wallet
- Verify that your Stripe account is properly configured
- Make sure your site is served over HTTPS (required for production)
