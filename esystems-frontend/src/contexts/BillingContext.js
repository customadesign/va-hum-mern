import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api';
import { toast } from 'react-toastify';

// Initialize Stripe with publishable key (only if key is available)
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    // Initialize Stripe only if promise exists
    if (stripePromise) {
      stripePromise.then(stripeInstance => {
        setStripe(stripeInstance);
      });
    }
  }, []);

  // Fetch saved payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/billing/payment-method');
      setPaymentMethods(response.data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trial status
  const fetchTrialStatus = async () => {
    try {
      const response = await api.get('/billing/trial-status');
      setTrialStatus(response.data);
    } catch (error) {
      console.error('Error fetching trial status:', error);
    }
  };

  // Create setup intent for adding new payment method
  const createSetupIntent = async () => {
    try {
      const response = await api.post('/billing/setup-intent');
      return response.data.clientSecret;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      toast.error('Failed to initialize payment setup');
      throw error;
    }
  };

  // Save payment method
  const savePaymentMethod = async (paymentMethodId) => {
    try {
      setLoading(true);
      const response = await api.post('/billing/payment-method', {
        paymentMethodId
      });
      
      if (response.data.success) {
        toast.success('Payment method saved successfully');
        await fetchPaymentMethods(); // Refresh payment methods
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error(error.response?.data?.message || 'Failed to save payment method');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete payment method
  const deletePaymentMethod = async (paymentMethodId) => {
    try {
      setLoading(true);
      await api.delete(`/billing/payment-method/${paymentMethodId}`);
      toast.success('Payment method removed');
      await fetchPaymentMethods(); // Refresh payment methods
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  // Purchase trial
  const purchaseTrial = async (vaId, paymentMethodId) => {
    try {
      setLoading(true);
      const response = await api.post('/billing/purchase-trial', {
        vaId,
        paymentMethodId
      });

      if (response.data.success) {
        toast.success('Trial purchased successfully! You can now work with this VA.');
        await fetchTrialStatus(); // Refresh trial status
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error purchasing trial:', error);
      
      // Handle specific error cases
      if (error.response?.status === 402) {
        toast.error('Payment failed. Please check your payment method.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to purchase trial. Please try again.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get purchase history
  const getPurchaseHistory = async () => {
    try {
      const response = await api.get('/billing/purchase-history');
      return response.data.purchases || [];
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      return [];
    }
  };

  const value = {
    stripe,
    stripePromise,
    paymentMethods,
    trialStatus,
    loading,
    fetchPaymentMethods,
    fetchTrialStatus,
    createSetupIntent,
    savePaymentMethod,
    deletePaymentMethod,
    purchaseTrial,
    getPurchaseHistory
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};