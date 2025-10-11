import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { format, subDays, startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UserGroupIcon,
  CalendarIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import analyticsAPI from '../../services/analytics';
import { useBranding } from '../../contexts/BrandingContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Modal displaying detailed profile views analytics
 * Includes time-series chart, filters, KPIs, and top referrers
 */
export default function ProfileViewsModal({ user, registrationDate, onClose }) {
  const modalRef = useRef(null);
  const { branding } = useBranding();
  const brand = branding?.isESystemsMode ? 'esystems' : 'linkage';

  // Date range presets
  const DATE_PRESETS = {
    LAST_7_DAYS: { label: 'Last 7 days', days: 7 },
    LAST_30_DAYS: { label: 'Last 30 days', days: 30 },
    LAST_90_DAYS: { label: 'Last 90 days', days: 90 },
    THIS_YEAR: { label: 'This year', value: 'year' },
    ALL_TIME: { label: 'All time', value: 'all' }
  };

  // State
  const [datePreset, setDatePreset] = useState('LAST_30_DAYS');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [interval, setInterval] = useState('day');
  const [showUnique, setShowUnique] = useState(false);

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    if (datePreset === 'CUSTOM' && customStartDate && customEndDate) {
      return {
        startDate: startOfDay(new Date(customStartDate)),
        endDate: endOfDay(new Date(customEndDate))
      };
    }

    const preset = DATE_PRESETS[datePreset];
    if (!preset) return null;

    if (preset.value === 'year') {
      return {
        startDate: startOfYear(new Date()),
        endDate: endOfDay(new Date())
      };
    }

    if (preset.value === 'all' && registrationDate) {
      return {
        startDate: startOfDay(new Date(registrationDate)),
        endDate: endOfDay(new Date())
      };
    }

    return {
      startDate: startOfDay(subDays(new Date(), preset.days)),
      endDate: endOfDay(new Date())
    };
  }, [datePreset, customStartDate, customEndDate, registrationDate]);

  // Fetch time series data
  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['profile-views-series', user?.id, brand, dateRange?.startDate?.toISOString?.(), dateRange?.endDate?.toISOString?.(), interval, showUnique],
    queryFn: async () => {
      if (!dateRange) return null;
      const response = await analyticsAPI.getProfileViewsSeries({
        vaId: 'me',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        interval,
        unique: showUnique,
        brand
      });
      return response.data;
    },
    enabled: !!user && !!dateRange,
    staleTime: 2 * 60 * 1000
  });

  // Fetch referrers data
  const { data: referrersData, isLoading: referrersLoading } = useQuery({
    queryKey: ['profile-views-referrers', user?.id, brand, dateRange?.startDate?.toISOString?.(), dateRange?.endDate?.toISOString?.()],
    queryFn: async () => {
      if (!dateRange) return null;
      const response = await analyticsAPI.getProfileViewsReferrers({
        vaId: 'me',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 5,
        brand
      });
      return response.data;
    },
    enabled: !!user && !!dateRange,
    staleTime: 2 * 60 * 1000
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!seriesData?.series || seriesData.series.length === 0) {
      return {
        total: 0,
        unique: 0,
        avgPerDay: 0,
        last7DaysChange: 0
      };
    }

    const total = seriesData.series.reduce((sum, point) => sum + point.views, 0);
    const unique = seriesData.unique || 0;
    const days = seriesData.series.length;
    const avgPerDay = days > 0 ? Math.round(total / days) : 0;

    // Calculate last 7 days vs previous 7 days
    let last7DaysChange = 0;
    if (seriesData.series.length >= 14) {
      const last7 = seriesData.series.slice(-7).reduce((sum, point) => sum + point.views, 0);
      const prev7 = seriesData.series.slice(-14, -7).reduce((sum, point) => sum + point.views, 0);
      if (prev7 > 0) {
        last7DaysChange = Math.round(((last7 - prev7) / prev7) * 100);
      }
    }

    return { total, unique, avgPerDay, last7DaysChange };
  }, [seriesData]);

  // Chart configuration
  const chartData = useMemo(() => {
    if (!seriesData?.series || seriesData.series.length === 0) {
      return null;
    }

    const labels = seriesData.series.map(point => {
      const date = new Date(point.date);
      if (interval === 'day') return format(date, 'MMM d');
      if (interval === 'week') return format(date, 'MMM d');
      return format(date, 'MMM yyyy');
    });

    return {
      labels,
      datasets: [
        {
          label: showUnique ? 'Unique Viewers' : 'Total Views',
          data: seriesData.series.map(point => point.views),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    };
  }, [seriesData, interval, showUnique]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // Handle outside click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 id="modal-title" className="text-xl font-semibold text-gray-900">
              Profile Views Analytics
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Track how many people are viewing your profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Preset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  {Object.entries(DATE_PRESETS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom range</option>
                </select>
              </div>

              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interval
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>

              {/* Unique Toggle */}
              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnique}
                    onChange={(e) => setShowUnique(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Show unique viewers only
                  </span>
                </label>
              </div>
            </div>

            {/* Custom Date Range */}
            {datePreset === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate || ''}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate || ''}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <EyeIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Total Views</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {seriesLoading ? '...' : kpis.total.toLocaleString()}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Unique Viewers</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {seriesLoading ? '...' : kpis.unique.toLocaleString()}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Avg per Day</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {seriesLoading ? '...' : kpis.avgPerDay.toLocaleString()}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                {kpis.last7DaysChange >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className="text-sm font-medium text-gray-600">7-Day Change</span>
              </div>
              <div className={`text-2xl font-bold ${
                kpis.last7DaysChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {seriesLoading ? '...' : `${kpis.last7DaysChange > 0 ? '+' : ''}${kpis.last7DaysChange}%`}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Views Over Time</h4>
            {seriesLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !chartData ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available for selected period
              </div>
            ) : (
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          {/* Top Referrers */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Top Referrers</h4>
            {referrersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : !referrersData?.referrers || referrersData.referrers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No referrer data yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Referrers will appear as people visit your profile from external links
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrersData.referrers.map((referrer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <LinkIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {referrer.source || 'Direct / Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {referrer.count.toLocaleString()} views
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(referrer.count / referrersData.referrers[0].count) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}