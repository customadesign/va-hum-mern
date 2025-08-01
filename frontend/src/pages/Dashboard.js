import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

export default function Dashboard() {
  const { user, isVA, isBusiness } = useAuth();
  const { branding } = useBranding();

  return (
    <>
      <Helmet>
        <title>Dashboard - {branding.name}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Profile Completion Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Profile Completion</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-blue-900">75%</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-5 py-3">
              <div className="text-sm">
                <Link to={isVA ? '/va/profile' : '/business/profile'} className="font-medium text-blue-700 hover:text-blue-900">
                  Complete profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Messages Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-sky-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-sky-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Conversations</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-sky-900">0</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-sky-50 px-5 py-3">
              <div className="text-sm">
                <Link to="/conversations" className="font-medium text-sky-700 hover:text-sky-900">
                  View conversations →
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-indigo-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {isVA ? 'Profile Views' : (branding.isESystemsMode ? 'Team Members Contacted' : 'VAs Contacted')}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-indigo-900">0</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 px-5 py-3">
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-700 hover:text-indigo-900">
                  View analytics →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isVA ? (
              <>
                <div className="relative rounded-lg border border-blue-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-blue-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/va/profile" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Update Profile</p>
                      <p className="text-sm text-gray-500">Keep your profile up to date</p>
                    </Link>
                  </div>
                </div>
                <div className="relative rounded-lg border border-sky-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-sky-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-sky-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/conversations" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Check Messages</p>
                      <p className="text-sm text-gray-500">{branding.isESystemsMode ? 'Respond to employers' : 'Respond to businesses'}</p>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative rounded-lg border border-indigo-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/vas" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">{branding.isESystemsMode ? 'Browse Team Members' : 'Browse VAs'}</p>
                      <p className="text-sm text-gray-500">Find your perfect match</p>
                    </Link>
                  </div>
                </div>
                <div className="relative rounded-lg border border-sky-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-sky-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-sky-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/conversations" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">View Conversations</p>
                      <p className="text-sm text-gray-500">Continue discussions</p>
                    </Link>
                  </div>
                </div>
              </>
            )}
            
            {/* Admin Panel - Only show for admin users */}
            {user?.admin && (
              <div className="relative rounded-lg border border-purple-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-500 transition-colors">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/admin" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">Admin Panel</p>
                    <p className="text-sm text-gray-500">Manage the entire ecosystem</p>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Encouragement Banner - Only show for VAs */}
        {isVA && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Get Placed Faster with a Complete Profile
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          Complete your profile to appear higher in search results and increase your visibility to potential employers. 
                          {branding.isESystemsMode ? 'Team members' : 'VAs'} with completed profiles get contacted 3x more often and secure placements faster.
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Higher search ranking
                          </div>
                          <div className="flex items-center text-xs text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Increased visibility
                          </div>
                          <div className="flex items-center text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Faster placement
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Link 
                          to="/va/profile" 
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Complete Profile
                          <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 px-6 py-3 border-t border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Profile Completeness</span>
                  <span className="text-emerald-700 font-semibold">75% Complete</span>
                </div>
                <div className="mt-2 bg-white rounded-full h-2 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500 ease-out" style={{width: '75%'}}></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Just a few more details needed to reach 100% and maximize your placement opportunities!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}