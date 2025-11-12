import React, { useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ReceiptRefundIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const BillingHistoryTable = ({ history, loading, onRefund, onExport }) => {
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'successful':
      case 'success':
      case 'completed':
        return {
          icon: <CheckCircleIcon className="h-5 w-5" />,
          color: 'text-green-600 bg-green-100',
          text: 'Success'
        };
      case 'failed':
      case 'declined':
        return {
          icon: <XCircleIcon className="h-5 w-5" />,
          color: 'text-red-600 bg-red-100',
          text: 'Failed'
        };
      case 'pending':
      case 'processing':
        return {
          icon: <ClockIcon className="h-5 w-5" />,
          color: 'text-yellow-600 bg-yellow-100',
          text: 'Pending'
        };
      case 'refunded':
        return {
          icon: <ReceiptRefundIcon className="h-5 w-5" />,
          color: 'text-purple-600 bg-purple-100',
          text: 'Refunded'
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-5 w-5" />,
          color: 'text-gray-600 bg-gray-100',
          text: status || 'Unknown'
        };
    }
  };

  // Get transaction type display
  const getTypeDisplay = (type) => {
    const typeMap = {
      'charge': { text: 'Charge', color: 'bg-blue-100 text-blue-800' },
      'payment': { text: 'Payment', color: 'bg-green-100 text-green-800' },
      'refund': { text: 'Refund', color: 'bg-purple-100 text-purple-800' },
      'credit': { text: 'Credit', color: 'bg-orange-100 text-orange-800' },
      'adjustment': { text: 'Adjustment', color: 'bg-gray-100 text-gray-800' },
      'subscription': { text: 'Subscription', color: 'bg-indigo-100 text-indigo-800' }
    };
    return typeMap[type?.toLowerCase()] || { text: type || 'Other', color: 'bg-gray-100 text-gray-800' };
  };

  // Filter transactions
  const filteredTransactions = history?.transactions?.filter(transaction => {
    // Status filter
    if (filter !== 'all' && transaction.status?.toLowerCase() !== filter) {
      return false;
    }

    // Date range filter
    if (dateRange.start && new Date(transaction.createdAt) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(transaction.createdAt) > new Date(dateRange.end)) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        transaction.id?.toLowerCase().includes(search) ||
        transaction.description?.toLowerCase().includes(search) ||
        transaction.type?.toLowerCase().includes(search) ||
        transaction.amount?.toString().includes(search)
      );
    }

    return true;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Calculate summary
  const summary = {
    total: filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    successful: filteredTransactions.filter(t => ['successful', 'success', 'completed'].includes(t.status?.toLowerCase())).length,
    failed: filteredTransactions.filter(t => ['failed', 'declined'].includes(t.status?.toLowerCase())).length,
    pending: filteredTransactions.filter(t => ['pending', 'processing'].includes(t.status?.toLowerCase())).length
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-white">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={() => onExport('csv')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">${summary.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Successful</p>
            <p className="text-xl font-bold text-green-600">{summary.successful}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-xl font-bold text-red-600">{summary.failed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{summary.pending}</p>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="admin-loading"></div>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white">No transactions found</p>
            {searchTerm || filter !== 'all' || dateRange.start || dateRange.end ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
                className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1e3a8a] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.map((transaction) => {
                    const statusDisplay = getStatusDisplay(transaction.status);
                    const typeDisplay = getTypeDisplay(transaction.type);
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.id?.substring(0, 8)}...
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-white">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeDisplay.color}`}>
                            {typeDisplay.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 truncate max-w-xs">
                            {transaction.description || 'No description'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${
                            transaction.type === 'refund' || transaction.type === 'credit' 
                              ? 'text-red-600' 
                              : 'text-gray-900'
                          }`}>
                            {transaction.type === 'refund' || transaction.type === 'credit' ? '-' : ''}
                            ${Math.abs(transaction.amount).toFixed(2)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg ${statusDisplay.color}`}>
                            {statusDisplay.icon}
                            <span className="ml-1.5 text-xs font-medium">{statusDisplay.text}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.status === 'successful' && transaction.type !== 'refund' && (
                            <button
                              onClick={() => onRefund(transaction)}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                              title="Process refund"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of{' '}
                    {filteredTransactions.length} transactions
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BillingHistoryTable;