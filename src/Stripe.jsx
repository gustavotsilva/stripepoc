import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
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
          const response = await fetch('https://8888-idx-stripepoc-1716858474948.cluster-23wp6v3w4jhzmwncf7crloq3kw.cloudworkstations.dev/.netlify/functions/createSubscription', {
            method: 'POST', // Specify the HTTP method as POST
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentMethodId: event.paymentMethod.id,
            }),
          });
        
          const subscription = await response.json();

          window.alert(subscription);

          if (subscription.error) {
            event.complete('fail');
            console.log(subscription.error);
          } else {
            event.complete('success');
            console.log(subscription.response);
            const { clientSecret, status } = subscription;
            if (status === 'requires_action') {
              stripe.confirmCardPayment(clientSecret).then((result) => {
                if (result.error) {
                  console.error(result.error);
                } else {
                  console.log('Subscription successful!');
                }
              });
            } else {
              console.log('Subscription successful!');
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