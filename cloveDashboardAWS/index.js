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
  // const response2 = {
  //     statusCode: 200,
  //     headers: {
  //           "Access-Control-Allow-Headers" : "Content-Type",
  //           "Access-Control-Allow-Origin": "https://dashboard.joinclove.org",
  //           "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
  //       },
  //     body: JSON.stringify("hi")
  //   };
  // return response2;
  var typeOfRequest = '';
  // var donationAmount = 0;
  if (event.hasOwnProperty('queryStringParameters') && event.queryStringParameters != null && event.queryStringParameters.hasOwnProperty('typeOfRequest')){
    typeOfRequest = event.queryStringParameters.typeOfRequest;
    // donationAmount = event.queryStringParameters.donationAmount;
  }
  
  if (typeOfRequest == "config"){
    const response = {
      statusCode: 200,
      // headers: {
      //       "Access-Control-Allow-Headers" : "Content-Type",
      //       "Access-Control-Allow-Origin": "https://dashboard.joinclove.org",
      //       "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      //   },
      body: JSON.stringify(STRIPE_PUBLISHABLE_KEY)
    };
    return response;
    // return  {
    //   statusCode: 200,
    //   body: {publishableKey: STRIPE_PUBLISHABLE_KEY}
    // };
  }
  else if (typeOfRequest == "create-customer"){
    const customer = await stripe.customers.create({
      email: event.queryStringParameters.email,
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(customer)
    };
    return response;
  }
  else if (typeOfRequest == "search-customer"){
    const customers = await stripe.customers.list({
      // query: 'email:\''+ event.queryStringParameters.email +'\'',
      email:event.queryStringParameters.email
    });
    var ret = customers;
    const response = {
      statusCode: 200,
      body: JSON.stringify(ret)
    };
    return response;
  }
  else if (typeOfRequest == "get-priceId"){
    var priceId=event.queryStringParameters.priceId;
    if (ARBOR_DAY_FOUNDATION == priceId){
      priceId = "Arbor Day Foundation"
    }
    else if (RAIN_FOREST_TRUST == priceId){
      priceId = "Rainforest Trust"
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify(priceId)
    };
    return response;
  }
  else if (typeOfRequest == "get-paymentId"){
    const paymentMethods = await stripe.paymentMethods.list({
      customer: event.queryStringParameters.customer,
      type: 'card'
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(paymentMethods)
    };
    return response;
  }
  else if (typeOfRequest == "create-usage-record"){
    console.log(event.queryStringParameters.newQuantity);
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      event.queryStringParameters.subscriptionItems,
      {quantity: event.queryStringParameters.newQuantity, timestamp: event.queryStringParameters.timestamp}
    );
    const response = {
      statusCode: 200,
      body: JSON.stringify(usageRecord)
    };
    return response;
  }
  else if (typeOfRequest == "retrieve-customer-subscription"){
    const subscriptions = await stripe.subscriptions.list({
      customer: event.queryStringParameters.userId
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(subscriptions)
    };
    return response;
  }
  else if (typeOfRequest == "list-invoices"){
    const invoices = await stripe.invoices.list({
      customer: event.queryStringParameters.customerId,
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(invoices)
    };
    return response;
  }
  else if (typeOfRequest == "create-subscription-1"){
    try {
      console.log("here in create subscription");
      var creatingPaymentMethod = await stripe.paymentMethods.attach(event.queryStringParameters.paymentMethodId, {
        customer: event.queryStringParameters.customerId,
      });
      const response = {
        statusCode: 200,
        body: JSON.stringify(creatingPaymentMethod)
      };
      return response;
    } catch (error) {
      console.log("here in create subscription error");
      var msg = error.message;
      console.log(msg);
      const response = {
        statusCode: 200,
        body: JSON.stringify(msg)
      };
      return response;
    }
  }
  
  else if (typeOfRequest == "create-subscription-2"){
    try {let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
      event.queryStringParameters.customerId,
      {
        invoice_settings: {
          default_payment_method: event.queryStringParameters.paymentMethodId,
        },
      }
    );
    const response = {
          statusCode: 200,
          body: JSON.stringify(updateCustomerDefaultPaymentMethod)
        };
      return response;
    }
    catch(error){
      console.log("here in create subscription error 2");
      var msg = error.message;
      console.log(msg);
      const response = {
          statusCode: 200,
          body: JSON.stringify(msg)
        };
      return response;
    }
  }
  else if (typeOfRequest == "create-subscription-3"){
    var subscription;
    console.log(event.queryStringParameters.customerId);
    if (event.queryStringParameters.priceId == "ARBOR_DAY_FOUNDATION"){
      console.log("here in create subscription 4");
      subscription = await stripe.subscriptions.create({
        customer: event.queryStringParameters.customerId,
        items: [{ price: ARBOR_DAY_FOUNDATION}],
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      }); 
    }
    else{
      console.log("here in create subscription 5");
      subscription = await stripe.subscriptions.create({
        customer: event.queryStringParameters.customerId,
        items: [{ price: RAIN_FOREST_TRUST}],
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      }); 
    }
    console.log(subscription);
    const response = {
      statusCode: 200,
      body: JSON.stringify(subscription)
    };
    return response;
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
      const response = {
        statusCode: 200,
        body: JSON.stringify(msg)
      };
      return response;
    }
    const invoice = await stripe.invoices.retrieve(event.queryStringParameters.invoiceId, {
      expand: ['payment_intent'],
    });
    const response = {
      statusCode: 200,
      body: JSON.stringify(invoice)
    };
    return response;
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
    const response = {
      statusCode: 200,
      body: JSON.stringify(invoice)
    };
    return response;
  }
  else if (typeOfRequest == "cancel-subscription"){
    const deletedSubscription = await stripe.subscriptions.del(
      event.queryStringParameters.subscriptionId
    );
    const response = {
      statusCode: 200,
      body: JSON.stringify("done")
    };
    return response;
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
    const response = {
      statusCode: 200,
      body: JSON.stringify(updatedSubscription)
    };
    return response;
  }
  else if (typeOfRequest == "retrieve-customer-payment-method"){
    const paymentMethod = await stripe.paymentMethods.retrieve(
      event.queryStringParameters.paymentMethodId
    );
    const response = {
      statusCode: 200,
      body: JSON.stringify(paymentMethod)
    };
    return response;
  }
  const response = {
    statusCode: 200,
    body: JSON.stringify("None Found")
  };
  return response;

};
