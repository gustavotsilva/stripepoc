const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod === 'POST') {
    const { paymentMethodId } = JSON.parse(event.body);

    try {
        // Create a customer
        const customer = await stripe.customers.create({
            payment_method: paymentMethodId,
            email: 'gustavo.silva+stripepoc+test1@useorigin.com', // you can pass customer email from the frontend
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Create a subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: 'price_1O7IxyCNtBYah15R4b07AA0h' }], // replace with your price ID
            expand: ['latest_invoice.payment_intent'],
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                status: subscription.status,
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
  } else {
      return {
          statusCode: 405, // Method Not Allowed
          body: 'Method Not Allowed',
      };
  }
};