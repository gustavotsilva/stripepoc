import stripePackage from 'stripe';
const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

const findOrCreateCustomer = async (email, paymentMethodId) => {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    const customer = customers.data[0];
    const defaultPaymentMethod = customer.invoice_settings.default_payment_method;

    if (defaultPaymentMethod !== paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return customer;
  } else {
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

const createSubscriptionWithCoupon = async (paymentMethodId, email, couponCode) => {
  try {
    const customer = await findOrCreateCustomer('gustavo.silva+stripepoc+test1@useorigin.com', paymentMethodId);

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_1O7IxyCNtBYah15R4b07AA0h' }],
      coupon: couponCode,
      trial_period_days: 30,
      expand: ['latest_invoice.payment_intent'],
    });

    let clientSecret = null;
    if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
      clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        clientSecret: clientSecret,
        status: subscription.status,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  } else if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      body: 'Hello World',
    };
  } else if (event.httpMethod === 'POST') {
    const { paymentMethodId, email, couponCode } = JSON.parse(event.body);
    const response = await createSubscriptionWithCoupon(paymentMethodId, email, couponCode);
    return response; // Ensure the response is returned
  }
}