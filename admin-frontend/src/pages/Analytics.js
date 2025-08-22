import React from 'react';

const Analytics = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-admin-900">Analytics</h1>
        <p className="mt-1 text-sm text-admin-600">
          Platform analytics and insights
        </p>
      </div>

      <div className="admin-card p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-admin-900">Analytics Coming Soon</h3>
          <p className="mt-1 text-sm text-admin-500">
            Advanced analytics and reporting features will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
