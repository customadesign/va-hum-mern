import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About - Linkage VA Hub</title>
      </Helmet>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-gray-600 tracking-wide uppercase">About</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Linkage VA Hub
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Operated by Linkage Web Solutions
            </p>
          </div>

          <div className="mt-12 prose prose-lg text-gray-500 mx-auto">
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
          </div>
        </div>
      </div>
    </>
  );
}