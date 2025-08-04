import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import VACard from '../components/VACard';
import { useBranding } from '../contexts/BrandingContext';

export default function Home() {
  const { branding, loading: brandingLoading } = useBranding();
  
  // ALL HOOKS MUST BE CALLED FIRST - Get featured VAs data
  const { data: featuredVAs, isLoading } = useQuery(
    'featuredVAs',
    async () => {
      const response = await api.get('/vas/featured');
      return response.data.data;
    }
  );

  // CONDITIONAL RETURNS AFTER ALL HOOKS - Show loading spinner while branding context is loading
  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{branding.isESystemsMode ? 'E-Systems Management - Find Skilled Team Members' : 'Linkage VA Hub - Connect with Talented Filipino Virtual Assistants'}</title>
        <meta name="description" content={branding.isESystemsMode ? 'Access pre-screened, skilled professionals for your business needs' : 'Find and hire skilled Filipino virtual assistants for your business needs'} />
      </Helmet>

      <div className="bg-gray-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-gray-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 lg:pr-0">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28 lg:pr-0">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    {branding.isESystemsMode ? (
                      <>
                        <span className="block text-gray-600">Build your dream team</span>
                        <span className="block text-gray-800">with skilled professionals</span>
                      </>
                    ) : (
                      <>
                        <span className="block text-gray-600">Connect with talented</span>
                        <span className="block text-gray-800">Filipino virtual assistants</span>
                      </>
                    )}
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    {branding.isESystemsMode ? (
                      <>
                        E-Systems Management helps you find pre-screened, skilled professionals ready to join your team.
                        <span className="md:block">Scale your business with confidence.</span>
                      </>
                    ) : (
                      <>
                        Linkage VA Hub connects businesses with skilled virtual assistants from the Philippines.
                        <span className="md:block">Find your perfect VA match today.</span>
                      </>
                    )}
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        to="/register"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                      >
                        Get started
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        to="/about"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                      >
                        Learn more
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:pl-0">
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
              src="https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/6890213c18e40e521ab87d65.jpeg"
              alt="Two professional women working together as virtual assistants"
            />
          </div>
        </div>

        {/* Featured VAs Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="pb-5 sm:flex sm:items-center sm:justify-between">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Featured Virtual Assistants
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : featuredVAs && featuredVAs.length > 0 ? (
            <>
              <div className="relative overflow-hidden h-96 sm:rounded-md shadow bg-white">
                {/* Gradient overlays for smooth fade effect */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
                
                {/* Scrolling container */}
                <div className="animate-scroll-up">
                  <div className="divide-y divide-gray-200">
                    {/* Original list */}
                    {featuredVAs?.map((va) => (
                      <VACard key={`${va._id}-1`} va={va} />
                    ))}
                    {/* Duplicate list for seamless loop */}
                    {featuredVAs?.map((va) => (
                      <VACard key={`${va._id}-2`} va={va} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-right">
                <Link
                  to="/vas"
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  View all VAs
                  <ArrowRightCircleIcon className="ml-3 -mr-1 h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No featured virtual assistants available at the moment.
            </div>
          )}
        </div>
      </div>
    </>
  );
}