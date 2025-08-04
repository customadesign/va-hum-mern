import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationBadge from './NotificationBadge';

const NotificationDemo = () => {
  const [count, setCount] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const demoStates = [
    { count: 0, label: 'No notifications' },
    { count: 1, label: 'Single notification' },
    { count: 5, label: 'Multiple notifications' },
    { count: 23, label: 'Many notifications' },
    { count: 150, label: 'Maximum display (99+)' }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Notification Badge Demo</h1>
        
        {/* Current State Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Notification Button</h2>
          <div className="flex items-center justify-center py-8">
            <button
              type="button"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className={`
                bg-gray-100 text-gray-400 hover:text-gray-500 
                p-1 rounded-full focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-gray-500 relative 
                transition-all duration-200
                ${isHovering ? 'transform scale-110' : 'transform scale-100'}
              `}
            >
              <span className="sr-only">View notifications {count > 0 ? `(${count} unread)` : ''}</span>
              <BellIcon 
                className={`h-6 w-6 transition-all duration-200 ${count > 0 ? 'animate-wiggle' : ''}`} 
                aria-hidden="true" 
              />
              <NotificationBadge count={count} />
            </button>
          </div>
          <p className="text-center text-gray-600">
            {count === 0 ? 'No unread notifications' : `${count} unread notification${count !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* State Controls */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Different States</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {demoStates.map((state) => (
              <button
                key={state.count}
                onClick={() => setCount(state.count)}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${count === state.count 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Controls</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCount(Math.max(0, count - 1))}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Decrease (-)
            </button>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="px-4 py-2 border border-gray-300 rounded-md w-24 text-center"
              min="0"
            />
            <button
              onClick={() => setCount(count + 1)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Increase (+)
            </button>
            <button
              onClick={() => setCount(Math.floor(Math.random() * 50) + 1)}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Random
            </button>
          </div>
        </div>

        {/* Visual States Gallery */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">All Visual States</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {demoStates.map((state) => (
              <div key={state.count} className="text-center">
                <div className="flex justify-center mb-2">
                  <button
                    type="button"
                    className="bg-gray-100 text-gray-400 p-1 rounded-full relative"
                  >
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                    <NotificationBadge count={state.count} />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{state.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Variations */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-xl font-semibold mb-4">Theme Variations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Light Theme */}
            <div className="text-center">
              <div className="bg-gray-50 p-4 rounded-lg mb-2">
                <div className="flex justify-center">
                  <button className="bg-white text-gray-400 p-1 rounded-full relative shadow">
                    <BellIcon className="h-6 w-6" />
                    <NotificationBadge count={5} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">Light Theme</p>
            </div>

            {/* Dark Theme */}
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-2">
                <div className="flex justify-center">
                  <button className="bg-gray-700 text-gray-300 p-1 rounded-full relative">
                    <BellIcon className="h-6 w-6" />
                    <NotificationBadge count={5} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">Dark Theme</p>
            </div>

            {/* With Hover */}
            <div className="text-center">
              <div className="bg-gray-50 p-4 rounded-lg mb-2">
                <div className="flex justify-center">
                  <button className="bg-gray-100 text-gray-500 p-1 rounded-full relative transform scale-110 shadow-lg">
                    <BellIcon className="h-6 w-6 animate-wiggle" />
                    <NotificationBadge count={5} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">Hover State</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;