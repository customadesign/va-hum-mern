import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useBilling } from '../../contexts/BillingContext';
import CreditCardPreview from './CreditCardPreview';
import './CreditCardPreview.css';
import { 
  CreditCardIcon, 
  LockClosedIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// Stripe Elements styling
const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      letterSpacing: '0.025em',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146',
    },
  },
};

const PaymentFormContent = ({ onSuccess, onCancel, submitButtonText = 'Save Payment Method' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSetupIntent, savePaymentMethod } = useBilling();
  
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    zip: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  });
  
  // Card preview state
  const [cardPreview, setCardPreview] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardBrand: 'generic'
  });
  const [showCardBack, setShowCardBack] = useState(false);

  const isFormComplete = () => {
    return billingDetails.name && 
           billingDetails.email && 
           billingDetails.zip && 
           cardComplete.cardNumber && 
           cardComplete.cardExpiry && 
           cardComplete.cardCvc;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      // Create setup intent
      const clientSecret = await createSetupIntent();

      // Confirm card setup
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              name: billingDetails.name,
              email: billingDetails.email,
              address: {
                postal_code: billingDetails.zip,
              },
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      // Save payment method to backend
      const success = await savePaymentMethod(setupIntent.payment_method);
      
      if (success) {
        onSuccess && onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleElementChange = (elementType) => (event) => {
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete
    }));
    
    // Update card preview based on element type
    if (elementType === 'cardNumber') {
      setCardPreview(prev => ({
        ...prev,
        cardNumber: event.value || '',
        cardBrand: event.brand || 'generic'
      }));
    } else if (elementType === 'cardExpiry') {
      setCardPreview(prev => ({
        ...prev,
        expiryDate: event.value || ''
      }));
    } else if (elementType === 'cardCvc') {
      setCardPreview(prev => ({
        ...prev,
        cvc: event.value || ''
      }));
    }
    
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  // Handle focus events for card elements
  const handleElementFocus = (elementType) => () => {
    if (elementType === 'cardCvc') {
      setShowCardBack(true);
    } else {
      setShowCardBack(false);
    }
  };

  const handleElementBlur = (elementType) => () => {
    // Optional: You can add blur handling here if needed
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trust Indicators */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center text-sm text-blue-700">
            <LockClosedIcon className="h-5 w-5 mr-1" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center text-sm text-blue-700">
            <ShieldCheckIcon className="h-5 w-5 mr-1" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center text-sm text-blue-700">
            <CreditCardIcon className="h-5 w-5 mr-1" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>

      {/* Credit Card Preview */}
      <div className="credit-card-preview">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Card Preview</h3>
          <p className="text-sm text-gray-600">See how your card information appears as you type</p>
        </div>
        
        <div onClick={() => setShowCardBack(!showCardBack)} className="cursor-pointer">
          <CreditCardPreview
            cardNumber={cardPreview.cardNumber}
            cardholderName={billingDetails.name}
            expiryDate={cardPreview.expiryDate}
            cvc={cardPreview.cvc}
            cardBrand={cardPreview.cardBrand}
            isFlipped={showCardBack}
          />
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowCardBack(!showCardBack)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showCardBack ? '← Show Front' : 'Show Back →'}
          </button>
        </div>
      </div>

      {/* Billing Details */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Cardholder Name
          </label>
          <input
            type="text"
            id="name"
            value={billingDetails.name}
            onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={billingDetails.email}
            onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="john@example.com"
            required
          />
        </div>
      </div>

      {/* Card Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCardIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="pl-10 p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardNumberElement 
                options={ELEMENT_OPTIONS}
                onChange={handleElementChange('cardNumber')}
                onFocus={handleElementFocus('cardNumber')}
                onBlur={handleElementBlur('cardNumber')}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date
            </label>
            <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardExpiryElement 
                options={ELEMENT_OPTIONS}
                onChange={handleElementChange('cardExpiry')}
                onFocus={handleElementFocus('cardExpiry')}
                onBlur={handleElementBlur('cardExpiry')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardCvcElement 
                options={ELEMENT_OPTIONS}
                onChange={handleElementChange('cardCvc')}
                onFocus={handleElementFocus('cardCvc')}
                onBlur={handleElementBlur('cardCvc')}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
            Billing ZIP Code
          </label>
          <input
            type="text"
            id="zip"
            value={billingDetails.zip}
            onChange={(e) => setBillingDetails({ ...billingDetails, zip: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="12345"
            required
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || processing || !isFormComplete()}
          className={`inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            !stripe || processing || !isFormComplete()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {processing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              {submitButtonText}
            </>
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="text-center text-xs text-gray-500 mt-4">
        <p>Your payment information is encrypted and secure.</p>
        <p>We never store your card details on our servers.</p>
      </div>
    </form>
  );
};

// Wrapper component with Stripe Elements provider
const PaymentForm = (props) => {
  const { stripePromise } = useBilling();
  
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;