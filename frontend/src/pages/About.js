import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function About() {
  const { branding, loading: brandingLoading } = useBranding();
  
  // Scroll to top when the page loads
  useScrollToTop();
  
  // Show loading spinner while branding context is loading
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
        <title>About - {branding.name}</title>
      </Helmet>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">About {branding.name}</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-8">
                {branding.isESystemsMode 
                  ? 'E-Systems is a leading platform that connects businesses with skilled professionals from the Philippines. We provide comprehensive solutions for companies looking to build their remote teams with top talent.'
                  : 'Linkage VA Hub is a premier platform that connects businesses with talented Filipino virtual assistants. We bridge the gap between companies seeking reliable remote support and skilled professionals looking for meaningful opportunities.'}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-600">
                  {branding.isESystemsMode 
                    ? 'To empower businesses by providing access to world-class talent from the Philippines while creating meaningful career opportunities for skilled professionals.'
                    : 'To connect businesses with exceptional virtual assistants while providing Filipinos with dignified, well-paying remote work opportunities.'}
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Do</h2>
                <p className="text-gray-600 mb-4">
                  {branding.isESystemsMode 
                    ? 'We specialize in matching businesses with skilled professionals across various fields including IT, customer service, administrative support, and specialized technical roles.'
                    : 'We specialize in connecting businesses with talented virtual assistants who can handle a wide range of tasks including administrative support, customer service, social media management, and more.'}
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Thorough vetting of all {branding.isESystemsMode ? 'professionals' : 'virtual assistants'}</li>
                  <li>Personalized matching based on business needs</li>
                  <li>Ongoing support and training</li>
                  <li>Quality assurance and performance monitoring</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Us</h2>
                <p className="text-gray-600 mb-4">
                  {branding.isESystemsMode 
                    ? 'We understand the unique needs of businesses and the strengths of Filipino professionals. Our platform ensures perfect matches that drive success.'
                    : 'We understand the unique needs of businesses and the exceptional qualities of Filipino virtual assistants. Our platform ensures perfect matches that drive success for both parties.'}
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Access to pre-screened, {branding.isESystemsMode ? 'highly skilled' : 'talented'} professionals</li>
                  <li>Competitive {branding.isESystemsMode ? 'rates' : 'pricing'} without compromising quality</li>
                  <li>Dedicated support throughout the engagement</li>
                  <li>Flexible engagement models to suit your needs</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-600">
                  Ready to transform your business with {branding.isESystemsMode ? 'top-tier talent' : 'exceptional virtual assistants'}? 
                  Get in touch with us today to learn more about how we can help you achieve your goals.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}