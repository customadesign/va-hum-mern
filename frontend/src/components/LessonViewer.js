import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodePlayground from './CodePlayground';
import DesignCanvas from './DesignCanvas';
import {
  PlayIcon,
  PauseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid';

const LessonViewer = ({ lesson, onClose }) => {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const videoRef = useRef(null);
  
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [completedSections, setCompletedSections] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [practiceCode, setPracticeCode] = useState('');
  const [practiceDesign, setPracticeDesign] = useState(null);

  // Sample lesson data structure
  const lessonData = lesson || {
    id: lessonId || 1,
    title: 'Advanced Social Media Analytics with AI',
    instructor: {
      name: 'Sarah Martinez',
      title: 'Social Media Expert',
      avatar: null,
      rating: 4.8,
      students: 2340
    },
    duration: '45 min',
    chapters: [
      { id: 1, title: 'Introduction to AI Analytics', time: '0:00', duration: '5:42', completed: true },
      { id: 2, title: 'Setting Up Your Analytics Dashboard', time: '5:42', duration: '8:15', completed: true },
      { id: 3, title: 'Understanding Key Metrics', time: '13:57', duration: '10:30', completed: false },
      { id: 4, title: 'AI-Powered Insights', time: '24:27', duration: '12:18', completed: false },
      { id: 5, title: 'Creating Reports & Action Plans', time: '36:45', duration: '8:15', completed: false }
    ],
    resources: [
      { id: 1, title: 'Analytics Dashboard Template', type: 'xlsx', size: '2.3 MB' },
      { id: 2, title: 'AI Tools Comparison Guide', type: 'pdf', size: '1.5 MB' },
      { id: 3, title: 'Sample Client Report', type: 'pdf', size: '3.1 MB' },
      { id: 4, title: 'Metrics Cheat Sheet', type: 'pdf', size: '892 KB' }
    ],
    transcript: [
      { time: '0:00', text: 'Welcome to this comprehensive guide on using AI for social media analytics...' },
      { time: '0:30', text: 'By the end of this lesson, you\'ll be able to leverage AI tools to provide deeper insights...' },
      { time: '1:15', text: 'Let\'s start by understanding what makes AI-powered analytics different...' }
    ],
    relatedLessons: [
      { id: 2, title: 'Content Strategy with ChatGPT', duration: '32 min' },
      { id: 3, title: 'Automated Social Media Scheduling', duration: '28 min' },
      { id: 4, title: 'Building Client Reports', duration: '25 min' }
    ],
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What is the primary benefit of AI in social media analytics?',
          options: [
            'Faster data processing',
            'Pattern recognition',
            'Predictive insights',
            'All of the above'
          ],
          correct: 3
        }
      ]
    }
  };

  // Video controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleChapterClick = (chapter) => {
    // Convert time string to seconds and seek
    const [minutes, seconds] = chapter.time.split(':').map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In production, save bookmark to backend
  };

  const handleCompleteSection = (chapterId) => {
    setCompletedSections([...completedSections, chapterId]);
    // In production, save progress to backend
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    const completed = lessonData.chapters.filter(ch => 
      ch.completed || completedSections.includes(ch.id)
    ).length;
    return (completed / lessonData.chapters.length) * 100;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose || (() => navigate('/community'))}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-white font-semibold text-lg">{lessonData.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{lessonData.instructor.name}</span>
                <span>•</span>
                <span>{lessonData.duration}</span>
                <span>•</span>
                <span>{Math.round(calculateProgress())}% Complete</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBookmark}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isBookmarked ? (
                <BookmarkIconSolid className="h-5 w-5 text-blue-500" />
              ) : (
                <BookmarkIcon className="h-5 w-5" />
              )}
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Mark Complete
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video/Content Area */}
        <div className="flex-1 flex flex-col bg-black">
          {/* Video Player */}
          <div className="relative flex-1 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.target.duration)}
            >
              <source src="/placeholder-video.mp4" type="video/mp4" />
            </video>
            
            {/* Video Overlay Controls */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className="bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-70 transition-all"
              >
                {isPlaying ? (
                  <PauseIcon className="h-12 w-12 text-white" />
                ) : (
                  <PlayIcon className="h-12 w-12 text-white" />
                )}
              </button>
            </div>

            {/* Chapter Markers on Timeline */}
            <div className="absolute bottom-20 left-4 right-4">
              <div className="relative h-1 bg-gray-700 rounded">
                {lessonData.chapters.map((chapter) => {
                  const [mins, secs] = chapter.time.split(':').map(Number);
                  const position = ((mins * 60 + secs) / duration) * 100;
                  return (
                    <div
                      key={chapter.id}
                      className="absolute h-3 w-1 bg-blue-500 -top-1 cursor-pointer hover:bg-blue-400"
                      style={{ left: `${position}%` }}
                      onClick={() => handleChapterClick(chapter)}
                      title={chapter.title}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Video Controls Bar */}
          <div className="bg-gray-800 px-4 py-3">
            <div className="flex items-center space-x-4">
              <button onClick={handlePlayPause} className="text-white hover:text-gray-300">
                {isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>

              {/* Progress Bar */}
              <div className="flex-1 flex items-center space-x-2">
                <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(currentTime / duration) * 100 || 0}
                  onChange={handleProgressChange}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400">{formatTime(duration)}</span>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="text-white hover:text-gray-300">
                  {isMuted ? (
                    <SpeakerXMarkIcon className="h-5 w-5" />
                  ) : (
                    <SpeakerWaveIcon className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Speed Control */}
              <div className="relative group">
                <button className="text-white hover:text-gray-300 text-sm">
                  {playbackSpeed}x
                </button>
                <div className="absolute bottom-8 right-0 bg-gray-700 rounded-lg p-2 hidden group-hover:block">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`block w-full text-left px-3 py-1 text-sm rounded hover:bg-gray-600 ${
                        playbackSpeed === speed ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {['overview', 'chapters', 'practice', 'resources', 'transcript', 'notes', 'discussion'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                {/* Instructor Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-700 rounded-full"></div>
                  <div>
                    <h3 className="text-white font-medium">{lessonData.instructor.name}</h3>
                    <p className="text-sm text-gray-400">{lessonData.instructor.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(lessonData.instructor.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {lessonData.instructor.rating} ({lessonData.instructor.students} students)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lesson Description */}
                <div>
                  <h4 className="text-white font-medium mb-2">About this lesson</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Learn how to leverage AI tools to analyze social media performance and create 
                    data-driven strategies. This comprehensive guide covers everything from setting 
                    up analytics dashboards to generating actionable insights using artificial intelligence.
                  </p>
                </div>

                {/* What You'll Learn */}
                <div>
                  <h4 className="text-white font-medium mb-3">What you'll learn</h4>
                  <ul className="space-y-2">
                    {[
                      'Set up comprehensive analytics dashboards',
                      'Understand key social media metrics',
                      'Use AI tools for deeper insights',
                      'Create professional client reports',
                      'Develop data-driven strategies'
                    ].map((item, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-400">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Related Lessons */}
                <div>
                  <h4 className="text-white font-medium mb-3">Related lessons</h4>
                  <div className="space-y-2">
                    {lessonData.relatedLessons.map(lesson => (
                      <button
                        key={lesson.id}
                        className="w-full text-left p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{lesson.title}</span>
                          <span className="text-xs text-gray-500">{lesson.duration}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
              <div className="p-6">
                <div className="space-y-2">
                  {lessonData.chapters.map((chapter, index) => {
                    const isCompleted = chapter.completed || completedSections.includes(chapter.id);
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter)}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          isCompleted 
                            ? 'bg-gray-800 border border-green-500/20' 
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                              isCompleted ? 'bg-green-500/20' : 'bg-gray-700'
                            }`}>
                              {isCompleted ? (
                                <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
                              ) : (
                                <span className="text-sm text-gray-400">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-white">{chapter.title}</h5>
                              <p className="text-xs text-gray-400">{chapter.duration}</p>
                            </div>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Practice Tab */}
            {activeTab === 'practice' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-white font-semibold mb-2">Interactive Practice</h3>
                  <p className="text-gray-400 text-sm">
                    Practice what you've learned with our interactive tools.
                  </p>
                </div>
                
                {/* Show different practice tools based on lesson category */}
                {lessonData.category === 'Web Development' ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-gray-300 text-sm font-medium mb-2">Code Editor</h4>
                      <p className="text-gray-500 text-xs mb-3">
                        Write and test your code in real-time
                      </p>
                    </div>
                    <CodePlayground
                      language="javascript"
                      initialCode={practiceCode || `// Try writing your code here
function calculateSum(a, b) {
  // Your code here
  return a + b;
}

// Test your function
console.log(calculateSum(5, 3));`}
                      onCodeChange={setPracticeCode}
                    />
                  </div>
                ) : lessonData.category === 'Graphic Design' ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-gray-300 text-sm font-medium mb-2">Design Canvas</h4>
                      <p className="text-gray-500 text-xs mb-3">
                        Create and experiment with design elements
                      </p>
                    </div>
                    <DesignCanvas
                      initialDesign={practiceDesign}
                      onDesignChange={setPracticeDesign}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-6 text-center">
                    <CodeBracketIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <h4 className="text-gray-300 font-medium mb-2">Practice Exercises</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Interactive exercises for this lesson are coming soon!
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Try Sample Exercise
                    </button>
                  </div>
                )}
                
                {/* Quiz Section */}
                {lessonData.quiz && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-gray-300 text-sm font-medium mb-3">Quick Quiz</h4>
                    {lessonData.quiz.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-800 rounded-lg p-4 mb-3">
                        <p className="text-gray-300 mb-3">
                          {index + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <label
                              key={optIndex}
                              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                className="text-blue-600"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Submit Quiz
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="p-6">
                <div className="space-y-3">
                  {lessonData.resources.map(resource => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <h5 className="text-sm font-medium text-white">{resource.title}</h5>
                          <p className="text-xs text-gray-400">{resource.type.toUpperCase()} • {resource.size}</p>
                        </div>
                      </div>
                      <button className="text-blue-400 hover:text-blue-300">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript Tab */}
            {activeTab === 'transcript' && (
              <div className="p-6">
                <div className="space-y-4">
                  {lessonData.transcript.map((entry, index) => (
                    <div key={index} className="flex space-x-3">
                      <span className="text-xs text-gray-500 font-mono">{entry.time}</span>
                      <p className="text-sm text-gray-300 leading-relaxed">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="p-6">
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Take notes while learning..."
                  className="w-full h-64 bg-gray-800 text-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Notes
                </button>
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === 'discussion' && (
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <textarea
                      placeholder="Ask a question or share your thoughts..."
                      className="w-full bg-transparent text-gray-300 resize-none focus:outline-none"
                      rows="3"
                    />
                    <div className="flex justify-end mt-3">
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Post Comment
                      </button>
                    </div>
                  </div>

                  {/* Sample Comments */}
                  <div className="space-y-4">
                    {[
                      {
                        user: 'Alex Chen',
                        time: '2 hours ago',
                        comment: 'Great explanation of AI metrics! The dashboard template is really helpful.'
                      },
                      {
                        user: 'Maria Rodriguez',
                        time: '1 day ago',
                        comment: 'Question: Which AI tool do you recommend for Instagram analytics specifically?'
                      }
                    ].map((comment, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                            <span className="text-sm font-medium text-white">{comment.user}</span>
                          </div>
                          <span className="text-xs text-gray-500">{comment.time}</span>
                        </div>
                        <p className="text-sm text-gray-300">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-sm">Previous</span>
              </button>
              <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                <span className="text-sm">Next Lesson</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;