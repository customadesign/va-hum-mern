import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useBranding } from '../contexts/BrandingContext';

export default function HowItWorks() {
  const { branding, loading: brandingLoading } = useBranding();
  const navigate = useNavigate();

  const handleGetMatchedClick = () => {
    navigate('/sign-up');
  };

  const benefits = [
    {
      title: 'Fast Matching',
      description: 'Get matched with qualified candidates in 48-72 hours',
      icon: BoltIcon
    },
    {
      title: '14-Day Onboarding',
      description: 'Fully onboarded team members ready to contribute',
      icon: ClockIcon
    },
    {
      title: '30-Day Guarantee',
      description: 'Free replacement if not a perfect fit',
      icon: ShieldCheckIcon
    },
    {
      title: 'Ongoing Support',
      description: 'Dedicated success manager and continuous training',
      icon: UserGroupIcon
    }
  ];

  const roles = [
    "Executive Virtual Assistants",
    "Customer Service Representatives",
    "Sales Development Representatives",
    "Bookkeepers & Accountants",
    "Social Media Managers",
    "Content Writers & Editors",
    "Graphic Designers",
    "Project Managers",
    "Data Entry Specialists",
    "Technical Support Agents",
    "Marketing Assistants",
    "E-commerce Specialists"
  ];

  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const steps = [
    {
      number: "01",
      title: "Discovery Call",
      description: "We start with a 30-minute consultation to understand your business needs, role requirements, and success criteria.",
      details: "Our success manager will map out your ideal VA profile, including skills, experience level, and time zone preferences.",
      nextStep: "Within 24 hours, we'll send you a detailed role profile for approval."
    },
    {
      number: "02",
      title: "Role Scoping & Success Criteria",
      description: "We define specific responsibilities, deliverables, and performance metrics for your virtual assistant role.",
      details: "This includes tool access requirements, communication preferences, and clear success benchmarks.",
      nextStep: "Our team begins sourcing candidates from our vetted talent pool immediately."
    },
    {
      number: "03",
      title: "Curated Shortlist Delivery",
      description: "Receive 3-5 pre-screened candidates with detailed profiles, work samples, and skill assessments.",
      details: "Each candidate has been vetted for English proficiency, technical skills, and cultural fit.",
      nextStep: "Schedule interviews or request trial tasks to evaluate your top candidates."
    },
    {
      number: "04",
      title: "Interviews & Selection",
      description: "Conduct video interviews or assign trial tasks to identify your perfect match.",
      details: "We provide interview guides and evaluation frameworks to streamline your decision process.",
      nextStep: "Confirm your selection and we'll prepare the engagement agreement."
    },
    {
      number: "05",
      title: "Agreement & Onboarding Setup",
      description: "Finalize terms, sign agreements, and configure secure access to your tools and systems.",
      details: "We handle NDAs, background checks, and technical setup while ensuring data security compliance.",
      nextStep: "Your VA begins their onboarding process with our team."
    },
    {
      number: "06",
      title: "Kickoff with Success Manager",
      description: "Join a three-way kickoff call to align expectations, review processes, and establish communication norms.",
      details: "We'll set up reporting cadences, KPI tracking, and escalation procedures for ongoing success.",
      nextStep: "Your VA starts delivering results with full support from our team."
    },
    {
      number: "07",
      title: "First 30 Days & Calibration",
      description: "Regular check-ins ensure optimal performance and address any adjustments needed.",
      details: "Weekly reviews for the first month help fine-tune processes and maximize productivity.",
      nextStep: "Transition to monthly reviews as your VA becomes fully integrated."
    }
  ];

  const timeline = [
    { days: "Day 0-2", activity: "Discovery call and role profiling" },
    { days: "Day 3-5", activity: "Candidate sourcing and shortlist delivery" },
    { days: "Day 6-8", activity: "Interviews and candidate selection" },
    { days: "Day 9-11", activity: "Agreements and technical onboarding" },
    { days: "Day 12-14", activity: "Kickoff and first deliverables" }
  ];

  const faqs = [
    {
      question: "How quickly can I start working with a virtual assistant?",
      answer: "Most clients start within 14 days. Fast-track options are available for urgent roles, potentially reducing this to 7-10 days depending on requirements and candidate availability."
    },
    {
      question: "What time zones do your VAs work in?",
      answer: "Our VAs primarily work in Philippine time zones (PHT/GMT+8) and can accommodate US business hours through flexible scheduling. We ensure overlap with your preferred working hours."
    },
    {
      question: "How do you ensure English proficiency?",
      answer: "All VAs undergo rigorous English assessments including written, verbal, and comprehension tests. Most hold college degrees and have professional experience working with international clients."
    },
    {
      question: "What about data security and tool access?",
      answer: "We implement secure access protocols, conduct background checks, and require signed NDAs. Your VA receives training on data protection and compliance with your security requirements."
    },
    {
      question: "What if my VA isn't the right fit?",
      answer: "We offer a replacement guarantee. If you're not satisfied within the first 30 days, we'll provide a new candidate at no additional cost and work to find the perfect match."
    },
    {
      question: "How do you handle communication and reporting?",
      answer: "VAs provide daily updates, weekly reports, and attend regular check-ins. Communication happens through your preferred channels - Slack, email, video calls, or project management tools."
    },
    {
      question: "What are the contract terms and cancellation policy?",
      answer: "We offer flexible month-to-month agreements with 30-day notice for cancellation. No long-term commitments required, and you can scale hours up or down as needed."
    },
    {
      question: "How do you track and measure performance?",
      answer: "We establish clear KPIs during onboarding and provide regular performance reports. Our success managers monitor progress and help optimize productivity."
    },
    {
      question: "What types of tasks can VAs handle?",
      answer: "Our VAs excel at administrative support, digital marketing, customer service, data management, research, content creation, and specialized technical tasks based on their expertise."
    },
    {
      question: "How is E Systems different from freelance marketplaces?",
      answer: "Unlike marketplaces, we provide end-to-end management, ongoing support, quality assurance, and replacement guarantees. You get dedicated partnership, not just candidate placement."
    }
  ];

  return (
    <>
      <Helmet>
        <title>How It Works - Start with a VA in 14 Days | E Systems</title>
        <meta name="description" content="Learn how E Systems helps you find, onboard, and start working with a dedicated virtual assistant in just two weeks. Streamlined process, vetted talent." />
        <meta property="og:title" content="How It Works - Start with a VA in 14 Days | E Systems" />
        <meta property="og:description" content="Learn how E Systems helps you find, onboard, and start working with a dedicated virtual assistant in just two weeks. Streamlined process, vetted talent." />
        <meta property="og:url" content="https://esystems.com/how-it-works" />
        <link rel="canonical" href="https://esystems.com/how-it-works" />
      </Helmet>

      <div className="bg-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: '#09006e' }}>
                Start Working with Your Virtual Assistant in 14 Days
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-700">
                Our streamlined process connects you with pre-vetted, skilled virtual assistants who are ready to make an immediate impact on your business. From discovery to delivery in two weeks.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors duration-200"
                  style={{ backgroundColor: '#ef8f00' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#cc7a00'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef8f00'}
                >
                  Get Started With A VA
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-8 py-3 border text-base font-medium rounded-lg bg-white transition-colors duration-200"
                  style={{ borderColor: '#09006e', color: '#09006e' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#f0f9ff'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'white'; }}
                >
                  View Pricing
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-700">
                Vetted talent • Time zone aligned • Secure data handling • 30-day replacement guarantee
              </p>
            </div>
          </div>
        </div>

        {/* Process Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                The fast, simple path to your VA
              </h2>
            </div>
            <div className="mt-12">
              <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
                {steps.map((step, stepIdx) => (
                  <div key={step.number} className="relative">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <div style={{ backgroundColor: '#09006e' }} className="flex items-center justify-center h-12 w-12 rounded-md text-white">
                          <span className="text-lg font-bold">{step.number}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 style={{ color: '#09006e' }} className="text-xl font-medium">
                          Step {step.number} — {step.title}
                        </h3>
                        <p style={{ color: '#374151' }} className="mt-2 text-base">
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
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                Why E-Systems VA beats job boards and groups
              </h2>
              <p style={{ color: '#374151' }} className="mt-4 max-w-3xl mx-auto text-xl">
                Job boards and informal groups make you do all the heavy lifting: writing ads, filtering hundreds of applicants, validating skills, chasing references, and hoping the person you pick shows up consistently. Hidden costs pile up in churn, delays, and mis-hires. E-Systems VA is a real agency with legal, operational, and training infrastructure built to remove that burden and deliver predictable outcomes. Our model shortens time-to-hire from weeks to days, reduces risk with proven vetting and guarantees, and improves results through ongoing management and quality assurance. Instead of gambling on resumes, you get a partner accountable for outcomes.
              </p>
            </div>
            <div className="mt-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="text-center">
                    <div style={{ backgroundColor: '#09006e' }} className="flex items-center justify-center h-12 w-12 mx-auto rounded-md text-white">
                      <benefit.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 style={{ color: '#09006e' }} className="mt-4 text-lg font-medium">{benefit.title}</h3>
                    <p style={{ color: '#374151' }} className="mt-2 text-base">{benefit.description}</p>
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
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                A real agency with real infrastructure
              </h2>
              <p style={{ color: '#374151' }} className="mt-4 max-w-3xl mx-auto text-xl">
                We are a legally established corporation with proper contracts, invoicing, and compliance. We standardize hiring with validated assessments and structured interviews. We develop talent through an internal training academy focused on tools, SOPs, communication, and productivity. We manage delivery with success managers, performance scorecards, and regular check-ins. We protect your business with NDAs, access and data hygiene practices, and clear escalation paths. You are not just hiring a person—you are gaining a team and system that stands behind the work.
              </p>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                What you get with every placement
              </h2>
              <p style={{ color: '#374151' }} className="mt-4 max-w-3xl mx-auto text-xl">
                You receive curated shortlists matched to your exact requirements and time zone. You get a 30‑day free replacement guarantee if it's not a fit. You gain a dedicated success manager, structured onboarding, SOP templates, and role scorecards. You have optional time tracking and weekly performance reporting. You benefit from proactive coaching and ongoing skill development for your VA. You operate with clear SLAs, secure access practices, and documented processes that make outcomes repeatable.
              </p>
            </div>
          </div>
        </div>

        {/* Roles Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                Roles we staff effectively
              </h2>
              <p style={{ color: '#374151' }} className="mt-4 max-w-3xl mx-auto text-xl">
                We routinely place:
              </p>
            </div>
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role, idx) => (
                  <div key={idx} className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span style={{ color: '#374151' }} className="text-base">{role}</span>
                  </div>
                ))}
              </div>
              <p style={{ color: '#374151' }} className="mt-6 text-center text-base">
                If you need a function not listed here, ask us and we will confirm feasibility.
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gray-50 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                Results you can expect
              </h2>
              <p style={{ color: '#374151' }} className="mt-4 max-w-3xl mx-auto text-xl">
                Most clients meet qualified candidates in 48–72 hours and fully onboard in under two weeks. Clients report greater consistency, faster cycle times on routine tasks, and a measurable reduction in owner task load. With management and training built in, performance improves over time rather than degrading after the first month.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 style={{ color: '#09006e' }} className="text-3xl font-extrabold sm:text-4xl">
                FAQs
              </h2>
            </div>
            <div className="mt-12 max-w-3xl mx-auto">
              <dl className="space-y-8">
                {faqs.map((faq, idx) => (
                  <div key={idx}>
                    <dt style={{ color: '#09006e' }} className="text-lg font-medium">
                      {faq.question}
                    </dt>
                    <dd style={{ color: '#374151' }} className="mt-2 text-base">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div style={{ backgroundColor: '#09006e' }}>
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
                  style={{ backgroundColor: '#ef8f00' }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-orange-500 transition-colors duration-200"
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#cc7a00'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef8f00'}
                >
                  Get Started With A VA
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