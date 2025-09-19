import React, { useState, useEffect } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import PaymentForm from './PaymentForm';
import { 
  CreditCardIcon, 
  PlusIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

const BillingTab = () => {
  const { 
    paymentMethods, 
    trialStatus, 
    loading,
    fetchPaymentMethods, 
    fetchTrialStatus,
    deletePaymentMethod,
    getPurchaseHistory
  } = useBilling();
  
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [deletingMethodId, setDeletingMethodId] = useState(null);

  useEffect(() => {
    fetchPaymentMethods();
    fetchTrialStatus();
    loadPurchaseHistory();
  }, []);

  const loadPurchaseHistory = async () => {
    const history = await getPurchaseHistory();
    setPurchaseHistory(history);
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      setDeletingMethodId(methodId);
      await deletePaymentMethod(methodId);
      setDeletingMethodId(null);
    }
  };

  const handlePaymentFormSuccess = () => {
    setShowAddPaymentForm(false);
    fetchPaymentMethods();
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2 text-gray-500" />
              Payment Methods
            </h3>
            {!showAddPaymentForm && (
              <button
                onClick={() => setShowAddPaymentForm(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Card
              </button>
            )}
          </div>

          {showAddPaymentForm ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <PaymentForm
                onSuccess={handlePaymentFormSuccess}
                onCancel={() => setShowAddPaymentForm(false)}
                submitButtonText="Save Payment Method"
              />
            </div>
          ) : (
            <>
              {loading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
                  <p className="mt-1 text-sm text-gray-500">Add a payment method to purchase VA trials.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <CreditCardIcon className="h-5 w-5 mr-3 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        disabled={deletingMethodId === method.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingMethodId === method.id ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Trials Section */}
      {trialStatus?.trials && trialStatus.trials.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              Active Trials
            </h3>
            <div className="space-y-4">
              {trialStatus.trials.filter(trial => trial.status === 'active').map((trial) => (
                <div key={trial._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          {trial.vaName || 'VA Trial'}
                        </h4>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{trial.hoursRemaining?.toFixed(1) || 0}</span> hours remaining of 10 hours
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires: {trial.expiresAt ? format(new Date(trial.expiresAt), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((trial.hoursRemaining || 0) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <ShoppingBagIcon className="h-5 w-5 mr-2 text-gray-500" />
            Purchase History
          </h3>
          
          {purchaseHistory.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases yet</h3>
              <p className="mt-1 text-sm text-gray-500">Your trial purchases will appear here.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseHistory.map((purchase) => (
                    <tr key={purchase._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.vaName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10 Hour Trial
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {(purchase.amount / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.status === 'succeeded' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : purchase.status === 'failed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Processing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Payment Security</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>All payments are processed securely through Stripe</li>
                <li>We never store your full card details on our servers</li>
                <li>Your payment information is encrypted and PCI compliant</li>
                <li>You can remove payment methods at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingTab;