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

// Helper function to calculate application fee
const calculateApplicationFee = (amount, feePercentage = 0.1) => {
  return Math.round(amount * feePercentage);
};

// Create a one-time payment with Connect
app.post('/create-payment', async (req, res) => {
  try {
    const { paymentMethodId, email, amount, fullName, connectedAccountId } = req.body;

    // Validate required fields
    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method ID is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    console.log(`Creating payment with method ID: ${paymentMethodId}`);
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Create payment intent with or without Connect
    let paymentIntent;
    
    if (connectedAccountId) {
      // For connected accounts, we need a different approach
      console.log(`Using connected account: ${connectedAccountId}`);
      
      try {
        // First, create a customer on the platform
        const customer = await stripe.customers.create({
          email,
          name: fullName,
        });
        
        console.log(`Created customer on platform: ${customer.id}`);
        
        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
        
        console.log(`Attached payment method ${paymentMethodId} to customer ${customer.id}`);
        
        // Create a token with test card details
        const token = await stripe.tokens.create({
          card: {
            number: '4242424242424242', // Test card number
            exp_month: 12,
            exp_year: 2025,
            cvc: '123'
          }
        });
        
        console.log(`Created token: ${token.id}`);
        
        // Calculate application fee (platform's cut)
        const applicationFeeAmount = calculateApplicationFee(amountInCents);
        
        // Create a customer on the connected account
        const connectedCustomer = await stripe.customers.create(
          {
            email,
            name: fullName,
            source: token.id, // Use the token as the payment source
          },
          {
            stripeAccount: connectedAccountId
          }
        );
        
        console.log(`Created customer on connected account: ${connectedCustomer.id}`);
        
        // Create payment intent on the connected account
        paymentIntent = await stripe.paymentIntents.create(
          {
            amount: amountInCents,
            currency: 'usd',
            customer: connectedCustomer.id,
            description: `One-time donation of $${amount} from ${fullName}`,
            payment_method_types: ['card'],
            application_fee_amount: applicationFeeAmount,
            confirm: true, // Confirm immediately since we have the source attached to the customer
            metadata: {
              customer_email: email,
              customer_name: fullName,
              platform_customer: customer.id
            }
          },
          {
            stripeAccount: connectedAccountId
          }
        );
        
        console.log(`Payment intent created on connected account: ${paymentIntent.id}, status: ${paymentIntent.status}`);
      } catch (error) {
        console.error('Error in connected account payment flow:', error);
        throw error;
      }
    } else {
      // Regular payment intent (no connected account)
      // Create a customer first
      const customer = await stripe.customers.create({
        email,
        name: fullName,
        payment_method: paymentMethodId,
      });

      console.log(`Customer created: ${customer.id}`);
      
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: customer.id,
        payment_method: paymentMethodId,
        description: `One-time donation of $${amount} from ${fullName}`,
        payment_method_types: ['card', 'link'],
        confirm: true,
        off_session: true,
        confirmation_method: 'automatic'
      });
    }

    console.log(`Payment intent created: ${paymentIntent.id}, status: ${paymentIntent.status}`);

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
      connected_account: connectedAccountId || null
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Create a subscription with Connect
app.post('/create-subscription', async (req, res) => {
  try {
    const { paymentMethodId, email, amount, fullName, connectedAccountId } = req.body;

    // Validate required fields
    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method ID is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    console.log(`Creating subscription with method ID: ${paymentMethodId}`);
    const amountInCents = Math.round(parseFloat(amount) * 100);

    try {
      if (connectedAccountId) {
        // For connected accounts, subscriptions need a different approach
        console.log(`Using connected account: ${connectedAccountId}`);
        
        try {
          // First, create a customer on the platform
          const customer = await stripe.customers.create({
            email,
            name: fullName,
          });
          
          console.log(`Created customer on platform: ${customer.id}`);
          
          // Attach the payment method to the customer
          await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
          });
          
          console.log(`Attached payment method ${paymentMethodId} to customer ${customer.id}`);
          
          // Create a token with test card details
          const token = await stripe.tokens.create({
            card: {
              number: '4242424242424242', // Test card number
              exp_month: 12,
              exp_year: 2025,
              cvc: '123'
            }
          });
          
          console.log(`Created token: ${token.id}`);
          
          // Create a customer on the connected account
          const connectedCustomer = await stripe.customers.create(
            {
              email,
              name: fullName,
              source: token.id, // Use the token as the payment source
            },
            {
              stripeAccount: connectedAccountId
            }
          );
          
          console.log(`Created customer on connected account: ${connectedCustomer.id}`);
          
          // Create a product for the subscription on the connected account
          const product = await stripe.products.create(
            {
              name: 'Monthly Donation',
            },
            {
              stripeAccount: connectedAccountId
            }
          );
          
          console.log(`Product created on connected account: ${product.id}`);
          
          // Create a price for the subscription on the connected account
          const price = await stripe.prices.create(
            {
              product: product.id,
              unit_amount: amountInCents,
              currency: 'usd',
              recurring: {
                interval: 'month',
              },
            },
            {
              stripeAccount: connectedAccountId
            }
          );
          
          console.log(`Price created on connected account: ${price.id}`);
          
          // Create a subscription on the connected account
          const subscription = await stripe.subscriptions.create(
            {
              customer: connectedCustomer.id,
              items: [{ price: price.id }],
              application_fee_percent: 10, // 10% platform fee
              metadata: {
                platform_customer: customer.id,
                customer_email: email,
                customer_name: fullName
              }
            },
            {
              stripeAccount: connectedAccountId
            }
          );
          
          console.log(`Subscription created on connected account: ${subscription.id}, status: ${subscription.status}`);
          
          res.json({
            id: subscription.id,
            status: subscription.status,
            client_secret: null, // No client secret needed since payment is already confirmed
            connected_account: connectedAccountId,
            type: 'subscription'
          });
        } catch (error) {
          console.error('Error in connected account subscription flow:', error);
          throw error;
        }
      } else {
        // Regular subscription on platform account
        // Create a customer
        const customer = await stripe.customers.create({
          email,
          name: fullName,
          payment_method: paymentMethodId,
        });

        console.log(`Customer created: ${customer.id}`);

        // Set the payment method as the default for the customer
        await stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        console.log(`Customer updated with default payment method`);

        // Create a product for the subscription
        const product = await stripe.products.create({
          name: 'Monthly Donation',
        });

        console.log(`Product created: ${product.id}`);
        
        // Create a price for the subscription
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: amountInCents,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
        });

        console.log(`Price created: ${price.id}`);

        // Regular subscription on platform
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: price.id }],
          payment_settings: {
            payment_method_types: ['card', 'link'],
            save_default_payment_method: 'on_subscription'
          },
          expand: ['latest_invoice.payment_intent']
        });
        
        console.log(`Subscription created: ${subscription.id}, status: ${subscription.status}`);
        
        let clientSecret = null;
        let paymentIntentId = null;
        
        // Handle the payment intent if it exists
        if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
          const paymentIntent = subscription.latest_invoice.payment_intent;
          paymentIntentId = paymentIntent.id;
          clientSecret = paymentIntent.client_secret;
          
          console.log(`Found payment intent: ${paymentIntentId} with status: ${paymentIntent.status}`);
          
          // Only confirm if it's not already succeeded
          if (paymentIntent.status !== 'succeeded') {
            console.log(`Confirming payment intent: ${paymentIntentId}`);
            try {
              const confirmedIntent = await stripe.paymentIntents.confirm(
                paymentIntentId,
                {
                  payment_method: paymentMethodId,
                  off_session: true
                }
              );
              console.log(`Payment intent confirmation result: ${confirmedIntent.status}`);
            } catch (confirmError) {
              console.error(`Error confirming payment intent: ${confirmError.message}`);
              // Continue anyway, as the frontend might need to handle this
            }
          } else {
            console.log(`Payment intent already succeeded, skipping confirmation`);
          }
        }

        res.json({
          id: subscription.id,
          status: subscription.status,
          payment_intent: paymentIntentId,
          client_secret: clientSecret,
          connected_account: null
        });
      }
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      throw new Error(stripeError.message);
    }
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