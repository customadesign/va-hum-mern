import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function VAProfile() {
  return (
    <>
      <Helmet>
        <title>Edit Profile - Linkage VA Hub</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit VA Profile
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-gray-500">VA profile editing form would go here...</p>
        </div>
      </div>
    </>
  );
}