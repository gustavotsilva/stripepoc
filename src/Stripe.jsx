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
        try {
          const response = await fetch('/.netlify/functions/createSubscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentMethodId: event.paymentMethod.id,
              email: event.payerEmail,  // Ensure to pass payer's email
              couponCode: 'your-coupon-code',  // Replace with the actual coupon code
            }),
          });

          const subscription = await response.json();

          if (subscription.error) {
            event.complete('fail');
            window.alert('Subscription failed: ' + subscription.error);
          } else {
            const { clientSecret, status } = subscription;

            if (status === 'requires_action') {
              const confirmResult = await stripe.confirmCardPayment(clientSecret);
              if (confirmResult.error) {
                event.complete('fail');
                window.alert('Payment confirmation failed: ' + confirmResult.error.message);
              } else {
                event.complete('success');
                window.alert('Subscription successful!');
              }
            } else {
              event.complete('success');
              window.alert('Subscription successful!');
            }
          }
        } catch (error) {
          event.complete('fail');
          console.error('Error in paymentmethod handler:', error);
          window.alert('An error occurred, please try again.');
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