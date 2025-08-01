import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';

export default function NotFound() {
  const { branding } = useBranding();
  
  return (
    <>
      <Helmet>
        <title>Page Not Found - {branding.name}</title>
      </Helmet>

      <div className="min-h-full pt-16 pb-12 flex flex-col bg-white">
        <main className="flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex-shrink-0 flex justify-center">
            <Link to="/" className="inline-flex">
              <span className="sr-only">{branding.name}</span>
              <h1 className="text-4xl font-bold text-gray-600">{branding.name}</h1>
            </Link>
          </div>
          <div className="py-16">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">404 error</p>
              <h1 className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                Page not found.
              </h1>
              <p className="mt-2 text-base text-gray-500">
                Sorry, we couldn't find the page you're looking for.
              </p>
              <div className="mt-6">
                <Link
                  to="/"
                  className="text-base font-medium text-gray-600 hover:text-gray-500"
                >
                  Go back home<span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}