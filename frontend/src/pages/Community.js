import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import {
  AcademicCapIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon,
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const learningPaths = [
  {
    id: 'web-development',
    title: 'Web Development',
    description: 'Master modern web technologies including HTML, CSS, JavaScript, React, and more.',
    icon: CodeBracketIcon,
    color: 'bg-blue-500',
    skills: ['HTML & CSS', 'JavaScript', 'React/Vue', 'WordPress', 'Web Design', 'Responsive Design'],
    resources: 'videos',
    level: 'Beginner to Advanced'
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design',
    description: 'Create stunning visuals, logos, and marketing materials using industry-standard tools.',
    icon: PaintBrushIcon,
    color: 'bg-purple-500',
    skills: ['Adobe Photoshop', 'Canva', 'Figma', 'Logo Design', 'Brand Identity', 'Social Media Graphics'],
    resources: 'tutorials',
    level: 'All Levels'
  },
  {
    id: 'social-media',
    title: 'Social Media Management',
    description: 'Learn to grow brands on social media, create engaging content, and analyze performance.',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-pink-500',
    skills: ['Content Strategy', 'Community Management', 'Analytics', 'Paid Advertising', 'Content Creation', 'Scheduling Tools'],
    resources: 'guides',
    level: 'Beginner Friendly'
  },
  {
    id: 'email-marketing',
    title: 'Email Marketing',
    description: 'Build email campaigns that convert, from design to automation and analytics.',
    icon: EnvelopeIcon,
    color: 'bg-green-500',
    skills: ['Email Design', 'Copywriting', 'Automation', 'A/B Testing', 'List Building', 'Campaign Analytics'],
    resources: 'templates',
    level: 'Intermediate'
  },
  {
    id: 'ai-tools',
    title: 'AI & Automation',
    description: 'Leverage AI tools to enhance productivity and deliver better results for clients.',
    icon: SparklesIcon,
    color: 'bg-indigo-500',
    skills: ['ChatGPT', 'AI Writing', 'Image Generation', 'Automation Tools', 'AI Analytics', 'Prompt Engineering'],
    resources: 'workshops',
    level: 'Trending'
  },
  {
    id: 'client-relations',
    title: 'Client Relations',
    description: 'Build lasting client relationships, manage projects effectively, and grow your VA business.',
    icon: UserGroupIcon,
    color: 'bg-yellow-500',
    skills: ['Communication', 'Project Management', 'Time Tracking', 'Invoicing', 'Client Onboarding', 'Retention Strategies'],
    resources: 'courses',
    level: 'Essential Skills'
  }
];

const features = [
  {
    title: 'Free Forever',
    description: 'Access all learning resources without any cost. We believe in empowering VAs worldwide.',
    icon: CheckCircleIcon
  },
  {
    title: 'Expert-Led Content',
    description: 'Learn from experienced VAs and industry professionals who share real-world insights.',
    icon: AcademicCapIcon
  },
  {
    title: 'Community Support',
    description: 'Connect with fellow VAs, ask questions, and share your journey with our supportive community.',
    icon: UserGroupIcon
  },
  {
    title: 'Practical Skills',
    description: 'Focus on skills that clients actually need, with hands-on projects and real examples.',
    icon: BookOpenIcon
  }
];

const resourceTypes = [
  { icon: VideoCameraIcon, label: 'Video Tutorials', count: '500+' },
  { icon: DocumentTextIcon, label: 'Written Guides', count: '200+' },
  { icon: BookOpenIcon, label: 'Case Studies', count: '50+' },
  { icon: UserGroupIcon, label: 'Community Members', count: '10k+' }
];

export default function Community() {
  const { branding } = useBranding();

  // Redirect to home if in E-systems mode
  if (branding.isESystemsMode) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Community - Free VA Learning Hub | {branding.name}</title>
        <meta name="description" content="Join our free community to learn web development, graphic design, social media, email marketing, AI tools, and client relations skills for Virtual Assistants." />
      </Helmet>

      <div className="bg-white">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Free VA Learning Community
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join thousands of Virtual Assistants learning in-demand skills to grow their careers. 
              Access free resources on web development, design, marketing, AI, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700"
              >
                Join Community Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#learning-paths"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Explore Learning Paths
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {resourceTypes.map((type) => (
                <div key={type.label} className="text-center">
                  <type.icon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{type.count}</div>
                  <div className="text-sm text-gray-500">{type.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <feature.icon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Paths */}
        <div id="learning-paths" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Learning Path
              </h2>
              <p className="text-lg text-gray-600">
                Develop skills that clients are actively looking for. Each path includes free resources to get you started.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {learningPaths.map((path) => (
                <div
                  key={path.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className={`h-2 ${path.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg ${path.color} bg-opacity-10`}>
                        <path.icon className={`h-6 w-6 ${path.color.replace('bg-', 'text-')}`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-500 uppercase">
                        {path.level}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {path.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {path.description}
                    </p>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Skills you'll learn:</h4>
                      <div className="flex flex-wrap gap-2">
                        {path.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                      Start Learning
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Level Up Your VA Skills?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Join our community today and get instant access to all learning resources. 
                No credit card required, free forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100"
                >
                  Create Free Account
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-white hover:border-gray-500"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <blockquote className="text-xl text-gray-600 italic mb-4">
              "This community transformed my VA career. I learned web development skills 
              that helped me triple my rates and work with amazing clients worldwide."
            </blockquote>
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-gray-300 mr-4"></div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Maria Santos</div>
                <div className="text-sm text-gray-500">Full-Stack VA, Philippines</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}