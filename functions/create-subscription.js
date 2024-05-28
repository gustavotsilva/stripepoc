const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(bodyParser.json());

app.post('/create-subscription', async (req, res) => {
  const { paymentMethodId } = req.body;

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

    res.send({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    res.send({ error: error.message });
  }
});

module.exports.handler = serverless(app);
