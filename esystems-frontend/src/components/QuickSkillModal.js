import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  BookOpenIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  BookmarkIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

const QuickSkillModal = ({ skill, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [userProgress, setUserProgress] = useState(0);

  // Sample skill data
  const skillData = skill || {
    id: 1,
    title: 'Instagram Story Templates',
    category: 'Design',
    duration: '8 min',
    difficulty: 'Beginner',
    description: 'Create stunning Instagram story templates that engage your audience and boost brand visibility.',
    instructor: 'Emma Rodriguez',
    rating: 4.9,
    completions: 1234,
    steps: [
      {
        id: 1,
        title: 'Understanding Story Dimensions',
        content: 'Instagram stories are 1080x1920 pixels (9:16 aspect ratio). This vertical format is optimized for mobile viewing.',
        tips: [
          'Always design in 1080x1920px resolution',
          'Keep important content within safe zones',
          'Test on different devices'
        ],
        visual: 'dimension-guide.png',
        duration: '2 min'
      },
      {
        id: 2,
        title: 'Choosing Your Color Palette',
        content: 'Select 3-5 colors that align with your brand. Use a primary color for CTAs and secondary colors for accents.',
        tips: [
          'Use color psychology to evoke emotions',
          'Maintain 60-30-10 color rule',
          'Ensure text contrast for readability'
        ],
        visual: 'color-palette.png',
        duration: '2 min'
      },
      {
        id: 3,
        title: 'Typography Best Practices',
        content: 'Combine 2-3 fonts maximum. Use hierarchy to guide the eye through your content.',
        tips: [
          'Headlines: Bold, large fonts',
          'Body text: Readable, medium size',
          'Accents: Script or decorative fonts sparingly'
        ],
        visual: 'typography-guide.png',
        duration: '2 min'
      },
      {
        id: 4,
        title: 'Adding Interactive Elements',
        content: 'Use stickers, polls, and questions to boost engagement. Position them strategically without blocking key content.',
        tips: [
          'Place interactive elements in thumb-friendly zones',
          'Use polls to gather audience insights',
          'Add countdown stickers for urgency'
        ],
        visual: 'interactive-elements.png',
        duration: '2 min'
      }
    ],
    resources: {
      templates: [
        { name: 'Story Template Pack', format: 'PSD', size: '45 MB' },
        { name: 'Canva Templates', format: 'LINK', size: 'Online' }
      ],
      guides: [
        { name: 'Quick Reference Card', format: 'PDF', size: '2 MB' },
        { name: 'Brand Guidelines Template', format: 'DOCX', size: '1.5 MB' }
      ]
    },
    relatedSkills: [
      { id: 2, title: 'Instagram Reels Creation', duration: '12 min' },
      { id: 3, title: 'Hashtag Research', duration: '7 min' },
      { id: 4, title: 'Story Analytics', duration: '10 min' }
    ],
    badge: {
      name: 'Story Master',
      icon: SparklesIcon,
      color: 'bg-purple-500'
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCompletedSteps([]);
      setTimeSpent(0);
      setShowCompletionAnimation(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isOpen && isPlaying) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  const handleNextStep = () => {
    if (currentStep < skillData.steps.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
      updateProgress();
    } else {
      handleComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index) => {
    setCurrentStep(index);
    if (index > 0 && !completedSteps.includes(index - 1)) {
      setCompletedSteps([...completedSteps, ...Array.from({ length: index }, (_, i) => i)]);
    }
  };

  const updateProgress = () => {
    const progress = ((completedSteps.length + 1) / skillData.steps.length) * 100;
    setUserProgress(progress);
  };

  const handleComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setUserProgress(100);
    setShowCompletionAnimation(true);
    setIsPlaying(false);
    
    // Show animation for 3 seconds
    setTimeout(() => {
      setShowCompletionAnimation(false);
    }, 3000);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const currentStepData = skillData.steps[currentStep];
  const isLastStep = currentStep === skillData.steps.length - 1;
  const allStepsCompleted = completedSteps.length === skillData.steps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-medium">
                  Quick Skill
                </span>
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-medium">
                  {skillData.category}
                </span>
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-medium">
                  {skillData.difficulty}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{skillData.title}</h2>
              <p className="text-blue-100 text-sm mb-3">{skillData.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{skillData.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <StarIconSolid className="h-4 w-4 text-yellow-400" />
                  <span>{skillData.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{skillData.completions} completed</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                {isBookmarked ? (
                  <BookmarkIconSolid className="h-5 w-5" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Progress: {Math.round(userProgress)}%</span>
              <span>Time: {formatTime(timeSpent)}</span>
            </div>
            <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${userProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {skillData.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                  currentStep === index
                    ? 'bg-blue-600 text-white'
                    : completedSteps.includes(index)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {completedSteps.includes(index) ? (
                  <CheckCircleIconSolid className="h-4 w-4" />
                ) : (
                  <span className="flex items-center justify-center h-4 w-4 text-xs font-bold">
                    {index + 1}
                  </span>
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row h-[400px]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!showCompletionAnimation ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                    <span className="flex items-center justify-center h-8 w-8 bg-blue-100 text-blue-600 rounded-full mr-3 text-sm font-bold">
                      {currentStep + 1}
                    </span>
                    {currentStepData.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{currentStepData.content}</p>
                </div>

                {/* Visual Placeholder */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpenIcon className="h-12 w-12 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">Visual Guide: {currentStepData.visual}</p>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    Pro Tips
                  </h4>
                  <ul className="space-y-2">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-700" />
                    <span className="text-sm text-gray-700">
                      Estimated time: {currentStepData.duration}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    {isPlaying ? (
                      <>
                        <PauseIcon className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-700">Pause</span>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-700">Start Timer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Completion Animation
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <TrophyIcon className="h-24 w-24 text-yellow-400 opacity-75" />
                  </div>
                  <TrophyIcon className="h-24 w-24 text-yellow-400 relative" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Skill Completed!</h3>
                <p className="text-gray-700 mb-4">You've mastered {skillData.title}</p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-1">
                    <FireIcon className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium">+50 XP</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{formatTime(timeSpent)}</span>
                  </div>
                </div>
                <div className={`inline-flex items-center space-x-2 px-4 py-2 ${skillData.badge.color} text-white rounded-lg`}>
                  <skillData.badge.icon className="h-5 w-5" />
                  <span className="font-medium">Earned: {skillData.badge.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-gray-50 p-6 border-t md:border-t-0 md:border-l">
            {/* Resources */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-700" />
                Quick Resources
              </h4>
              <div className="space-y-2">
                {[...skillData.resources.templates, ...skillData.resources.guides].map((resource, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentDuplicateIcon className="h-5 w-5 text-gray-700" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                        <p className="text-xs text-gray-700">{resource.format} • {resource.size}</p>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="h-4 w-4 text-blue-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Related Skills */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <RocketLaunchIcon className="h-5 w-5 mr-2 text-gray-700" />
                Continue Learning
              </h4>
              <div className="space-y-2">
                {skillData.relatedSkills.map(skill => (
                  <button
                    key={skill.id}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{skill.title}</p>
                      <p className="text-xs text-gray-700">{skill.duration}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-gray-700" />
                  </button>
                ))}
              </div>
            </div>

            {/* Share */}
            <button className="w-full mt-6 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              <ShareIcon className="h-5 w-5" />
              <span className="font-medium">Share Progress</span>
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span>Previous</span>
            </button>

            {allStepsCompleted ? (
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircleIconSolid className="h-5 w-5" />
                <span className="font-medium">Complete & Close</span>
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="font-medium">
                  {isLastStep ? 'Complete Skill' : 'Next Step'}
                </span>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSkillModal;