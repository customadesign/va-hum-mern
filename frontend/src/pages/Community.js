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

// Course Categories for filtering
const courseCategories = [
  { id: 'all', name: 'All Courses', count: 24 },
  { id: 'web-development', name: 'Web Development', count: 8 },
  { id: 'design', name: 'Design & Graphics', count: 6 },
  { id: 'marketing', name: 'Digital Marketing', count: 7 },
  { id: 'business', name: 'Business Skills', count: 5 },
  { id: 'ai-tools', name: 'AI & Automation', count: 4 },
  { id: 'communication', name: 'Communication', count: 3 }
];

// Expanded Course Library (24+ courses across categories)
const currentTutorials = [
  // WEB DEVELOPMENT COURSES
  {
    id: 1,
    title: 'Complete HTML & CSS Fundamentals',
    instructor: { name: 'Mike Johnson', title: 'Web Developer', avatar: null, rating: 4.9, students: 5420 },
    duration: '2h 15m',
    difficulty: 'Beginner',
    category: 'Web Development',
    courseType: 'Series',
    seriesInfo: { currentLesson: 1, totalLessons: 8 },
    thumbnail: null,
    progress: 0,
    isNew: true,
    description: 'Master the fundamentals of web development with HTML and CSS. Build responsive websites from scratch.',
    tags: ['HTML', 'CSS', 'Responsive Design'],
    chapters: [
      { id: 1, title: 'HTML Basics & Structure', time: '0:00', duration: '18:30', completed: false },
      { id: 2, title: 'CSS Styling & Layout', time: '18:30', duration: '22:45', completed: false },
      { id: 3, title: 'Responsive Design Principles', time: '41:15', duration: '25:15', completed: false },
      { id: 4, title: 'Flexbox & Grid Systems', time: '66:30', duration: '28:00', completed: false },
      { id: 5, title: 'Building Your First Website', time: '94:30', duration: '40:30', completed: false }
    ],
    resources: [
      { id: 1, title: 'HTML Reference Sheet', type: 'pdf', size: '1.2 MB' },
      { id: 2, title: 'CSS Cheat Sheet', type: 'pdf', size: '800 KB' },
      { id: 3, title: 'Project Starter Files', type: 'zip', size: '5.1 MB' }
    ],
    transcript: [{ time: '0:00', text: 'Welcome to Complete HTML & CSS Fundamentals...' }],
    relatedLessons: [{ id: 2, title: 'JavaScript for Beginners', duration: '1h 45m' }],
    quiz: { questions: [{ id: 1, question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Management Language'], correct: 0 }] }
  },
  {
    id: 2,
    title: 'JavaScript for Beginners',
    instructor: { name: 'Sarah Kim', title: 'Frontend Developer', avatar: null, rating: 4.8, students: 4230 },
    duration: '1h 45m',
    difficulty: 'Beginner',
    category: 'Web Development',
    courseType: 'Single',
    thumbnail: null,
    progress: 25,
    isNew: false,
    description: 'Learn JavaScript fundamentals and add interactivity to your websites.',
    tags: ['JavaScript', 'Programming', 'DOM'],
    chapters: [
      { id: 1, title: 'JavaScript Basics', time: '0:00', duration: '25:00', completed: true },
      { id: 2, title: 'Variables & Functions', time: '25:00', duration: '30:00', completed: false },
      { id: 3, title: 'DOM Manipulation', time: '55:00', duration: '35:00', completed: false },
      { id: 4, title: 'Event Handling', time: '90:00', duration: '15:00', completed: false }
    ],
    resources: [{ id: 1, title: 'JavaScript Examples', type: 'zip', size: '2.3 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to JavaScript for Beginners...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },
  {
    id: 3,
    title: 'WordPress Speed Optimization',
    instructor: { name: 'Emma Rodriguez', title: 'WordPress Developer', avatar: null, rating: 4.9, students: 3200 },
    duration: '60 min',
    difficulty: 'Advanced',
    category: 'Web Development',
    courseType: 'Single',
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
    resources: [{ id: 1, title: 'Performance Checklist', type: 'pdf', size: '800 KB' }],
    transcript: [{ time: '0:00', text: 'Welcome to WordPress Speed Optimization...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },
  {
    id: 4,
    title: 'React.js Fundamentals for VAs',
    instructor: { name: 'Alex Chen', title: 'React Developer', avatar: null, rating: 4.7, students: 2150 },
    duration: '3h 20m',
    difficulty: 'Intermediate',
    category: 'Web Development',
    courseType: 'Series',
    seriesInfo: { currentLesson: 1, totalLessons: 12 },
    thumbnail: null,
    progress: 0,
    isNew: true,
    description: 'Learn React.js to build dynamic web applications and increase your value as a technical VA.',
    tags: ['React', 'JavaScript', 'Components'],
    chapters: [
      { id: 1, title: 'React Introduction', time: '0:00', duration: '20:00', completed: false },
      { id: 2, title: 'Components & JSX', time: '20:00', duration: '25:00', completed: false },
      { id: 3, title: 'State & Props', time: '45:00', duration: '30:00', completed: false }
    ],
    resources: [{ id: 1, title: 'React Starter Kit', type: 'zip', size: '15.2 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to React.js Fundamentals...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },

  // DESIGN & GRAPHICS COURSES
  {
    id: 5,
    title: 'Canva Mastery for VAs',
    instructor: { name: 'Lisa Park', title: 'Graphic Designer', avatar: null, rating: 4.8, students: 6340 },
    duration: '1h 30m',
    difficulty: 'Beginner',
    category: 'Design & Graphics',
    courseType: 'Single',
    thumbnail: null,
    progress: 0,
    isNew: true,
    description: 'Master Canva to create stunning graphics, social media posts, and marketing materials for clients.',
    tags: ['Canva', 'Design', 'Social Media'],
    chapters: [
      { id: 1, title: 'Canva Interface & Tools', time: '0:00', duration: '15:00', completed: false },
      { id: 2, title: 'Brand Identity Design', time: '15:00', duration: '25:00', completed: false },
      { id: 3, title: 'Social Media Templates', time: '40:00', duration: '30:00', completed: false },
      { id: 4, title: 'Advanced Design Techniques', time: '70:00', duration: '20:00', completed: false }
    ],
    resources: [
      { id: 1, title: 'Canva Template Pack', type: 'zip', size: '45.6 MB' },
      { id: 2, title: 'Design Guidelines', type: 'pdf', size: '3.2 MB' }
    ],
    transcript: [{ time: '0:00', text: 'Welcome to Canva Mastery...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },
  {
    id: 6,
    title: 'Adobe Photoshop Basics',
    instructor: { name: 'James Wilson', title: 'Adobe Certified Expert', avatar: null, rating: 4.9, students: 3450 },
    duration: '2h 45m',
    difficulty: 'Intermediate',
    category: 'Design & Graphics',
    courseType: 'Series',
    seriesInfo: { currentLesson: 1, totalLessons: 6 },
    thumbnail: null,
    progress: 0,
    isNew: false,
    description: 'Learn professional photo editing and graphic design with Adobe Photoshop.',
    tags: ['Photoshop', 'Photo Editing', 'Graphics'],
    chapters: [
      { id: 1, title: 'Photoshop Interface', time: '0:00', duration: '20:00', completed: false },
      { id: 2, title: 'Layers & Selections', time: '20:00', duration: '35:00', completed: false },
      { id: 3, title: 'Photo Retouching', time: '55:00', duration: '40:00', completed: false }
    ],
    resources: [{ id: 1, title: 'Practice Images', type: 'zip', size: '125.4 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to Adobe Photoshop Basics...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },

  // DIGITAL MARKETING COURSES  
  {
    id: 7,
    title: 'Advanced Social Media Analytics with AI',
    instructor: { name: 'Sarah Martinez', title: 'Social Media Expert', avatar: null, rating: 4.8, students: 2340 },
    duration: '45 min',
    difficulty: 'Intermediate',
    category: 'Digital Marketing',
    courseType: 'Single',
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
    id: 8,
    title: 'Email Marketing Mastery',
    instructor: { name: 'Rachel Green', title: 'Email Marketing Specialist', avatar: null, rating: 4.7, students: 4120 },
    duration: '1h 15m',
    difficulty: 'Beginner',
    category: 'Digital Marketing',
    courseType: 'Single',
    thumbnail: null,
    progress: 0,
    isNew: false,
    description: 'Build effective email campaigns that convert subscribers into customers.',
    tags: ['Email Marketing', 'Campaigns', 'Conversion'],
    chapters: [
      { id: 1, title: 'Email Marketing Fundamentals', time: '0:00', duration: '20:00', completed: false },
      { id: 2, title: 'List Building Strategies', time: '20:00', duration: '25:00', completed: false },
      { id: 3, title: 'Campaign Creation & Automation', time: '45:00', duration: '30:00', completed: false }
    ],
    resources: [{ id: 1, title: 'Email Templates Pack', type: 'zip', size: '8.7 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to Email Marketing Mastery...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },

  // BUSINESS SKILLS COURSES
  {
    id: 9,
    title: 'Client Communication Mastery',
    instructor: { name: 'David Chen', title: 'Communication Expert', avatar: null, rating: 4.7, students: 1850 },
    duration: '35 min',
    difficulty: 'Beginner',
    category: 'Business Skills',
    courseType: 'Single',
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
    resources: [{ id: 1, title: 'Communication Templates', type: 'pdf', size: '1.1 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to Client Communication Mastery...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },
  {
    id: 10,
    title: 'VA Business Setup & Legal',
    instructor: { name: 'Maria Santos', title: 'Business Consultant', avatar: null, rating: 4.9, students: 3840 },
    duration: '1h 40m',
    difficulty: 'Beginner',
    category: 'Business Skills',
    courseType: 'Series',
    seriesInfo: { currentLesson: 1, totalLessons: 5 },
    thumbnail: null,
    progress: 0,
    isNew: true,
    description: 'Everything you need to know about starting and running a successful VA business.',
    tags: ['Business Setup', 'Legal', 'Contracts'],
    chapters: [
      { id: 1, title: 'Business Structure & Registration', time: '0:00', duration: '25:00', completed: false },
      { id: 2, title: 'Contracts & Legal Protection', time: '25:00', duration: '30:00', completed: false },
      { id: 3, title: 'Pricing & Invoicing', time: '55:00', duration: '25:00', completed: false },
      { id: 4, title: 'Tax Considerations', time: '80:00', duration: '20:00', completed: false }
    ],
    resources: [
      { id: 1, title: 'Contract Templates', type: 'zip', size: '2.1 MB' },
      { id: 2, title: 'Business Checklist', type: 'pdf', size: '850 KB' }
    ],
    transcript: [{ time: '0:00', text: 'Welcome to VA Business Setup...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },

  // AI & AUTOMATION COURSES
  {
    id: 11,
    title: 'ChatGPT for Virtual Assistants',
    instructor: { name: 'Dr. Kevin Liu', title: 'AI Specialist', avatar: null, rating: 4.8, students: 5230 },
    duration: '1h 25m',
    difficulty: 'Beginner',
    category: 'AI & Automation',
    courseType: 'Single',
    thumbnail: null,
    progress: 0,
    isNew: true,
    description: 'Leverage ChatGPT and AI tools to enhance your productivity and service offerings.',
    tags: ['ChatGPT', 'AI Tools', 'Productivity'],
    chapters: [
      { id: 1, title: 'AI Fundamentals for VAs', time: '0:00', duration: '20:00', completed: false },
      { id: 2, title: 'ChatGPT Prompting Strategies', time: '20:00', duration: '25:00', completed: false },
      { id: 3, title: 'AI Workflow Integration', time: '45:00', duration: '30:00', completed: false },
      { id: 4, title: 'Ethics & Best Practices', time: '75:00', duration: '10:00', completed: false }
    ],
    resources: [{ id: 1, title: 'AI Prompt Library', type: 'pdf', size: '1.8 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to ChatGPT for Virtual Assistants...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  },

  // Additional courses to reach 24 total...
  {
    id: 12,
    title: 'Zapier Automation Mastery',
    instructor: { name: 'Tom Anderson', title: 'Automation Expert', avatar: null, rating: 4.6, students: 2890 },
    duration: '55 min',
    difficulty: 'Intermediate',
    category: 'AI & Automation',
    courseType: 'Single',
    thumbnail: null,
    progress: 0,
    isNew: false,
    description: 'Create powerful automations to streamline workflows for yourself and clients.',
    tags: ['Zapier', 'Automation', 'Workflows'],
    chapters: [
      { id: 1, title: 'Zapier Basics', time: '0:00', duration: '15:00', completed: false },
      { id: 2, title: 'Building Your First Zap', time: '15:00', duration: '20:00', completed: false },
      { id: 3, title: 'Advanced Automation', time: '35:00', duration: '20:00', completed: false }
    ],
    resources: [{ id: 1, title: 'Automation Templates', type: 'pdf', size: '1.2 MB' }],
    transcript: [{ time: '0:00', text: 'Welcome to Zapier Automation Mastery...' }],
    relatedLessons: [],
    quiz: { questions: [] }
  }

  // ... Continue adding more courses to reach the full catalog
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
  
  // Course filtering and search state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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

  // Filter and search courses
  const getFilteredCourses = () => {
    let filtered = currentTutorials;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        course.category.toLowerCase().replace('&', '').replace(' ', '-') === selectedCategory ||
        course.category.toLowerCase().replace(' ', '-') === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort courses
    switch (sortBy) {
      case 'newest':
        return filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      case 'popular':
        return filtered.sort((a, b) => b.instructor.students - a.instructor.students);
      case 'rating':
        return filtered.sort((a, b) => b.instructor.rating - a.instructor.rating);
      case 'duration':
        return filtered.sort((a, b) => {
          const getDuration = (duration) => {
            const hours = duration.includes('h') ? parseInt(duration.split('h')[0]) * 60 : 0;
            const minutes = duration.includes('min') ? parseInt(duration.split('min')[0].split(' ').pop()) : 0;
            return hours + minutes;
          };
          return getDuration(a.duration) - getDuration(b.duration);
        });
      default:
        return filtered;
    }
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
                {/* Course Library Header */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BookOpenIcon className="h-6 w-6 mr-3 text-blue-600" />
                        Course Library
                        <span className="ml-3 text-sm font-normal text-gray-500">
                          ({getFilteredCourses().length} courses)
                        </span>
                      </h2>
                    </div>
                    
                    {/* Search and Filters */}
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search courses, instructors, or topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      {/* Category Filter Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {courseCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category.name} ({category.count})
                          </button>
                        ))}
                      </div>

                      {/* Sort Options */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="text-sm font-medium text-gray-700">Sort by:</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="newest">Newest First</option>
                            <option value="popular">Most Popular</option>
                            <option value="rating">Highest Rated</option>
                            <option value="duration">Shortest First</option>
                          </select>
                        </div>
                        <div className="text-sm text-gray-500">
                          Showing {getFilteredCourses().length} of {currentTutorials.length} courses
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Grid */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {getFilteredCourses().map((tutorial) => (
                        <div 
                          key={tutorial.id} 
                          onClick={() => handleOpenLesson(tutorial)}
                          className="border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group">
                          <div className="p-6">
                            {/* Course Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {tutorial.title}
                                  </h3>
                                  {tutorial.isNew && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      New
                                    </span>
                                  )}
                                  {tutorial.courseType === 'Series' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      Series
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tutorial.description}</p>
                              </div>
                            </div>

                            {/* Course Meta */}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{tutorial.instructor.name}</span>
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                <span>{tutorial.duration}</span>
                              </div>
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-1 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>{tutorial.instructor.rating}</span>
                              </div>
                            </div>

                            {/* Difficulty & Category */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                                  tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {tutorial.difficulty}
                                </span>
                                <span className="text-xs text-gray-500">{tutorial.category}</span>
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-4">
                              {tutorial.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {tag}
                                </span>
                              ))}
                              {tutorial.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{tutorial.tags.length - 3} more</span>
                              )}
                            </div>

                            {/* Progress Bar (if in progress) */}
                            {tutorial.progress > 0 && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Progress</span>
                                  <span className="text-xs text-gray-600">{tutorial.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${tutorial.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Action Button */}
                            <button
                              className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center ${
                                tutorial.progress > 0
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              <PlayIcon className="h-4 w-4 mr-2" />
                              {tutorial.progress > 0 ? 'Continue Learning' : 'Start Course'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* No Results Message */}
                    {getFilteredCourses().length === 0 && (
                      <div className="text-center py-12">
                        <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-500 mb-4">
                          Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedCategory('all');
                            setSearchQuery('');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Skills - Notion Style Guide */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BoltIcon className="h-6 w-6 mr-3 text-yellow-600" />
                        Quick Skills Mastery Guide
                      </h2>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        4 Essential Skills • 5-15 min each
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2">
                      Master these essential VA skills with our step-by-step guides. Each skill includes templates, examples, and actionable tips.
                    </p>
                  </div>

                  <div className="p-6 space-y-8">
                    {/* Skill 1: Instagram Story Templates */}
                    <div className="border-l-4 border-purple-400 pl-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <PaintBrushIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          Instagram Story Templates
                        </h3>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">8 min</span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Design</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 mb-3">
                          <strong>What you'll learn:</strong> Create engaging Instagram stories that boost engagement and drive sales for clients.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">✅ Templates Included:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Product showcase templates</li>
                              <li>• Behind-the-scenes layouts</li>
                              <li>• Call-to-action designs</li>
                              <li>• Q&A and poll templates</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">🎯 Key Techniques:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Color psychology in design</li>
                              <li>• Typography best practices</li>
                              <li>• Brand consistency tips</li>
                              <li>• Engagement optimization</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <VideoCameraIcon className="h-4 w-4 mr-2 text-blue-600" />
                          Video Tutorial Preview
                        </h4>
                        <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center text-gray-500 mb-2">
                          <div className="text-center">
                            <PlayIcon className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm">Watch: "Creating Your First Story Template"</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          See how to create professional Instagram story templates using free tools and boost client engagement by 300%.
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleOpenQuickSkill({title: 'Instagram Story Templates', time: '8 min', category: 'Design'})}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Start Guide
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Download Templates
                        </button>
                      </div>
                    </div>

                    {/* Skill 2: Email Subject Line Tips */}
                    <div className="border-l-4 border-blue-400 pl-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          Email Subject Line Mastery
                        </h3>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">5 min</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Marketing</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 mb-3">
                          <strong>What you'll learn:</strong> Write subject lines that increase open rates by 40% and drive more conversions.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">📧 Proven Formulas:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Curiosity-driven headlines</li>
                              <li>• Urgency and scarcity tactics</li>
                              <li>• Personalization techniques</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">✉️ Examples:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• "John, your exclusive invite..."</li>
                              <li>• "Last chance: 50% off ends tonight"</li>
                              <li>• "The secret that changed everything"</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">📊 A/B Testing:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Testing strategies</li>
                              <li>• Metrics to track</li>
                              <li>• Optimization tips</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">💡 Quick Reference Cheat Sheet</h4>
                        <div className="bg-white rounded border p-3">
                          <div className="text-sm space-y-1">
                            <div><strong>Power Words:</strong> Free, Exclusive, Limited, Secret, Proven, Instant</div>
                            <div><strong>Optimal Length:</strong> 30-50 characters (mobile-friendly)</div>
                            <div><strong>Avoid:</strong> ALL CAPS, excessive punctuation (!!!), spam words</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleOpenQuickSkill({title: 'Email Subject Line Tips', time: '5 min', category: 'Marketing'})}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Start Guide
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Get Cheat Sheet
                        </button>
                      </div>
                    </div>

                    {/* Skill 3: Client Onboarding Checklist */}
                    <div className="border-l-4 border-green-400 pl-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <UserGroupIcon className="h-5 w-5 text-green-600" />
                          </div>
                          Client Onboarding Checklist
                        </h3>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">12 min</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Business</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 mb-3">
                          <strong>What you'll learn:</strong> Create a seamless onboarding process that impresses clients and sets clear expectations.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">📋 Complete Checklist:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Welcome packet template</li>
                              <li>• Project scope document</li>
                              <li>• Communication preferences</li>
                              <li>• Access credentials form</li>
                              <li>• Timeline and milestones</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">🎯 Key Benefits:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Reduced project confusion</li>
                              <li>• Professional first impression</li>
                              <li>• Clear expectations set</li>
                              <li>• Improved client retention</li>
                              <li>• Streamlined workflow</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">⚠️ Common Onboarding Mistakes to Avoid</h4>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-white rounded p-3 border-l-4 border-red-400">
                            <strong className="text-red-600">Don't:</strong> Assume client knowledge
                          </div>
                          <div className="bg-white rounded p-3 border-l-4 border-red-400">
                            <strong className="text-red-600">Don't:</strong> Skip contract details
                          </div>
                          <div className="bg-white rounded p-3 border-l-4 border-green-400">
                            <strong className="text-green-600">Do:</strong> Explain every step clearly
                          </div>
                          <div className="bg-white rounded p-3 border-l-4 border-green-400">
                            <strong className="text-green-600">Do:</strong> Set communication boundaries
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleOpenQuickSkill({title: 'Client Onboarding Checklist', time: '12 min', category: 'Business'})}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Start Guide
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Download Checklist
                        </button>
                      </div>
                    </div>

                    {/* Skill 4: Keyword Research Basics */}
                    <div className="border-l-4 border-orange-400 pl-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          Keyword Research Mastery
                        </h3>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">15 min</span>
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">SEO</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 mb-3">
                          <strong>What you'll learn:</strong> Find profitable keywords that drive traffic and help clients rank higher in search results.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">🔍 Research Tools:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Google Keyword Planner</li>
                              <li>• Ubersuggest (Free)</li>
                              <li>• AnswerThePublic</li>
                              <li>• Google Trends</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">📊 Key Metrics:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Search volume</li>
                              <li>• Keyword difficulty</li>
                              <li>• Cost per click (CPC)</li>
                              <li>• Search intent</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">🎯 Strategies:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Long-tail keywords</li>
                              <li>• Competitor analysis</li>
                              <li>• Local SEO keywords</li>
                              <li>• Content optimization</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-2 text-blue-600" />
                          Step-by-Step Process
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                            <span>Brainstorm seed keywords related to the business</span>
                          </div>
                          <div className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                            <span>Use tools to expand keyword list and check metrics</span>
                          </div>
                          <div className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                            <span>Analyze competitor keywords and identify gaps</span>
                          </div>
                          <div className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                            <span>Prioritize keywords by difficulty vs. opportunity</span>
                          </div>
                          <div className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">5</span>
                            <span>Create content strategy around selected keywords</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleOpenQuickSkill({title: 'Keyword Research Basics', time: '15 min', category: 'SEO'})}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center">
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Start Guide
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Get Toolkit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Call-to-Action Footer */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-b-lg">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ready to Master All 4 Skills?
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Join our community to access the complete guides, templates, and video tutorials.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          Get Full Access
                        </button>
                        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Download All Templates
                        </button>
                      </div>
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

  // Return non-logged-in view
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