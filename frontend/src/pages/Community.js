import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import LessonViewer from '../components/LessonViewer';
import QuickSkillModal from '../components/QuickSkillModal';
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
  CheckCircleIcon,
  PlayIcon,
  ClockIcon,
  CalendarDaysIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  BoltIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, FireIcon as FireIconSolid } from '@heroicons/react/24/solid';

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

// Interactive Learning Center Data (for logged in users)
const currentTutorials = [
  {
    id: 1,
    title: 'Advanced Social Media Analytics with AI',
    instructor: {
      name: 'Sarah Martinez',
      title: 'Social Media Expert',
      avatar: null,
      rating: 4.8,
      students: 2340
    },
    duration: '45 min',
    difficulty: 'Intermediate',
    category: 'Social Media',
    thumbnail: null,
    progress: 0,
    isNew: true,
    description: 'Learn how to use AI tools to analyze social media performance and create data-driven strategies.',
    tags: ['Analytics', 'AI', 'Strategy'],
    chapters: [
      { id: 1, title: 'Introduction to AI Analytics', time: '0:00', duration: '5:42', completed: true },
      { id: 2, title: 'Setting Up Your Analytics Dashboard', time: '5:42', duration: '8:15', completed: true },
      { id: 3, title: 'Understanding Key Metrics', time: '13:57', duration: '10:30', completed: false },
      { id: 4, title: 'AI-Powered Insights', time: '24:27', duration: '12:18', completed: false },
      { id: 5, title: 'Creating Reports & Action Plans', time: '36:45', duration: '8:15', completed: false }
    ],
    resources: [
      { id: 1, title: 'Analytics Dashboard Template', type: 'xlsx', size: '2.3 MB' },
      { id: 2, title: 'AI Tools Comparison Guide', type: 'pdf', size: '1.5 MB' }
    ],
    transcript: [
      { time: '0:00', text: 'Welcome to this comprehensive guide on using AI for social media analytics...' },
      { time: '0:30', text: 'By the end of this lesson, you\'ll be able to leverage AI tools to provide deeper insights...' }
    ],
    relatedLessons: [
      { id: 2, title: 'Content Strategy with ChatGPT', duration: '32 min' },
      { id: 3, title: 'Automated Social Media Scheduling', duration: '28 min' }
    ],
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What is the primary benefit of AI in social media analytics?',
          options: ['Faster data processing', 'Pattern recognition', 'Predictive insights', 'All of the above'],
          correct: 3
        }
      ]
    }
  },
  {
    id: 2,
    title: 'Client Communication Mastery',
    instructor: {
      name: 'David Chen',
      title: 'Communication Expert',
      avatar: null,
      rating: 4.7,
      students: 1850
    },
    duration: '35 min',
    difficulty: 'Beginner',
    category: 'Client Relations',
    thumbnail: null,
    progress: 65,
    isNew: false,
    description: 'Master the art of professional communication with clients to build stronger relationships.',
    tags: ['Communication', 'Clients', 'Professional'],
    chapters: [
      { id: 1, title: 'Communication Fundamentals', time: '0:00', duration: '8:00', completed: true },
      { id: 2, title: 'Active Listening Techniques', time: '8:00', duration: '12:00', completed: true },
      { id: 3, title: 'Managing Difficult Conversations', time: '20:00', duration: '15:00', completed: false }
    ],
    resources: [
      { id: 1, title: 'Communication Templates', type: 'pdf', size: '1.1 MB' }
    ],
    transcript: [
      { time: '0:00', text: 'Welcome to Client Communication Mastery...' }
    ],
    relatedLessons: [],
    quiz: { questions: [] }
  },
  {
    id: 3,
    title: 'WordPress Speed Optimization',
    instructor: {
      name: 'Emma Rodriguez',
      title: 'WordPress Developer',
      avatar: null,
      rating: 4.9,
      students: 3200
    },
    duration: '60 min',
    difficulty: 'Advanced',
    category: 'Web Development',
    thumbnail: null,
    progress: 30,
    isNew: false,
    description: 'Technical deep-dive into optimizing WordPress sites for maximum performance.',
    tags: ['WordPress', 'Performance', 'Technical'],
    chapters: [
      { id: 1, title: 'Performance Fundamentals', time: '0:00', duration: '15:00', completed: true },
      { id: 2, title: 'Caching Strategies', time: '15:00', duration: '20:00', completed: false },
      { id: 3, title: 'Database Optimization', time: '35:00', duration: '25:00', completed: false }
    ],
    resources: [
      { id: 1, title: 'Performance Checklist', type: 'pdf', size: '800 KB' }
    ],
    transcript: [
      { time: '0:00', text: 'Welcome to WordPress Speed Optimization...' }
    ],
    relatedLessons: [],
    quiz: { questions: [] }
  }
];

const upcomingTrainings = [
  {
    id: 1,
    title: 'Live Q&A: Building Your VA Business',
    instructor: 'Maria Santos',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    time: '2:00 PM EST',
    attendees: 247,
    description: 'Join our expert panel for a live discussion on scaling your virtual assistant business.'
  },
  {
    id: 2,
    title: 'Hands-on Workshop: Canva Design Mastery',
    instructor: 'Alex Thompson',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    time: '11:00 AM EST',
    attendees: 189,
    description: 'Interactive workshop covering advanced Canva techniques for professional designs.'
  }
];

const achievements = [
  { id: 1, title: 'First Tutorial Complete', icon: CheckCircleIconSolid, unlocked: true },
  { id: 2, title: 'Week Streak', icon: FireIconSolid, unlocked: true },
  { id: 3, title: 'Course Graduate', icon: TrophyIcon, unlocked: false },
  { id: 4, title: 'Community Helper', icon: StarIcon, unlocked: false }
];

export default function Community() {
  const { branding, loading: brandingLoading } = useBranding();
  const { user, loading: authLoading } = useAuth();
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [timeToNext, setTimeToNext] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [selectedQuickSkill, setSelectedQuickSkill] = useState(null);
  const [showQuickSkillModal, setShowQuickSkillModal] = useState(false);

  // ALL HOOKS MUST BE CALLED FIRST - Check if accessing a specific lesson via URL
  useEffect(() => {
    if (lessonId) {
      // Find the lesson by ID or create a default one with complete structure
      const lesson = currentTutorials.find(t => t.id === parseInt(lessonId)) || {
        id: parseInt(lessonId),
        title: `Lesson ${lessonId}`,
        instructor: {
          name: 'System',
          title: 'Learning Platform',
          avatar: null,
          rating: 4.5,
          students: 1000
        },
        duration: '30 min',
        difficulty: 'Intermediate',
        category: 'General',
        thumbnail: null,
        progress: 0,
        isNew: false,
        description: 'Interactive lesson content',
        tags: ['Learning'],
        chapters: [
          { id: 1, title: 'Introduction', time: '0:00', duration: '5:00', completed: false },
          { id: 2, title: 'Main Content', time: '5:00', duration: '20:00', completed: false },
          { id: 3, title: 'Summary', time: '25:00', duration: '5:00', completed: false }
        ],
        resources: [
          { id: 1, title: 'Lesson Materials', type: 'pdf', size: '1.2 MB' }
        ],
        transcript: [
          { time: '0:00', text: 'Welcome to this lesson...' }
        ],
        relatedLessons: [],
        quiz: {
          questions: []
        }
      };
      setSelectedLesson(lesson);
      setShowLessonViewer(true);
    }
  }, [lessonId]);

  // Countdown timer for next live training
  useEffect(() => {
    if (!user || upcomingTrainings.length === 0) {
      return;
    }

    const updateCountdown = () => {
      const nextTraining = upcomingTrainings[0];
      const now = new Date();
      const trainingDate = new Date(nextTraining.date);
      const difference = trainingDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeToNext(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeToNext(`${hours}h ${minutes}m`);
        } else {
          setTimeToNext(`${minutes}m`);
        }
      } else {
        setTimeToNext('Live Now!');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS - Show loading spinner while contexts are loading
  if (brandingLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Ensure branding is loaded before checking properties
  if (!branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Handler for opening lesson viewer
  const handleOpenLesson = (tutorial) => {
    setSelectedLesson(tutorial);
    setShowLessonViewer(true);
    // Update URL to reflect the lesson being viewed
    navigate(`/community/lesson/${tutorial.id}`, { replace: true });
  };

  // Handler for closing lesson viewer
  const handleCloseLesson = () => {
    setShowLessonViewer(false);
    setSelectedLesson(null);
    // Return to community page
    navigate('/community', { replace: true });
  };

  // Handler for opening quick skill modal
  const handleOpenQuickSkill = (skill) => {
    setSelectedQuickSkill(skill);
    setShowQuickSkillModal(true);
  };

  // Handler for closing quick skill modal
  const handleCloseQuickSkill = () => {
    setShowQuickSkillModal(false);
    setSelectedQuickSkill(null);
  };

  // Redirect to home if in E-systems mode
  if (branding.isESystemsMode) {
    return <Navigate to="/" replace />;
  }

  // Show interactive learning center for logged in users
  if (user) {
    return (
      <>
        <Helmet>
          <title>Learning Center - {branding.name}</title>
        </Helmet>

        <div className="bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.profile?.name || 'VA'}!</h1>
                  <p className="text-gray-600">Continue your learning journey</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Learning Streak</div>
                    <div className="flex items-center text-orange-600">
                      <FireIconSolid className="h-5 w-5 mr-1" />
                      <span className="font-bold">7 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Continue Learning */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <PlayIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Continue Learning
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {currentTutorials.map((tutorial) => (
                      <div key={tutorial.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-gray-900">{tutorial.title}</h3>
                              {tutorial.isNew && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{tutorial.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {typeof tutorial.instructor === 'string' ? tutorial.instructor : tutorial.instructor.name}</span>
                              <span>{tutorial.duration}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                                tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {tutorial.difficulty}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tutorial.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <button 
                              onClick={() => handleOpenLesson(tutorial)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                              {tutorial.progress > 0 ? 'Continue' : 'Start'}
                              <PlayIcon className="ml-1 h-4 w-4" />
                            </button>
                            {tutorial.progress > 0 && (
                              <div className="w-24">
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${tutorial.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 mt-1">{tutorial.progress}% complete</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Skills */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BoltIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Quick Skills (5-15 min)
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: 'Instagram Story Templates', time: '8 min', category: 'Design' },
                        { title: 'Email Subject Line Tips', time: '5 min', category: 'Marketing' },
                        { title: 'Client Onboarding Checklist', time: '12 min', category: 'Business' },
                        { title: 'Keyword Research Basics', time: '15 min', category: 'SEO' }
                      ].map((skill, index) => (
                        <div 
                          key={index} 
                          onClick={() => handleOpenQuickSkill(skill)}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{skill.title}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">{skill.time}</span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{skill.category}</span>
                              </div>
                            </div>
                            <PlayIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Next Live Training Countdown */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg shadow-sm text-white">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <CalendarDaysIcon className="h-6 w-6 mr-2" />
                      <h3 className="text-lg font-semibold">Next Live Training</h3>
                    </div>
                    {upcomingTrainings.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">{upcomingTrainings[0].title}</h4>
                        <p className="text-blue-100 text-sm mb-4">{upcomingTrainings[0].description}</p>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <ClockIcon className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Starts in</span>
                          </div>
                          <div className="text-2xl font-bold">{timeToNext}</div>
                          <div className="text-sm text-blue-100 mt-1">
                            {upcomingTrainings[0].date.toLocaleDateString()} at {upcomingTrainings[0].time}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 text-sm">
                          <span>{upcomingTrainings[0].attendees} registered</span>
                          <button className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50">
                            Join Training
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TrophyIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Achievements
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className={`flex items-center space-x-3 ${
                        achievement.unlocked ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        <achievement.icon className={`h-5 w-5 ${
                          achievement.unlocked ? 'text-yellow-500' : 'text-gray-300'
                        }`} />
                        <span className={achievement.unlocked ? 'font-medium' : ''}>{achievement.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Stats */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tutorials Completed</span>
                      <span className="font-semibold">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hours Learned</span>
                      <span className="font-semibold">12.5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Level</span>
                      <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Intermediate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Viewer Modal */}
        {showLessonViewer && selectedLesson && (
          <Suspense fallback={<div>Loading lesson...</div>}>
            <LessonViewer
              lesson={selectedLesson}
              onClose={handleCloseLesson}
            />
          </Suspense>
        )}

        {/* Quick Skill Modal */}
        {showQuickSkillModal && selectedQuickSkill && (
          <Suspense fallback={<div>Loading skill...</div>}>
            <QuickSkillModal
              skill={selectedQuickSkill}
              isOpen={showQuickSkillModal}
              onClose={handleCloseQuickSkill}
            />
          </Suspense>
        )}
      </>
    );
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

        {/* Quick Skills Preview */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                <BoltIcon className="h-8 w-8 mr-3 text-yellow-600" />
                Quick Skills (5-15 min)
              </h2>
              <p className="text-lg text-gray-600">
                Master essential VA skills with our bite-sized tutorials. Perfect for busy schedules.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { title: 'Instagram Story Templates', time: '8 min', category: 'Design', color: 'bg-purple-100 text-purple-800' },
                { title: 'Email Subject Line Tips', time: '5 min', category: 'Marketing', color: 'bg-blue-100 text-blue-800' },
                { title: 'Client Onboarding Checklist', time: '12 min', category: 'Business', color: 'bg-green-100 text-green-800' },
                { title: 'Keyword Research Basics', time: '15 min', category: 'SEO', color: 'bg-orange-100 text-orange-800' }
              ].map((skill, index) => (
                <div 
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <PlayIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {skill.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{skill.time}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${skill.color}`}>
                      {skill.category}
                    </span>
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      to="/register"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Join to Access →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Paths */}
        <div id="learning-paths" className="py-20 bg-gray-50">
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