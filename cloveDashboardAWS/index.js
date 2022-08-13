const Stripe = require('stripe');
const stripe = Stripe('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'); //stripe secret test key
//Lambda function
var ARBOR_DAY_FOUNDATION="price_1LW4z5JLT225WxyGRrX1TcQd"
var RAIN_FOREST_TRUST="price_1LW4xqJLT225WxyG7OaExFAj"
var STATIC_DIR="docs"
var STRIPE_PUBLISHABLE_KEY="pk_live_51LV1ErJLT225WxyGX7ucx2fxyyfJPZsesEH7m8sn8i8GIST7UIyGns22l6GT5o0Yc0cSwor2jfzsVofbAqCSEhI600y8VJa2A0"
var STRIPE_SECRET_KEY="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"
var STRIPE_WEBHOOK_SECRET="whsec_a023ed719faf2ac2ce973e9d61eebb36f008a49da246173a045d6cd033e9d558"

exports.handler = async function(event, context, callback){

  var typeOfRequest = '';
  // var donationAmount = 0;
  if (event.hasOwnProperty('queryStringParameters') && event.queryStringParameters != null && event.queryStringParameters.hasOwnProperty('typeOfRequest')){
    typeOfRequest = event.queryStringParameters.typeOfRequest;
    // donationAmount = event.queryStringParameters.donationAmount;
  }
  
  if (typeOfRequest == "config"){
    return STRIPE_PUBLISHABLE_KEY;
  }
  else if (typeOfRequest == "create-customer"){
    const customer = await stripe.customers.create({
      email: event.queryStringParameters.email,
    });
    return  {
      statusCode: 200,
      body: {customer}
    };
  }
  else if (typeOfRequest == "search-customer"){
    const customers = await stripe.customers.list({
      // query: 'email:\''+ event.queryStringParameters.email +'\'',
      email:event.queryStringParameters.email
    });
    var ret = customers.data[0];
    return {
      statusCode: 200,
      body: {ret}
    };
  }
  else if (typeOfRequest == "get-priceId"){
    const priceId=event.queryStringParameters.priceId;
    if (ARBOR_DAY_FOUNDATION == priceId){
      priceId = "Arbor Day Foundation"
    }
    else if (RAIN_FOREST_TRUST == priceId){
      priceId = "Rainforest Trust"
    }
    return {
      statusCode: 200,
      body: {priceId}
    };
  }
  else if (typeOfRequest == "get-paymentId"){
    const paymentMethods = await stripe.customers.listPaymentMethods(
      event.queryStringParameters.customerId,
      {type: 'card'}
    );
    return  {
      statusCode: 200,
      body: {paymentMethods}
    };
  }
  else if (typeOfRequest == "create-usage-record"){
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      event.queryStringParameters.subscriptionItems,
      {quantity: event.queryStringParameters.quantity, timestamp: event.queryStringParameters.timestamp}
    );
    return  {
      statusCode: 200,
      body: {usageRecord}
    };
  }
  else if (typeOfRequest == "retrieve-customer-subscription"){
    const subscriptions = await stripe.subscriptions.list({
      customer: event.queryStringParameters.userId
    });
    return  {
      statusCode: 200,
      body: {subscriptions}
    };
  }
  else if (typeOfRequest == "list-invoices"){
    const invoices = await stripe.invoices.list({
      customer: event.queryStringParameters.customerId,
    });
    return  {
      statusCode: 200,
      body: {invoices}
    };
  }
  else if (typeOfRequest == "create-subscription"){
    try {
      await stripe.paymentMethods.attach(event.queryStringParameters.paymentMethodId, {
        customer: event.queryStringParameters.customerId,
      });
    } catch (error) {
      var msg = error.message;
      return  {
        statusCode: 200,
        body: {msg}
      };
    }
    let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
      event.queryStringParameters.customerId,
      {
        invoice_settings: {
          default_payment_method: event.queryStringParameters.paymentMethodId,
        },
      }
    );
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: event.queryStringParameters.customerId,
      items: [{ price: (event.queryStringParameters.priceId == "ARBOR_DAY_FOUNDATION")?ARBOR_DAY_FOUNDATION:RAIN_FOREST_TRUST}],
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
    }); 
    return  {
      statusCode: 200,
      body: {subscription}
    };
  }
  else if (typeOfRequest == "retry-invoice"){
    try {
      await stripe.paymentMethods.attach(event.queryStringParameters.paymentMethodId, {
        customer: event.queryStringParameters.customerId,
      });
      await stripe.customers.update(event.queryStringParameters.customerId, {
        invoice_settings: {
          default_payment_method: event.queryStringParameters.paymentMethodId,
        },
      });
    } catch (error) {
      // in case card_decline error
      var msg = error.message;
      return  {
        statusCode: 200,
        body: {msg}
      };
    }
    const invoice = await stripe.invoices.retrieve(event.queryStringParameters.invoiceId, {
      expand: ['payment_intent'],
    });
    return  {
      statusCode: 200,
      body: {invoice}
    };
  }
  else if (typeOfRequest == "retrieve-upcoming-invoice"){
    const subscription = await stripe.subscriptions.retrieve(
      event.queryStringParameters.subscriptionId
    );
  
    const invoice = await stripe.invoices.retrieveUpcoming({
      subscription_prorate: true,
      customer: event.queryStringParameters.customerId,
      subscription: event.queryStringParameters.subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          clear_usage: true,
          deleted: true,
        },
        {
          price: (event.queryStringParameters.newPriceId == "ARBOR_DAY_FOUNDATION")?ARBOR_DAY_FOUNDATION:RAIN_FOREST_TRUST,
          deleted: false,
        },
      ],
    });
    return  {
      statusCode: 200,
      body: {invoice}
    };
  }
  else if (typeOfRequest == "cancel-subscription"){
    const deletedSubscription = await stripe.subscriptions.del(
      event.queryStringParameters.subscriptionId
    );
    return  {
      statusCode: 200,
      body: {deletedSubscription}
    };
  }
  else if (typeOfRequest == "update-subscription"){
    const subscription = await stripe.subscriptions.retrieve(
      event.queryStringParameters.subscriptionId
    );
    const updatedSubscription = await stripe.subscriptions.update(
      event.queryStringParameters.subscriptionId,
      {
        cancel_at_period_end: false,
        items: [
          {
            id: subscription.items.data[0].id,
            price: (event.queryStringParameters.newPriceId == "ARBOR_DAY_FOUNDATION")?ARBOR_DAY_FOUNDATION:RAIN_FOREST_TRUST,
          },
        ],
      }
    );
    return  {
      statusCode: 200,
      body: {updatedSubscription}
    };
  }
  else if (typeOfRequest == "retrieve-customer-payment-method"){
    const paymentMethod = await stripe.paymentMethods.retrieve(
      event.queryStringParameters.paymentMethodId
    );
    return  {
      statusCode: 200,
      body: {paymentMethod}
    };
  }
  const response = {
    statusCode: 200,
    body: JSON.stringify("None Found")
  };
  return response;

};
