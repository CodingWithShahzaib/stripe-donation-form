# Stripe Donation Server

This is the backend server for the Stripe donation form application. It handles both one-time payments and monthly subscriptions.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

3. Get your Stripe webhook secret by running the Stripe CLI:
   ```
   stripe listen --forward-to localhost:3001/webhook
   ```
   
   The CLI will output a webhook signing secret that looks like:
   ```
   Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx
   ```
   
   Copy this value to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

## Running the Server

Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## API Endpoints

- `POST /create-payment`: Creates a one-time payment
- `POST /create-subscription`: Creates a monthly subscription
- `POST /webhook`: Handles Stripe webhook events

## Webhook Testing

To test webhooks locally, use the Stripe CLI:

```
stripe listen --forward-to localhost:3001/webhook
```

This will forward Stripe webhook events to your local server.

## Troubleshooting

If you see the error "No stripe-signature header value was provided", make sure:

1. You're using the Stripe CLI to forward webhook events
2. You've set the correct webhook secret in your `.env` file
3. You're using `express.raw()` middleware for the webhook route 