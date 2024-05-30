import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  PaymentRequestButtonElement
} from '@stripe/react-stripe-js';

// Load your publishable key
const stripePromise = loadStripe('pk_live_51MjmIlCNtBYah15RlLYGXSUMHgrMDxMvYDZ7TgQkXfk8Omst0pdlTZf28WSqG3pQjykddYD4r1lmfmJv7oTWp4zE00uMpEICNz');

const PaymentRequestButton = () => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Subscription total',
          amount: 1299,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });

      pr.on('paymentmethod', async (event) => {
        const response = await fetch('/.netlify/functions/createSubscription', {
          method: 'POST', // Specify the HTTP method as POST
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: event.paymentMethod.id,
          }),
        });

        const subscription = await response.json();

        if (subscription.error) {
          event.complete('fail');
          window.alert('Failed!');
          console.log(subscription.error);
        } else {
          event.complete('success');
          console.log(subscription.response);
          const { clientSecret, status } = subscription;
          if (status === 'requires_action') {
            stripe.confirmCardPayment(clientSecret).then((result) => {
              if (result.error) {
                console.error(result.error);
                window.alert('Payment confirmation failed!');
              } else {
                console.log('Subscription successful!');
                window.alert('Subscription successful!');
              }
            }).catch(error => {
              console.error(error);
              window.alert('Payment confirmation failed!');
            });
          } else {
            console.log('Subscription successful!');
            window.alert('Subscription successful!');
          }
        }
      });
    }
  }, [stripe]);

  if (!canMakePayment) {
    return null;
  }

  return (
    <PaymentRequestButtonElement
      options={{ paymentRequest }}
    />
  );
};

const App = () => {
  return (
    <>
      <h1>Stripe Testing 2</h1>
      <Elements stripe={stripePromise}>
        <PaymentRequestButton />
      </Elements>
    </>
  );
};

export default App;