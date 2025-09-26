import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Layout from './Layout';
import { useBranding } from '../contexts/BrandingContext';

export default function ConditionalLayout() {
  const location = useLocation();
  const { branding } = useBranding();
  
  // Check if this is a shared view
  const isSharedView = location.search.includes('share=true');
  
  // If it's a shared view, render without Layout but with a minimal footer
  if (isSharedView) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow">
          <Outlet />
        </div>
        <footer className="bg-gray-50 border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
              <span>Powered by</span>
              <Link to="/" className="flex items-center hover:text-gray-700">
                <img
                  className="h-6 w-auto"
                  src={branding?.logoUrl || branding?.logo || '/logo.png'}
                  alt={branding?.name || 'Platform'}
                />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }
  
  // Otherwise, use the normal Layout
  return <Layout />;
}