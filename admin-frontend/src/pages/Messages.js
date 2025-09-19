import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  ChatBubbleOvalLeftEllipsisIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Messages = () => {
  const navigate = useNavigate();

  const messageViews = [
    {
      id: 'classic',
      title: 'Messages Classic',
      description: 'Traditional inbox view with conversation list and message details',
      icon: ChatBubbleLeftRightIcon,
      path: '/messenger-chat',
      color: 'bg-blue-500',
      features: ['Conversation list', 'Message filtering', 'Bulk actions', 'Search functionality']
    },
    {
      id: 'beta',
      title: 'Messages Beta',
      description: 'Modern messenger-style chat interface with real-time updates',
      icon: ChatBubbleOvalLeftEllipsisIcon,
      path: '/messenger-chat',
      color: 'bg-purple-500',
      badge: 'NEW',
      features: ['Real-time chat', 'Modern UI', 'Quick responses', 'Typing indicators']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your preferred messaging interface to manage conversations
        </p>
      </div>

      {/* Message View Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {messageViews.map((view) => (
          <div
            key={view.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            onClick={() => navigate(view.path)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`${view.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform duration-300`}>
                  <view.icon className="h-8 w-8" />
                </div>
                {view.badge && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    {view.badge}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {view.title}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {view.description}
              </p>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Features:</h3>
                <ul className="space-y-1">
                  {view.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <button
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium group-hover:shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(view.path);
                  }}
                >
                  Open {view.title}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/messenger-chat')}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Classic View</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Traditional inbox interface</div>
          </button>
          
          <button
            onClick={() => navigate('/messenger-chat')}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Beta Chat</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Modern chat experience</div>
          </button>
          
          <button
            disabled
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed text-left"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Coming Soon</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">More features in development</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;