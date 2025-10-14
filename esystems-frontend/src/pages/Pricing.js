import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  UserIcon,
  ChartBarIcon,
  SparklesIcon,
  BanknotesIcon,
  HomeIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useBranding } from '../contexts/BrandingContext';

export default function Pricing() {
  const { branding, loading: brandingLoading } = useBranding();

  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const benefits = [
    {
      title: 'English Proficient',
      description: 'All VAs undergo rigorous English language assessments for clear communication',
      icon: UserGroupIcon
    },
    {
      title: 'Tech Savvy',
      description: 'Skilled in modern tools and platforms to hit the ground running',
      icon: CheckCircleIcon
    },
    {
      title: 'Pre-Vetted',
      description: 'Every VA is screened, interviewed, and background checked',
      icon: ShieldCheckIcon
    },
    {
      title: 'Flexible Hours',
      description: 'Part-time or full-time, aligned with your business hours',
      icon: ClockIcon
    }
  ];

  const whatYouGet = [
    'Dedicated virtual assistant matched to your needs',
    'English proficient with excellent communication skills',
    'Technology proficient - familiar with modern tools and platforms',
    'Pre-screened and background checked',
    'Ongoing support from our success team',
    '30-day replacement guarantee if not a perfect fit',
    'Flexible scheduling to match your timezone',
    'No long-term contracts - scale up or down as needed'
  ];

  const commonTasks = [
    'Administrative support and calendar management',
    'Email management and correspondence',
    'Customer service and support',
    'Data entry and database management',
    'Social media management',
    'Research and reporting',
    'Content creation and editing',
    'Bookkeeping and invoicing',
    'Project coordination',
    'Technical support'
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - $10/Hour for Skilled Virtual Assistants | E Systems</title>
        <meta name="description" content="Simple, transparent pricing: $10/hour for English and tech proficient virtual assistants. No hidden fees, no surprises." />
        <meta property="og:title" content="Pricing - $10/Hour for Skilled Virtual Assistants | E Systems" />
        <meta property="og:description" content="Simple, transparent pricing: $10/hour for English and tech proficient virtual assistants. No hidden fees, no surprises." />
        <meta property="og:url" content="https://esystems.com/pricing" />
        <link rel="canonical" href="https://esystems.com/pricing" />
      </Helmet>

      <div className="bg-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-2 rounded-full mb-4" style={{ backgroundColor: '#09006e15' }}>
                <CurrencyDollarIcon className="h-12 w-12" style={{ color: '#09006e' }} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: '#09006e' }}>
                Simple, Transparent Pricing
              </h1>
              <div className="mt-8 flex flex-col items-center">
                <div className="flex items-baseline">
                  <span className="text-6xl font-extrabold tracking-tight" style={{ color: '#09006e' }}>$10</span>
                  <span className="ml-2 text-3xl font-medium" style={{ color: '#374151' }}>/hour</span>
                </div>
                <p className="mt-4 text-xl font-medium" style={{ color: '#374151' }}>
                  All of our VAs are $10/hour starting - for your English and tech proficient VA
                </p>
              </div>
              <p className="mt-6 max-w-2xl mx-auto text-lg" style={{ color: '#374151' }}>
                No hidden fees. No setup costs. No surprises. Just exceptional virtual assistants at a rate that works for your business.
              </p>
              <div className="mt-10 flex justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{ backgroundColor: '#ef8f00' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#cc7a00'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef8f00'}
                >
                  Get Started Today
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: '#09006e' }}>
                What's Included
              </h2>
              <p className="mt-4 text-xl" style={{ color: '#374151' }}>
                Every VA comes fully equipped to deliver results
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="relative p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center h-14 w-14 mx-auto rounded-xl text-white mb-4" style={{ backgroundColor: '#09006e' }}>
                    <benefit.icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#09006e' }}>
                    {benefit.title}
                  </h3>
                  <p className="text-center" style={{ color: '#374151' }}>
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: '#09006e' }}>
                  Everything you need included
                </h2>
                <p className="mt-4 text-lg" style={{ color: '#374151' }}>
                  Our $10/hour rate includes comprehensive support and guarantees to ensure your success.
                </p>
                <div className="mt-8 space-y-4">
                  {whatYouGet.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-6 w-6" style={{ color: '#10b981' }} />
                      </div>
                      <p className="ml-3 text-base" style={{ color: '#374151' }}>
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className="rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: '#09006e' }}>
                  <div className="px-6 py-8 sm:p-10">
                    <h3 className="text-2xl font-bold text-white mb-6">
                      Why Choose E Systems?
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <StarIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div className="ml-3">
                          <p className="text-lg font-medium text-white">Quality Guaranteed</p>
                          <p className="mt-1 text-sm text-gray-300">
                            30-day replacement guarantee ensures you get the perfect match
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <StarIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div className="ml-3">
                          <p className="text-lg font-medium text-white">Ongoing Support</p>
                          <p className="mt-1 text-sm text-gray-300">
                            Dedicated success manager to help optimize performance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <StarIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div className="ml-3">
                          <p className="text-lg font-medium text-white">No Surprises</p>
                          <p className="mt-1 text-sm text-gray-300">
                            Transparent pricing with no hidden fees or setup costs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <StarIcon className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div className="ml-3">
                          <p className="text-lg font-medium text-white">Flexible Terms</p>
                          <p className="mt-1 text-sm text-gray-300">
                            Month-to-month agreements - scale up or down as needed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Tasks Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: '#09006e' }}>
                What Can Your VA Do?
              </h2>
              <p className="mt-4 text-xl" style={{ color: '#374151' }}>
                Our VAs handle a wide range of business-critical tasks
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {commonTasks.map((task, idx) => (
                  <div key={idx} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <CheckCircleIcon className="h-6 w-6 flex-shrink-0" style={{ color: '#10b981' }} />
                    <span className="ml-3" style={{ color: '#374151' }}>{task}</span>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-center text-base" style={{ color: '#374151' }}>
                Don't see what you need? <Link to="/register" className="font-medium hover:underline" style={{ color: '#09006e' }}>Contact us</Link> to discuss your specific requirements.
              </p>
            </div>
          </div>
        </div>

        {/* ROI Calculator Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: '#09006e' }}>
                Calculate Your Savings
              </h2>
              <p className="mt-4 text-xl" style={{ color: '#374151' }}>
                See how much you can save compared to traditional hiring
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: '#09006e' }}>
                  <h3 className="text-lg font-bold text-center mb-4" style={{ color: '#09006e' }}>
                    Part-Time (20 hrs/week)
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold mb-2" style={{ color: '#09006e' }}>
                      $950
                    </div>
                    <div className="text-sm" style={{ color: '#374151' }}>per month</div>
                  </div>
                  <div className="mt-6 space-y-2 text-sm" style={{ color: '#374151' }}>
                    <div className="flex justify-between">
                      <span>Weekly hours:</span>
                      <span className="font-medium">20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly hours:</span>
                      <span className="font-medium">~80</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hourly rate:</span>
                      <span className="font-medium">$11.88</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: '#09006e' }}>
                  <h3 className="text-lg font-bold text-center mb-4" style={{ color: '#09006e' }}>
                    Full-Time (40 hrs/week)
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold mb-2" style={{ color: '#09006e' }}>
                      $1,600
                    </div>
                    <div className="text-sm" style={{ color: '#374151' }}>per month</div>
                  </div>
                  <div className="mt-6 space-y-2 text-sm" style={{ color: '#374151' }}>
                    <div className="flex justify-between">
                      <span>Weekly hours:</span>
                      <span className="font-medium">40</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly hours:</span>
                      <span className="font-medium">~160</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hourly rate:</span>
                      <span className="font-medium">$10</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-2" style={{ borderColor: '#09006e' }}>
                  <h3 className="text-lg font-bold text-center mb-4" style={{ color: '#09006e' }}>
                    Extended (60 hrs/week)
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-extrabold mb-2" style={{ color: '#09006e' }}>
                      $2,400
                    </div>
                    <div className="text-sm" style={{ color: '#374151' }}>per month</div>
                  </div>
                  <div className="mt-6 space-y-2 text-sm" style={{ color: '#374151' }}>
                    <div className="flex justify-between">
                      <span>Weekly hours:</span>
                      <span className="font-medium">60</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly hours:</span>
                      <span className="font-medium">~240</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hourly rate:</span>
                      <span className="font-medium">$10</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-12 relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-gray-50 text-2xl font-bold" style={{ color: '#09006e' }}>
                    Compare to Traditional Hiring
                  </span>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* US Employee Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold">
                    Higher Cost
                  </div>
                  <div className="p-6 bg-gradient-to-br from-red-50 to-white">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mr-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">US Employee</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <BanknotesIcon className="h-5 w-5 text-gray-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Base Salary</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">$40,000-$50,000</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-gray-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Benefits & Taxes</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">+30-40%</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <HomeIcon className="h-5 w-5 text-gray-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Office & Equipment</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">$5,000-$10,000</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-red-800">Total Annual Cost:</span>
                        <span className="text-2xl font-bold text-red-600">$55,000-$70,000+</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* E-Systems VA Card */}
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-green-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg text-sm font-bold flex items-center">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    Best Value
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mr-3">
                        <UserIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">E-Systems VA</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <BanknotesIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Annual Cost</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">$19,200</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Benefits & Taxes</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">Included</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <ComputerDesktopIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Office & Equipment</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">Not Required</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-800">Total Annual Cost:</span>
                        <span className="text-2xl font-bold text-green-600">$19,200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Savings Highlight */}
              <div className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 shadow-2xl transform transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-white opacity-10"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white opacity-10"></div>
                
                <div className="relative text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white bg-opacity-20">
                      <CurrencyDollarIcon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Massive Annual Savings</h3>
                  <div className="flex justify-center items-center mb-4">
                    <span className="text-5xl font-extrabold text-white">$35,000-$50,000+</span>
                  </div>
                  <p className="text-xl text-green-100">Save per year with each E-Systems Virtual Assistant</p>
                  <div className="mt-6 flex justify-center">
                    <div className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-bold rounded-full shadow-lg">
                      <ChartBarIcon className="h-5 w-5 mr-2" />
                      That's 65-75% in annual savings!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold sm:text-4xl" style={{ color: '#09006e' }}>
                Pricing FAQs
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#09006e' }}>
                  Are there any setup fees or hidden costs?
                </h3>
                <p style={{ color: '#374151' }}>
                  No. The $10/hour rate is all-inclusive. There are no setup fees, recruitment fees, or hidden charges. You only pay for the hours your VA works.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#09006e' }}>
                  What is the minimum commitment?
                </h3>
                <p style={{ color: '#374151' }}>
                  We work on month-to-month agreements with no long-term lock-in. You can adjust hours with two weeks notice or hire additional VAs at any time. Our flexible model grows with your business needs.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#09006e' }}>
                  How do I track hours worked?
                </h3>
                <p style={{ color: '#374151' }}>
                  We provide optional time tracking and detailed activity reports. You'll receive weekly summaries and can request additional reporting as needed.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#09006e' }}>
                  When do I get invoiced?
                </h3>
                <p style={{ color: '#374151' }}>
                  Invoices are sent bi-weekly or monthly based on your preference. Payment terms are net 15 days via bank transfer, credit card, or PayPal.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#09006e' }}>
                  Can I scale up or down?
                </h3>
                <p style={{ color: '#374151' }}>
                  Yes. You can adjust hours with two weeks notice or hire additional VAs at any time. Our flexible model grows with your business needs.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#09006e' }}>
                  What if I'm not satisfied?
                </h3>
                <p style={{ color: '#374151' }}>
                  We offer a 30-day replacement guarantee. If your VA isn't the right fit within the first 30 days, we'll provide a replacement at no additional cost.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ backgroundColor: '#09006e' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-xl text-gray-200">
                Join businesses already saving thousands with E Systems virtual assistants.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-lg text-white bg-transparent hover:bg-white transition-colors duration-200"
                  style={{
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#09006e';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'white';
                  }}
                >
                  Get Your VA Today
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/how-it-works"
                  style={{ backgroundColor: '#ef8f00' }}
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white transition-colors duration-200"
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#cc7a00'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef8f00'}
                >
                  See How It Works
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-300">
                Questions? Contact us at <a href="mailto:info@esystems.com" className="underline hover:text-white">info@esystems.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}