import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../../contexts/BrandingContext';
import { BillingProvider } from '../../contexts/BillingContext';
import BillingTab from '../../components/billing/BillingTab';
import SettingsTab from '../../components/settings/SettingsTab';
import BusinessProfile from './Profile'; // The existing profile component
import { 
  UserCircleIcon, 
  CreditCardIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

function BusinessProfileWithTabsContent() {
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { 
      id: 'profile', 
      name: 'Company Profile', 
      icon: BuildingOfficeIcon,
      description: 'Manage your company information and preferences'
    },
    { 
      id: 'billing', 
      name: 'Billing', 
      icon: CreditCardIcon,
      description: 'Manage payment methods and view purchase history'
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: Cog6ToothIcon,
      description: 'Account settings and preferences'
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          {activeTab === 'billing' ? 'Billing' : 
           activeTab === 'settings' ? 'Settings' : 
           'Business Profile'} - {branding.name}
        </title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header with Tabs */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {branding.isESystemsMode ? 'Company Dashboard' : 'Business Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-700">
                Manage your company profile, billing, and settings
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
                        }
                      `}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                      <Icon
                        className={`
                          -ml-0.5 mr-2 h-5 w-5
                          ${activeTab === tab.id
                            ? 'text-blue-500'
                            : 'text-gray-700 group-hover:text-gray-700'
                          }
                        `}
                        aria-hidden="true"
                      />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Description */}
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

          {/* Content Area */}
          <div className="min-h-[500px]">
            {activeTab === 'profile' && <BusinessProfile />}
            {activeTab === 'billing' && <BillingTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </>
  );
}

export default function BusinessProfileWithTabs() {
  return (
    <BillingProvider>
      <BusinessProfileWithTabsContent />
    </BillingProvider>
  );
}