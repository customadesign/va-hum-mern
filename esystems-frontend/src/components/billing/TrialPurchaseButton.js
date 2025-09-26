import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBilling } from '../../contexts/BillingContext';
import PaymentForm from './PaymentForm';
import TermsOfService from './TermsOfService';
import { 
  SparklesIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const TrialPurchaseButton = ({ vaId, vaName }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { paymentMethods, fetchPaymentMethods, purchaseTrial, trialStatus, fetchTrialStatus } = useBilling();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
      fetchTrialStatus();
    }
  }, [user]);

  useEffect(() => {
    // Check if there's an active trial for this VA
    if (trialStatus?.trials) {
      const activeTrial = trialStatus.trials.find(
        trial => trial.vaId === vaId && trial.status === 'active'
      );
      setCurrentTrial(activeTrial);
    }
  }, [trialStatus, vaId]);

  const handleButtonClick = () => {
    if (!user) {
      // Redirect to sign up if not logged in
      navigate('/sign-up', { 
        state: { 
          redirectTo: window.location.pathname,
          message: 'Sign up to start your 10-hour trial with this VA!'
        }
      });
      return;
    }

    // Show Terms of Service first
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    
    if (paymentMethods.length === 0) {
      // Show payment form if no saved payment methods
      setShowPaymentForm(true);
      setShowPaymentModal(true);
    } else {
      // Show payment method selection modal
      setShowPaymentModal(true);
    }
  };

  const handleTermsClose = () => {
    setShowTerms(false);
    setTermsAccepted(false);
  };

  const handlePaymentMethodSelect = async (paymentMethodId) => {
    // Ensure terms are accepted
    if (!termsAccepted) {
      alert('Please accept the Terms of Service before proceeding with payment.');
      return;
    }

    setSelectedPaymentMethod(paymentMethodId);
    setProcessing(true);

    try {
      const result = await purchaseTrial(vaId, paymentMethodId);
      if (result?.success) {
        setShowPaymentModal(false);
        setTermsAccepted(false); // Reset for next purchase
        // Optionally redirect to a success page or show success state
      }
    } catch (error) {
      console.error('Trial purchase failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFormSuccess = async () => {
    // Ensure terms are accepted
    if (!termsAccepted) {
      alert('Please accept the Terms of Service before proceeding with payment.');
      return;
    }
    
    // After successfully adding a payment method, fetch updated methods
    await fetchPaymentMethods();
    setShowPaymentForm(false);
    
    // If payment methods exist now, let user select one
    if (paymentMethods.length > 0) {
      setShowPaymentModal(true);
    }
  };

  // If there's an active trial for this VA, show trial status instead
  if (currentTrial) {
    const hoursRemaining = currentTrial.hoursRemaining || 0;
    const expirationDate = new Date(currentTrial.expiresAt);
    
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800 flex items-center">
              <CheckIcon className="h-5 w-5 mr-2" />
              Active Trial
            </h3>
            <p className="text-sm text-green-600 mt-1">
              {hoursRemaining.toFixed(1)} hours remaining
            </p>
            <p className="text-xs text-green-500 mt-1">
              Expires: {expirationDate.toLocaleDateString()}
            </p>
          </div>
          <ClockIcon className="h-8 w-8 text-green-400" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main CTA Button */}
      <button
        onClick={handleButtonClick}
        className="relative w-full group overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-[2px] transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        <div className="relative flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white transition-all">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="flex items-center justify-center space-x-3">
              <SparklesIcon className="h-6 w-6 animate-pulse" />
              <div>
                <div className="text-xl font-bold">$100 for 10 Hour Trial</div>
                <div className="text-sm opacity-90">Start working with {vaName} today!</div>
              </div>
              <StarIcon className="h-6 w-6 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {/* Features list */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-700">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          <span>10 hours of dedicated VA service</span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          <span>Professional virtual assistant support</span>
        </div>
        <div className="flex items-center text-sm text-gray-700">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          <span>Time tracking and reporting</span>
        </div>
        <div className="flex items-center text-sm text-orange-600 font-semibold">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-orange-500" />
          <span>Non-refundable - Terms apply</span>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPaymentModal(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              {/* Close button */}
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute right-4 top-4 text-gray-700 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Complete Your Trial Purchase
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  Start your 10-hour trial with {vaName} for just $100
                </p>
              </div>

              {showPaymentForm ? (
                <PaymentForm
                  onSuccess={handlePaymentFormSuccess}
                  onCancel={() => {
                    setShowPaymentForm(false);
                    setShowPaymentModal(false);
                  }}
                  submitButtonText="Save & Purchase Trial"
                />
              ) : (
                <div className="space-y-4">
                  {/* Saved Payment Methods */}
                  {paymentMethods.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium text-gray-900">Select Payment Method</h4>
                      <div className="space-y-2">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method.id)}
                            disabled={processing}
                            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
                              selectedPaymentMethod === method.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center">
                              <CreditCardIcon className="h-5 w-5 mr-3 text-gray-700" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900">
                                  {method.brand} •••• {method.last4}
                                </p>
                                <p className="text-xs text-gray-700">
                                  Expires {method.exp_month}/{method.exp_year}
                                </p>
                              </div>
                            </div>
                            {selectedPaymentMethod === method.id && processing && (
                              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-white px-2 text-gray-700">or</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Add New Payment Method Button */}
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Add New Payment Method
                  </button>
                </div>
              )}

              {/* Terms Accepted Notice */}
              {termsAccepted && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800 font-medium">
                      Terms of Service accepted - No refunds policy acknowledged
                    </p>
                  </div>
                </div>
              )}

              {/* Trial Details */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">What you get:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <CheckIcon className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>10 hours of professional VA services</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>Direct communication with {vaName}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span>Time tracking and reporting</span>
                  </li>
                  <li className="flex items-start">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-orange-500 mt-0.5" />
                    <span className="font-semibold text-orange-700">Non-refundable purchase - All sales final</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      <TermsOfService 
        isOpen={showTerms}
        onClose={handleTermsClose}
        onAccept={handleTermsAccept}
        accepted={termsAccepted}
        setAccepted={setTermsAccepted}
      />
    </>
  );
};

export default TrialPurchaseButton;