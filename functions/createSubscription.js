const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const findOrCreateCustomer = async (email, paymentMethodId) => {
  // Search for an existing customer with the given email
  const customers = await stripe.customers.list({
      email: email,
      limit: 1,
  });

  if (customers.data.length > 0) {
      // If customer exists, return the first customer found
      return customers.data[0];
  } else {
      // If no customer exists, create a new customer
      const customer = await stripe.customers.create({
          payment_method: paymentMethodId,
          email: email,
          invoice_settings: {
              default_payment_method: paymentMethodId,
          },
      });
      return customer;
  }
};

export async function handler(event, context) {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: 'Hello World',
    };
  }
  else if (event.httpMethod === 'POST') {
    const { paymentMethodId } = JSON.parse(event.body);

    try {
        // Find or create a customer
        const customer = await findOrCreateCustomer('gustavo.silva+stripepoc+test1@useorigin.com', paymentMethodId);

        // Create a subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: 'price_1O7IxyCNtBYah15R4b07AA0h' }], // replace with your price ID
            expand: ['latest_invoice.payment_intent'],
            coupon: 'BrDoetW1', // Add the coupon code here
            trial_period_days: 30, // Set the trial period to 30 days
        });

        let clientSecret = null;
        if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
            clientSecret = subscription.latest_invoice.payment_intent.client_secret;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                clientSecret: clientSecret,
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
}