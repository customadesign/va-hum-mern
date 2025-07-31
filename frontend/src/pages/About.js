import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';

export default function About() {
  const { branding } = useBranding();
  
  return (
    <>
      <Helmet>
        <title>About - {branding.name}</title>
      </Helmet>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-gray-600 tracking-wide uppercase">About</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              {branding.name}
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Operated by Linkage Web Solutions
            </p>
          </div>

          <div className="mt-12 prose prose-lg text-gray-500 mx-auto">
            {branding.isESystemsMode ? (
              <>
                <p>
                  E-Systems Management is operated by Linkage Web Solutions, helping businesses build 
                  exceptional remote teams with pre-screened professionals from the Philippines.
                </p>

                <h3>Our Mission</h3>
                <p>
                  We streamline the process of finding and hiring skilled professionals for your business. 
                  Our platform connects you with talented individuals who are ready to become valuable 
                  members of your team.
                </p>

                <h3>What We Offer Employers</h3>
                <ul>
                  <li>Pre-screened professionals ready to join your team</li>
                  <li>Direct communication with candidates</li>
                  <li>Detailed profiles showcasing skills and experience</li>
                  <li>Efficient hiring process</li>
                  <li>Cost-effective staffing solutions</li>
                </ul>

                <h3>Why Hire Filipino Professionals?</h3>
                <p>
                  The Philippines offers a deep talent pool of skilled professionals who excel in:
                </p>
                <ul>
                  <li>Excellent English communication</li>
                  <li>Strong work ethic and reliability</li>
                  <li>Cultural alignment with Western business practices</li>
                  <li>Technical skills across various industries</li>
                  <li>Flexibility and adaptability</li>
                </ul>

                <h3>Build Your Team</h3>
                <p>
                  E-Systems Management makes it easy to find the right professionals for your business needs. 
                  Start building your dream team today with our curated selection of skilled candidates.
                </p>
              </>
            ) : (
              <>
                <p>
                  Linkage VA Hub is operated by Linkage Web Solutions, connecting talented Filipino virtual assistants 
                  with permanent contract opportunities through our trusted network of employers.
                </p>

                <h3>Our Mission</h3>
                <p>
                  We believe in creating meaningful connections between skilled virtual assistants and businesses 
                  that value their expertise. Our platform is designed to make the hiring process seamless, 
                  transparent, and beneficial for both parties.
                </p>

                <h3>What We Offer</h3>
                <ul>
                  <li>Access to pre-screened, skilled Filipino virtual assistants</li>
                  <li>Direct communication between VAs and businesses</li>
                  <li>Transparent profiles showcasing skills and experience</li>
                  <li>Secure messaging system</li>
                  <li>Fair and competitive rates</li>
                </ul>

                <h3>Why Choose Filipino VAs?</h3>
                <p>
                  The Philippines has emerged as a global leader in virtual assistance, offering:
                </p>
                <ul>
                  <li>Excellent English communication skills</li>
                  <li>Strong work ethic and dedication</li>
                  <li>Cultural compatibility with Western businesses</li>
                  <li>Cost-effective solutions without compromising quality</li>
                  <li>Diverse skill sets across various industries</li>
                </ul>

                <h3>Get Started</h3>
                <p>
                  Whether you're a business looking for talented virtual assistants or a VA seeking new opportunities, 
                  Linkage VA Hub is here to help you succeed. Join our growing community today.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}