import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Linkage VA Hub</title>
      </Helmet>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600">
                  By accessing and using Linkage VA Hub, you agree to be bound by these Terms of Service.
                  If you do not agree to these terms, please do not use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Platform Description</h2>
                <p className="text-gray-600">
                  Linkage VA Hub is a platform that connects businesses with Filipino virtual assistants.
                  We facilitate connections but are not responsible for the specific agreements made between parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
                <p className="text-gray-600 mb-4">As a user of our platform, you agree to:</p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Provide accurate and truthful information</li>
                  <li>Maintain the security of your account</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Treat other users with respect and professionalism</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Privacy</h2>
                <p className="text-gray-600">
                  Your use of our platform is also governed by our Privacy Policy. 
                  Please review our Privacy Policy to understand our practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Information</h2>
                <p className="text-gray-600">
                  If you have any questions about these Terms of Service, please contact us.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}