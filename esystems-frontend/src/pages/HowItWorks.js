import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, ArrowRightIcon, UserGroupIcon, ClockIcon, ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HowItWorks() {
  const { branding, loading: brandingLoading } = useBranding();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Show loading spinner while branding context is loading
  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Handle button click with conditional navigation
  const handleGetMatchedClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/sign-up');
    }
  };

  const steps = [
    {
      number: '1',
      title: 'Tell us what you need',
      description: 'Share your goals, budget, tools, timezone, and success criteria. A specialist clarifies scope and recommends the right profile for your business.'
    },
    {
      number: '2',
      title: 'We source, test, and vet',
      description: 'We run skills assessments, structured interviews, reference checks, background checks as appropriate, and communication screenings. Candidates are evaluated for role fit, reliability, professionalism, and culture match.'
    },
    {
      number: '3',
      title: 'Meet your top matches',
      description: 'Within 48–72 hours you receive a curated shortlist. We coordinate interviews, collect feedback, and refine until you have a clear best-fit choice.'
    },
    {
      number: '4',
      title: 'Onboard with confidence',
      description: 'We handle contracts, NDAs, and setup. You get a structured onboarding checklist, documented SOPs, and a success plan. Your dedicated success manager monitors performance and supports both you and your VA long-term.'
    }
  ];

  const benefits = [
    {
      icon: ClockIcon,
      title: 'Faster Hiring',
      description: 'Time-to-hire shortened from weeks to days'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Reduced Risk',
      description: 'Proven vetting and performance guarantees'
    },
    {
      icon: ChartBarIcon,
      title: 'Better Results',
      description: 'Ongoing management and quality assurance'
    },
    {
      icon: UserGroupIcon,
      title: 'Real Support',
      description: 'Dedicated team accountable for outcomes'
    }
  ];

  const roles = [
    'Executive assistants',
    'Operations coordinators',
    'Customer support specialists',
    'Marketing assistants',
    'Social media managers',
    'Content and podcast assistants',
    'E-commerce support',
    'Appointment setters',
    'Lead gen specialists'
  ];

  const faqs = [
    {
      question: 'How fast can I hire?',
      answer: 'Typically you receive top matches within 48–72 hours after your intake call and can onboard in under two weeks, depending on role complexity and your interview availability.'
    },
    {
      question: 'What does it cost?',
      answer: 'Pricing depends on role, seniority, and schedule. We propose a transparent monthly rate during your discovery call and there are no hidden platform fees.'
    },
    {
      question: 'What time zones do VAs support?',
      answer: 'We place talent across regions and can align with your primary time zone or establish overlap windows to fit your schedule.'
    },
    {
      question: 'What if it\'s not a fit?',
      answer: 'We offer a 30‑day free replacement guarantee. Your success manager will refine the profile and present a new shortlist quickly.'
    },
    {
      question: 'How do you ensure quality and security?',
      answer: 'Candidates pass skills tests, structured interviews, and reference checks. We use NDAs, role‑based access, data hygiene practices, and can support tool-based security measures.'
    },
    {
      question: 'Can you work with my tools and SOPs?',
      answer: 'Yes. We integrate with your stack and provide SOP support or templates if you are still formalizing processes.'
    }
  ];

  // JSON-LD structured data for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>How E-Systems VA Works - {branding.name}</title>
        <meta name="description" content="Hire a high-caliber Virtual Assistant the easy way. E-Systems VA Hub is a real agency with vetted talent, training, and ongoing management—faster hiring, lower risk, and better outcomes than job boards." />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="bg-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
            <div className="text-center">
              <h1 style={{ color: branding.primaryColor }} className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">
                Hire a high‑caliber Virtual Assistant, the easy way
              </h1>
              <p style={{ color: branding.textColor }} className="mt-6 max-w-3xl mx-auto text-xl">
                E-Systems VA Hub streamlines hiring by combining expert sourcing, rigorous vetting, structured training, and ongoing management. You get an exceptional VA ready to deliver, without the risk and time sink of job boards or random groups.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetMatchedClick}
                  style={{ backgroundColor: branding.accentColor }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Get matched with a VA
                  <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Process Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                The fast, simple path to your VA
              </h2>
            </div>
            <div className="mt-12">
              <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
                {steps.map((step, stepIdx) => (
                  <div key={step.number} className="relative">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div style={{ backgroundColor: branding.primaryColor }} className="flex items-center justify-center h-12 w-12 rounded-md text-white">
                          <span className="text-lg font-bold">{step.number}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 style={{ color: branding.primaryColor }} className="text-xl font-medium">
                          Step {step.number} — {step.title}
                        </h3>
                        <p style={{ color: branding.textColor }} className="mt-2 text-base">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why Linkage VA Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                Why E-Systems VA beats job boards and groups
              </h2>
              <p style={{ color: branding.textColor }} className="mt-4 max-w-3xl mx-auto text-xl">
                Job boards and informal groups make you do all the heavy lifting: writing ads, filtering hundreds of applicants, validating skills, chasing references, and hoping the person you pick shows up consistently. Hidden costs pile up in churn, delays, and mis-hires. E-Systems VA is a real agency with legal, operational, and training infrastructure built to remove that burden and deliver predictable outcomes. Our model shortens time-to-hire from weeks to days, reduces risk with proven vetting and guarantees, and improves results through ongoing management and quality assurance. Instead of gambling on resumes, you get a partner accountable for outcomes.
              </p>
            </div>
            <div className="mt-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="text-center">
                    <div style={{ backgroundColor: branding.primaryColor }} className="flex items-center justify-center h-12 w-12 mx-auto rounded-md text-white">
                      <benefit.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 style={{ color: branding.primaryColor }} className="mt-4 text-lg font-medium">{benefit.title}</h3>
                    <p style={{ color: branding.textColor }} className="mt-2 text-base">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real Agency Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                A real agency with real infrastructure
              </h2>
              <p style={{ color: branding.textColor }} className="mt-4 max-w-3xl mx-auto text-xl">
                We are a legally established corporation with proper contracts, invoicing, and compliance. We standardize hiring with validated assessments and structured interviews. We develop talent through an internal training academy focused on tools, SOPs, communication, and productivity. We manage delivery with success managers, performance scorecards, and regular check-ins. We protect your business with NDAs, access and data hygiene practices, and clear escalation paths. You are not just hiring a person—you are gaining a team and system that stands behind the work.
              </p>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                What you get with every placement
              </h2>
              <p style={{ color: branding.textColor }} className="mt-4 max-w-3xl mx-auto text-xl">
                You receive curated shortlists matched to your exact requirements and time zone. You get a 30‑day free replacement guarantee if it's not a fit. You gain a dedicated success manager, structured onboarding, SOP templates, and role scorecards. You have optional time tracking and weekly performance reporting. You benefit from proactive coaching and ongoing skill development for your VA. You operate with clear SLAs, secure access practices, and documented processes that make outcomes repeatable.
              </p>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                Roles we staff effectively
              </h2>
              <p style={{ color: branding.textColor }} className="mt-4 max-w-3xl mx-auto text-xl">
                We routinely place:
              </p>
            </div>
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span style={{ color: branding.textColor }} className="text-base">{role}</span>
                  </div>
                ))}
              </div>
              <p style={{ color: branding.textColor }} className="mt-6 text-center text-base">
                If you need a function not listed here, ask us and we will confirm feasibility.
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                Results you can expect
              </h2>
              <p style={{ color: branding.textColor }} className="mt-4 max-w-3xl mx-auto text-xl">
                Most clients meet qualified candidates in 48–72 hours and fully onboard in under two weeks. Clients report greater consistency, faster cycle times on routine tasks, and a measurable reduction in owner task load. With management and training built in, performance improves over time rather than degrading after the first month.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: branding.primaryColor }} className="text-3xl font-extrabold sm:text-4xl">
                FAQs
              </h2>
            </div>
            <div className="mt-12 max-w-3xl mx-auto">
              <dl className="space-y-8">
                {faqs.map((faq, idx) => (
                  <div key={idx}>
                    <dt style={{ color: branding.primaryColor }} className="text-lg font-medium">
                      {faq.question}
                    </dt>
                    <dd style={{ color: branding.textColor }} className="mt-2 text-base">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div style={{ backgroundColor: branding.primaryColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to build your team?
              </h2>
              <p className="mt-4 text-xl text-gray-300">
                Start working with exceptional Virtual Assistants today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetMatchedClick}
                  style={{ backgroundColor: branding.accentColor }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-orange-500"
                >
                  Get matched with a VA
                  <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}