import React, { useState } from 'react';
import {
  PlusCircleIcon,
  MinusCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';

const ManualBillingActions = ({ businessId, businessName, onCharge, onCredit, isLoading }) => {
  const [activeAction, setActiveAction] = useState('charge');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'one-time',
    category: 'service',
    dueDate: new Date().toISOString().split('T')[0],
    applyTax: true,
    sendNotification: true,
    notes: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const chargeCategories = [
    { value: 'service', label: 'Service Fee', icon: CreditCardIcon },
    { value: 'subscription', label: 'Subscription', icon: CalendarIcon },
    { value: 'usage', label: 'Usage Charge', icon: ReceiptPercentIcon },
    { value: 'penalty', label: 'Late Fee', icon: ExclamationTriangleIcon },
    { value: 'other', label: 'Other', icon: DocumentTextIcon }
  ];

  const creditCategories = [
    { value: 'refund', label: 'Refund', icon: MinusCircleIcon },
    { value: 'discount', label: 'Discount', icon: ReceiptPercentIcon },
    { value: 'adjustment', label: 'Adjustment', icon: DocumentTextIcon },
    { value: 'compensation', label: 'Compensation', icon: CheckCircleIcon },
    { value: 'other', label: 'Other', icon: BanknotesIcon }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      businessId
    };

    if (activeAction === 'charge') {
      onCharge(data);
    } else {
      onCredit(data);
    }

    // Reset form
    setFormData({
      amount: '',
      description: '',
      type: 'one-time',
      category: 'service',
      dueDate: new Date().toISOString().split('T')[0],
      applyTax: true,
      sendNotification: true,
      notes: ''
    });
    setShowConfirmation(false);
  };

  const categories = activeAction === 'charge' ? chargeCategories : creditCategories;

  return (
    <div className="px-6 pt-2 pb-6 space-y-6">
      {/* Action Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Billing Actions</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActiveAction('charge')}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeAction === 'charge'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <PlusCircleIcon className={`h-8 w-8 mx-auto mb-2 ${
              activeAction === 'charge' ? 'text-primary-600' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              activeAction === 'charge' ? 'text-primary-900' : 'text-gray-700'
            }`}>
              Add Charge
            </p>
            <p className="text-sm text-gray-500 mt-1">Bill the business for services</p>
          </button>

          <button
            onClick={() => setActiveAction('credit')}
            className={`p-4 rounded-lg border-2 transition-all ${
              activeAction === 'credit'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <MinusCircleIcon className={`h-8 w-8 mx-auto mb-2 ${
              activeAction === 'credit' ? 'text-green-600' : 'text-gray-400'
            }`} />
            <p className={`font-medium ${
              activeAction === 'credit' ? 'text-green-900' : 'text-gray-700'
            }`}>
              Issue Credit
            </p>
            <p className="text-sm text-gray-500 mt-1">Apply credit or discount</p>
          </button>
        </div>
      </div>

      {/* Action Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-lg mr-3 ${
            activeAction === 'charge' ? 'bg-primary-100' : 'bg-green-100'
          }`}>
            {activeAction === 'charge' ? (
              <PlusCircleIcon className="h-6 w-6 text-primary-600" />
            ) : (
              <MinusCircleIcon className="h-6 w-6 text-green-600" />
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {activeAction === 'charge' ? 'Add New Charge' : 'Issue Credit'}
            </h4>
            <p className="text-sm text-gray-500">For {businessName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={activeAction === 'charge' ? 'Service charge description' : 'Credit reason'}
              required
            />
          </div>

          {/* Type and Due Date (for charges) */}
          {activeAction === 'charge' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charge Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="one-time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add any internal notes about this transaction..."
            />
          </div>

          {/* Options */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            {activeAction === 'charge' && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.applyTax}
                  onChange={(e) => setFormData({ ...formData, applyTax: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Apply tax to this charge</span>
              </label>
            )}
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendNotification}
                onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Send email notification to business</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  amount: '',
                  description: '',
                  type: 'one-time',
                  category: 'service',
                  dueDate: new Date().toISOString().split('T')[0],
                  applyTax: true,
                  sendNotification: true,
                  notes: ''
                });
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.amount || !formData.description}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeAction === 'charge'
                  ? 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
              }`}
            >
              {isLoading ? 'Processing...' : activeAction === 'charge' ? 'Add Charge' : 'Issue Credit'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Actions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All charges will be immediately reflected in the business's balance</li>
              <li>Credits will reduce the outstanding balance or be saved for future use</li>
              <li>Email notifications will be sent based on the business's billing preferences</li>
              <li>All manual actions are logged and can be viewed in the transaction history</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setShowConfirmation(false)} />
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${
                  activeAction === 'charge' ? 'bg-primary-100' : 'bg-green-100'
                }`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${
                    activeAction === 'charge' ? 'text-primary-600' : 'text-green-600'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm {activeAction === 'charge' ? 'Charge' : 'Credit'}
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Business</p>
                  <p className="font-medium text-gray-900">{businessName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeAction === 'credit' && '-'}${parseFloat(formData.amount).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium text-gray-900">{formData.description}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    activeAction === 'charge'
                      ? 'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300'
                      : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualBillingActions;