import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import BillingDetailsView from './billing/BillingDetailsView';
import BillingHistoryTable from './billing/BillingHistoryTable';
import ManualBillingActions from './billing/ManualBillingActions';

const BusinessBillingModal = ({ isOpen, onClose, businessId, businessName }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const queryClient = useQueryClient();

  // Fetch billing data
  const { data: billing, isLoading: billingLoading, error: billingError, refetch: refetchBilling } = useQuery({
    queryKey: ['businessBilling', businessId],
    queryFn: () => adminAPI.getBusinessBilling(businessId),
    enabled: isOpen && !!businessId,
    onSuccess: (response) => {
      setBillingData(response.data);
    }
  });

  // Fetch billing history
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['businessBillingHistory', businessId],
    queryFn: () => adminAPI.getBusinessBillingHistory(businessId, { limit: 50 }),
    enabled: isOpen && !!businessId && activeTab === 'history'
  });

  // Update billing mutation
  const updateBillingMutation = useMutation({
    mutationFn: (data) => adminAPI.updateBusinessBilling(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessBilling', businessId]);
      toast.success('Billing information updated successfully');
      setEditMode(false);
      refetchBilling();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update billing information');
    }
  });

  // Add manual charge mutation
  const addChargeMutation = useMutation({
    mutationFn: (data) => adminAPI.addManualCharge(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessBilling', businessId]);
      queryClient.invalidateQueries(['businessBillingHistory', businessId]);
      toast.success('Charge added successfully');
      refetchBilling();
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add charge');
    }
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ transactionId, amount, reason }) => 
      adminAPI.processRefund(transactionId, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['businessBilling', businessId]);
      queryClient.invalidateQueries(['businessBillingHistory', businessId]);
      toast.success('Refund processed successfully');
      refetchBilling();
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process refund');
    }
  });

  // Handle export
  const handleExport = async (format = 'csv') => {
    try {
      const response = await adminAPI.exportBillingData(businessId, { format });
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing-${businessName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Billing data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export billing data');
    }
  };

  // Calculate summary statistics
  const calculateStats = () => {
    if (!history?.data?.transactions) return null;

    const transactions = history.data.transactions;
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const lastMonth = transactions.filter(t => {
      const date = new Date(t.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() && 
             date.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastMonthTotal = lastMonth.reduce((sum, t) => sum + (t.amount || 0), 0);
    const percentChange = lastMonthTotal ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

    return {
      thisMonthTotal,
      lastMonthTotal,
      percentChange,
      totalTransactions: transactions.length,
      successfulTransactions: transactions.filter(t => t.status === 'successful').length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length
    };
  };

  const stats = calculateStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      <div className="fixed top-4 bottom-0 right-0 max-w-7xl w-full flex animate-slide-in-right">
        <div className="w-full min-w-0">
          <div className={`h-full flex flex-col shadow-2xl min-w-0 rounded-tl-xl overflow-hidden ${
            isDark ? 'bg-[#17803d]' : 'bg-white'
          }`}>
            {/* Enhanced Header with improved visibility */}
            <div className={`relative overflow-hidden ${
              isDark ? 'bg-[#17803d]' : 'bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800'
            }`}>
              {/* Background pattern for visual interest */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full blur-2xl" />
                <div className="absolute top-10 -left-4 w-32 h-32 bg-white rounded-full blur-3xl" />
              </div>
              
              {/* Header Content */}
              <div className="relative">
                <div className="px-6 sm:px-8 pt-14 pb-4 sm:pt-16 sm:pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 min-w-0 flex-1">
                      {/* Icon container with glass effect */}
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/20 shadow-lg flex-shrink-0">
                        <CreditCardIcon className="h-7 w-7 text-white" />
                      </div>
                      
                      {/* Text content with better hierarchy and visibility */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                          Billing Management
                        </h2>
                        <div className="flex items-center space-x-2 min-w-0">
                          <BuildingLibraryIcon className="h-4 w-4 text-primary-200 flex-shrink-0" />
                          <p 
                            className="billing-company-name"
                            title={businessName || 'Select a business'}
                          >
                            {businessName || 'Select a business'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Close button with better visibility */}
                    <button
                      onClick={onClose}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-2.5 rounded-xl transition-all duration-200 border border-white/20 group"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Tabs positioned at the bottom of the header */}
                <div className="flex space-x-2 px-6 sm:px-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                    { id: 'details', label: 'Details', icon: InformationCircleIcon },
                    { id: 'history', label: 'History', icon: ClockIcon },
                    { id: 'actions', label: 'Actions', icon: PlusCircleIcon }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-t-xl transition-all duration-200 font-medium ${
                        activeTab === tab.id
                          ? isDark 
                            ? 'bg-gray-800 text-white shadow-lg'
                            : 'bg-white text-primary-700 shadow-lg'
                          : isDark
                            ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/10'
                            : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content area starting immediately after tabs */}
            <div className={`flex-1 overflow-y-auto ${
              isDark ? 'bg-[#374151]' : 'bg-white'
            }`}>
              {billingLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="admin-loading"></div>
                </div>
              ) : billingError ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-800">Failed to load billing information</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Overview Tab with enhanced design */}
                  {activeTab === 'overview' && (
                    <div className="px-6 py-6 space-y-6">
                      {/* Quick Stats with improved card design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#374151] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 p-5 hover:shadow-xl transition-shadow duration-200 group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                ${billing?.data?.balance?.toFixed(2) || '0.00'}
                              </p>
                              <div className="h-1 w-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full group-hover:w-24 transition-all duration-300" />
                            </div>
                            <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-3 rounded-xl">
                              <BanknotesIcon className="h-6 w-6 text-primary-700" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#374151] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 p-5 hover:shadow-xl transition-shadow duration-200 group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Available Credits</p>
                              <p className="text-2xl font-bold text-green-600 mb-1">
                                ${billing?.data?.credits?.toFixed(2) || '0.00'}
                              </p>
                              <div className="h-1 w-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full group-hover:w-24 transition-all duration-300" />
                            </div>
                            <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl">
                              <CurrencyDollarIcon className="h-6 w-6 text-green-700" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#374151] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 p-5 hover:shadow-xl transition-shadow duration-200 group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">This Month</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                ${stats?.thisMonthTotal?.toFixed(2) || '0.00'}
                              </p>
                              {stats?.percentChange !== undefined && (
                                <div className="flex items-center">
                                  {stats.percentChange > 0 ? (
                                    <>
                                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-sm font-semibold text-green-600">
                                        +{stats.percentChange.toFixed(1)}%
                                      </span>
                                    </>
                                  ) : stats.percentChange < 0 ? (
                                    <>
                                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-sm font-semibold text-red-600">
                                        {stats.percentChange.toFixed(1)}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">No change</span>
                                  )}
                                </div>
                              )}
                              <div className="h-1 w-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full group-hover:w-24 transition-all duration-300 mt-2" />
                            </div>
                            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
                              <ChartBarIcon className="h-6 w-6 text-blue-700" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#374151] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 p-5 hover:shadow-xl transition-shadow duration-200 group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Payment</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                ${billing?.data?.lastPayment?.amount?.toFixed(2) || '0.00'}
                              </p>
                              {billing?.data?.lastPayment?.date && (
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {new Date(billing.data.lastPayment.date).toLocaleDateString()}
                                </p>
                              )}
                              <div className="h-1 w-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full group-hover:w-24 transition-all duration-300 mt-2" />
                            </div>
                            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
                              <CalendarIcon className="h-6 w-6 text-purple-700" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Info with enhanced styling */}
                      <div className="bg-white dark:bg-[#374151] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 p-6 hover:shadow-xl transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Details</h3>
                          <div className="h-8 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              {billing?.data?.subscription?.plan || 'No active plan'}
                            </p>
                            {billing?.data?.subscription?.status && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                                billing.data.subscription.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : billing.data.subscription.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {billing.data.subscription.status}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Billing Cycle</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              {billing?.data?.subscription?.billingCycle || 'N/A'}
                            </p>
                            {billing?.data?.subscription?.nextBillingDate && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Next: {new Date(billing.data.subscription.nextBillingDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rate</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              ${billing?.data?.subscription?.monthlyRate?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions with enhanced design */}
                      <div className="bg-white dark:bg-[#374151] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 p-6 hover:shadow-xl transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                          <div className="h-8 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <button
                            onClick={() => setActiveTab('actions')}
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-xl transition-all duration-200 border border-primary-200 group"
                          >
                            <PlusCircleIcon className="h-8 w-8 text-primary-700 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-primary-900">Add Charge</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('actions')}
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-200 border border-green-200 group"
                          >
                            <MinusCircleIcon className="h-8 w-8 text-green-700 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-green-900">Issue Credit</span>
                          </button>
                          <button
                            onClick={() => handleExport('csv')}
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 border border-blue-200 group"
                          >
                            <DocumentArrowDownIcon className="h-8 w-8 text-blue-700 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-blue-900">Export CSV</span>
                          </button>
                          <button
                            onClick={() => refetchBilling()}
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-200 border border-gray-200 group"
                          >
                            <ArrowPathIcon className="h-8 w-8 text-gray-700 mb-2 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-sm font-semibold text-gray-900">Refresh</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <BillingDetailsView
                      billing={billing?.data}
                      editMode={editMode}
                      onEdit={() => setEditMode(true)}
                      onCancel={() => {
                        setEditMode(false);
                        setBillingData(billing?.data);
                      }}
                      onSave={(updatedData) => {
                        updateBillingMutation.mutate(updatedData);
                      }}
                      billingData={billingData}
                      setBillingData={setBillingData}
                    />
                  )}

                  {/* History Tab */}
                  {activeTab === 'history' && (
                    <BillingHistoryTable
                      history={history?.data}
                      loading={historyLoading}
                      onRefund={(transaction) => {
                        if (window.confirm(`Process refund of $${transaction.amount.toFixed(2)} for transaction ${transaction.id}?`)) {
                          refundMutation.mutate({
                            transactionId: transaction.id,
                            amount: transaction.amount,
                            reason: 'Admin refund'
                          });
                        }
                      }}
                      onExport={handleExport}
                    />
                  )}

                  {/* Actions Tab */}
                  {activeTab === 'actions' && (
                    <ManualBillingActions
                      businessId={businessId}
                      businessName={businessName}
                      onCharge={(data) => addChargeMutation.mutate(data)}
                      onCredit={(data) => addChargeMutation.mutate({ ...data, amount: -Math.abs(data.amount) })}
                      isLoading={addChargeMutation.isLoading}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessBillingModal;