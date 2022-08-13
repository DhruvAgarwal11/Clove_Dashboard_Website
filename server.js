const express = require('express');
const app = express();
const { resolve } = require('path');
const bodyParser = require('body-parser');
// Replace if using a different env file or config
require('dotenv').config({ path: './.env' });
var ARBOR_DAY_FOUNDATION="price_1LW4z5JLT225WxyGRrX1TcQd"
var RAIN_FOREST_TRUST="price_1LW4xqJLT225WxyG7OaExFAj"
var STATIC_DIR="docs"
var STRIPE_PUBLISHABLE_KEY="pk_live_51LV1ErJLT225WxyGX7ucx2fxyyfJPZsesEH7m8sn8i8GIST7UIyGns22l6GT5o0Yc0cSwor2jfzsVofbAqCSEhI600y8VJa2A0"
var STRIPE_SECRET_KEY="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"
var STRIPE_WEBHOOK_SECRET="whsec_a023ed719faf2ac2ce973e9d61eebb36f008a49da246173a045d6cd033e9d558"

// if (
//   !STRIPE_SECRET_KEY ||
//   !STRIPE_PUBLISHABLE_KEY ||
//   !ARBOR_DAY_FOUNDATION ||
//   !RAIN_FOREST_TRUST ||
//   !STATIC_DIR
// ) {
//   console.log(
//     'The .env file is not configured. Follow the instructions in the readme to configure the .env file. https://github.com/stripe-samples/subscription-use-cases'
//   );
//   console.log('');
//   STRIPE_SECRET_KEY
//     ? ''
//     : console.log('Add STRIPE_SECRET_KEY to your .env file.');

//   STRIPE_PUBLISHABLE_KEY
//     ? ''
//     : console.log('Add STRIPE_PUBLISHABLE_KEY to your .env file.');

//   ARBOR_DAY_FOUNDATION
//     ? ''
//     : console.log(
//         'Add ARBOR_DAY_FOUNDATION priceID to your .env file. See repo readme for setup instructions.'
//       );

//   RAIN_FOREST_TRUST
//     ? ''
//     : console.log(
//         'Add RAIN_FOREST_TRUST priceID to your .env file. See repo readme for setup instructions.'
//       );

//   STATIC_DIR
//     ? ''
//     : console.log(
//         'Add STATIC_DIR to your .env file. Check .env.example in the root folder for an example'
//       );

//   process.exit();
// }

const stripe = require('stripe')(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/subscription-use-cases/usage-based-subscriptions",
    version: "0.0.1",
    url: "https://github.com/stripe-samples/subscription-use-cases/usage-based-subscriptions"
  }
});


app.use(express.static(STATIC_DIR));
// Use JSON parser for all non-webhook routes.
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

app.get('/', (req, res) => {
  const path = resolve(STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.get('/config', async (req, res) => {
  res.send({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
  });
});



app.post('/create-customer', async (req, res) => {
  // Create a new customer object
  const customer = await stripe.customers.create({
    email: req.body.email,
  });

  // save the customer.id as stripeCustomerId
  // in your database.

  res.send({ customer });
});

app.get('/search-customer', async (req, res) => {
  let email=req.query.email;
  // Create a new customer object
  const customers = await stripe.customers.search({
    query: 'email:\''+ email +'\'',
  });
  
  res.send({ customers });
});

app.get('/get-priceId', async (req, res) => {
  let priceId=req.query.priceId;
  // Create a new customer object
  if (ARBOR_DAY_FOUNDATION == priceId){
    priceId = "Arbor Day Foundation"
  }
  else if (RAIN_FOREST_TRUST == priceId){
    priceId = "Rainforest Trust"

  }
  
  res.send({ priceId });
});

app.get('/get-paymentId', async (req, res) => {
  let customerId=req.query.customer;
  // Create a new customer object
  const paymentMethods = await stripe.customers.listPaymentMethods(
    customerId,
    {type: 'card'}
  );
  
  // save the customer.id as stripeCustomerId
  // in your database.
  res.send({ paymentMethods });
});

app.post('/create-usage-record', async (req, res) => {
  console.log(req.body.quantity);

  // Create a new customer object
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    req.body.subscriptionItems,
    {quantity: req.body.quantity, timestamp: req.body.timestamp}
  );
  
  res.send({ usageRecord });
});

app.get('/retrieve-customer-subscription', async (req, res) => {
  let userId =req.query.userId;
  const subscriptions = await stripe.subscriptions.list({
    customer: userId
  }
  );

  res.send({ subscriptions });
});

app.get('/list-invoices', async (req, res) => {

  const invoices = await stripe.invoices.list({
    customer: req.query.customerId,
  });

  res.send({ invoices });
});

app.post('/create-subscription', async (req, res) => {
  // Set the default payment method on the customer
  console.log(req.body.priceId);
  console.log(process.env[req.body.priceId] );
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
  } catch (error) {
    return res.status('402').send({ error: { message: error.message } });
  }

  let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
    req.body.customerId,
    {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    }
  );
  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: req.body.customerId,
    items: [{ price: process.env[req.body.priceId] }],
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
  });

  res.send(subscription);
});

app.post('/retry-invoice', async (req, res) => {
  // Set the default payment method on the customer

  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
    await stripe.customers.update(req.body.customerId, {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    });
  } catch (error) {
    // in case card_decline error
    return res
      .status('402')
      .send({ result: { error: { message: error.message } } });
  }

  const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
    expand: ['payment_intent'],
  });
  res.send(invoice);
});

app.post('/retrieve-upcoming-invoice', async (req, res) => {
  const subscription = await stripe.subscriptions.retrieve(
    req.body.subscriptionId
  );

  const invoice = await stripe.invoices.retrieveUpcoming({
    subscription_prorate: true,
    customer: req.body.customerId,
    subscription: req.body.subscriptionId,
    subscription_items: [
      {
        id: subscription.items.data[0].id,
        clear_usage: true,
        deleted: true,
      },
      {
        price: process.env[req.body.newPriceId],
        deleted: false,
      },
    ],
  });
  res.send(invoice);
});

app.post('/cancel-subscription', async (req, res) => {
  // Delete the subscription
  console.log(req.body.subscriptionId);
  const deletedSubscription = await stripe.subscriptions.del(
    req.body.subscriptionId
  );
  res.send(deletedSubscription);
});

app.post('/update-subscription', async (req, res) => {
  const subscription = await stripe.subscriptions.retrieve(
    req.body.subscriptionId
  );
  const updatedSubscription = await stripe.subscriptions.update(
    req.body.subscriptionId,
    {
      cancel_at_period_end: false,
      items: [
        {
          id: subscription.items.data[0].id,
          price: process.env[req.body.newPriceId],
        },
      ],
    }
  );

  res.send(updatedSubscription);
});

app.post('/retrieve-customer-payment-method', async (req, res) => {
  const paymentMethod = await stripe.paymentMethods.retrieve(
    req.body.paymentMethodId
  );

  res.send(paymentMethod);
});
// Webhook handler for asynchronous events.
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`
      );
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case 'invoice.paid':
        // Used to provision services after the trial has ended.
        // The status of the invoice will show up as paid. Store the status in your
        // database to reference when a user accesses your service to avoid hitting rate limits.
        break;
      case 'invoice.payment_failed':
        // If the payment fails or the customer does not have a valid payment method,
        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
        break;
      case 'invoice.finalized':
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        break;
      case 'customer.subscription.deleted':
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        }
        break;
      case 'customer.subscription.trial_will_end':
        // Send notification to your user that the trial will end
        break;
      default:
      // Unexpected event type
    }
    res.sendStatus(200);
  }
);

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
