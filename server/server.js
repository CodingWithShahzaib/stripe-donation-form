require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors());

// Use raw body for webhook route and JSON for all other routes
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// Create a one-time payment
app.post('/create-payment', async (req, res) => {
  try {
    const { paymentMethodId, email, amount, fullName } = req.body;

    // Create a customer
    const customer = await stripe.customers.create({
      email,
      name: fullName,
      payment_method: paymentMethodId,
    });

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
      description: `One-time donation of $${amount} from ${fullName}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    });

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      customer: customer.id,
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Create a subscription
app.post('/create-subscription', async (req, res) => {
  try {
    const { paymentMethodId, email, amount, fullName } = req.body;

    // Create a customer
    const customer = await stripe.customers.create({
      email,
      name: fullName,
      payment_method: paymentMethodId,
    });

    // Set the payment method as the default for the customer
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create a product for the subscription if it doesn't exist
    const product = await stripe.products.create({
      name: 'Monthly Donation',
    });

    // Create a price for the subscription
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
    });

    // If there's a payment intent, configure it to not use redirects
    if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
      await stripe.paymentIntents.update(
        subscription.latest_invoice.payment_intent.id,
        {
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
          }
        }
      );
    }

    res.json({
      id: subscription.id,
      status: subscription.status,
      customer: customer.id,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Webhook endpoint for Stripe events
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature) {
      console.error('No stripe-signature header value was provided');
      return res.status(400).send('No stripe-signature header value was provided');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log(`Subscription payment succeeded for invoice ${invoice.id}`);
        break;
      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log(`Subscription created: ${subscription.id}`);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 