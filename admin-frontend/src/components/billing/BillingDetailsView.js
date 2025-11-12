import React from 'react';
import {
  CreditCardIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const BillingDetailsView = ({ 
  billing, 
  editMode, 
  onEdit, 
  onCancel, 
  onSave, 
  billingData, 
  setBillingData 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Payment method icons
  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'credit_card':
        return <CreditCardIcon className="h-5 w-5" />;
      case 'bank_account':
        return <BuildingLibraryIcon className="h-5 w-5" />;
      default:
        return <CreditCardIcon className="h-5 w-5" />;
    }
  };

  // Card brand colors
  const getCardBrandColor = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-blue-500';
      case 'mastercard':
        return 'bg-red-500';
      case 'amex':
      case 'american express':
        return 'bg-blue-600';
      case 'discover':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleFieldChange = (field, value) => {
    setBillingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setBillingData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value
      }
    }));
  };

  return (
    <div className={`px-6 pt-2 pb-6 space-y-6 billing-card ${isDark ? 'dark-theme' : ''}`}>
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Billing Information</h3>
        {!editMode ? (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            Edit Details
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={() => onSave(billingData)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Payment Methods Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-800 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2 text-gray-600" />
            Payment Methods
          </h4>
          {billing?.paymentMethods?.primary && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Primary
            </span>
          )}
        </div>

        {billing?.paymentMethods?.length > 0 ? (
          <div className="space-y-3">
            {billing.paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getCardBrandColor(method.brand)} bg-opacity-10`}>
                    {getPaymentMethodIcon(method.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.type === 'credit_card' ? 'Card' : 'Bank Account'} ending in {method.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      {method.brand && <span className="capitalize">{method.brand} • </span>}
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.isDefault && (
                    <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                  {method.status === 'verified' ? (
                    <ShieldCheckIcon className="h-5 w-5 text-green-500" title="Verified" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" title="Pending verification" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No payment methods on file</p>
            {editMode && (
              <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
                Add Payment Method
              </button>
            )}
          </div>
        )}
      </div>

      {/* Billing Address Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-gray-600" />
          Billing Address
        </h4>

        {editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={billingData?.billingAddress?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suite/Unit</label>
              <input
                type="text"
                value={billingData?.billingAddress?.suite || ''}
                onChange={(e) => handleAddressChange('suite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Apt 4B"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={billingData?.billingAddress?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                value={billingData?.billingAddress?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
              <input
                type="text"
                value={billingData?.billingAddress?.zipCode || ''}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="10001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={billingData?.billingAddress?.country || ''}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="United States"
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            {billing?.billingAddress ? (
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">{billing.billingAddress.street}</p>
                {billing.billingAddress.suite && (
                  <p className="text-gray-700">{billing.billingAddress.suite}</p>
                )}
                <p className="text-gray-700">
                  {billing.billingAddress.city}, {billing.billingAddress.state} {billing.billingAddress.zipCode}
                </p>
                <p className="text-gray-700">{billing.billingAddress.country}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No billing address on file</p>
            )}
          </div>
        )}
      </div>

      {/* Contact Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Contact Information</h4>

        {editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={billingData?.contactInfo?.email || ''}
                  onChange={(e) => setBillingData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, email: e.target.value }
                  }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="billing@company.com"
                />
                <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Phone</label>
              <div className="relative">
                <input
                  type="tel"
                  value={billingData?.contactInfo?.phone || ''}
                  onChange={(e) => setBillingData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, phone: e.target.value }
                  }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+1 (555) 123-4567"
                />
                <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{billing?.contactInfo?.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <PhoneIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-gray-900">{billing?.contactInfo?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
          <LockClosedIcon className="h-5 w-5 mr-2 text-gray-600" />
          Tax Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tax ID</p>
            <p className="text-gray-900 font-medium">
              {billing?.taxInfo?.taxId ? `***-**-${billing.taxInfo.taxId.slice(-4)}` : 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">VAT Number</p>
            <p className="text-gray-900 font-medium">
              {billing?.taxInfo?.vatNumber || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tax Exempt</p>
            <p className="text-gray-900 font-medium">
              {billing?.taxInfo?.isExempt ? (
                <span className="text-green-600">Yes</span>
              ) : (
                <span className="text-gray-600">No</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tax Rate</p>
            <p className="text-gray-900 font-medium">
              {billing?.taxInfo?.rate ? `${billing.taxInfo.rate}%` : 'Standard rate'}
            </p>
          </div>
        </div>
      </div>

      {/* Billing Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Billing Preferences</h4>

        {editMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-renewal</p>
                <p className="text-sm text-gray-500">Automatically renew subscription</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingData?.preferences?.autoRenewal || false}
                  onChange={(e) => setBillingData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, autoRenewal: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email invoices</p>
                <p className="text-sm text-gray-500">Send invoices via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingData?.preferences?.emailInvoices || false}
                  onChange={(e) => setBillingData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, emailInvoices: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Auto-renewal</span>
              <span className={`font-medium ${billing?.preferences?.autoRenewal ? 'text-green-600' : 'text-gray-400'}`}>
                {billing?.preferences?.autoRenewal ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Email invoices</span>
              <span className={`font-medium ${billing?.preferences?.emailInvoices ? 'text-green-600' : 'text-gray-400'}`}>
                {billing?.preferences?.emailInvoices ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Payment reminders</span>
              <span className={`font-medium ${billing?.preferences?.paymentReminders ? 'text-green-600' : 'text-gray-400'}`}>
                {billing?.preferences?.paymentReminders ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDetailsView;