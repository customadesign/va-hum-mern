import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useBranding } from '../../contexts/BrandingContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  InboxIcon,
  UserCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function Conversations() {
  const { branding } = useBranding();
  const { user } = useAuth();
  
  const { data: conversations, isLoading } = useQuery('conversations', async () => {
    const response = await api.get('/conversations');
    return response.data.data;
  });

  const getOtherParticipant = (conversation) => {
    if (user.profile?.va) {
      return conversation.business;
    } else {
      return conversation.va;
    }
  };

  const getUnreadCount = (conversation) => {
    if (user.profile?.va) {
      return conversation.unreadCount?.va || 0;
    } else {
      return conversation.unreadCount?.business || 0;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Messages - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row h-screen">
            {/* Sidebar - Conversation List */}
            <div className="w-full md:w-96 bg-white border-r border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <InboxIcon className="h-7 w-7 mr-2" />
                  Messages
                  {user.admin && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Admin View
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {conversations?.length || 0} conversation{conversations?.length !== 1 && 's'}
                </p>
              </div>

              <div className="overflow-y-auto h-full pb-20">
                {conversations?.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {user.profile?.va 
                        ? 'When businesses contact you, messages will appear here.'
                        : 'Start a conversation with a VA to begin messaging.'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {conversations?.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const unreadCount = getUnreadCount(conversation);
                      const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                      
                      return (
                        <li key={conversation._id}>
                          <Link
                            to={`/conversations/${conversation._id}`}
                            className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${
                              unreadCount > 0 ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 relative">
                                {otherParticipant?.profile?.avatar ? (
                                  <img
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={otherParticipant.profile.avatar}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                    <UserCircleIcon className="h-8 w-8 text-gray-500" />
                                  </div>
                                )}
                                {conversation.status === 'active' && unreadCount > 0 && (
                                  <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-medium ${
                                    unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {otherParticipant?.profile?.name || otherParticipant?.profile?.company || 'Unknown User'}
                                    {otherParticipant?.admin && (
                                      <CheckBadgeIcon className="inline h-4 w-4 text-purple-600 ml-1" />
                                    )}
                                  </p>
                                  <p className={`text-xs ${
                                    unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'
                                  }`}>
                                    {conversation.lastMessageAt &&
                                      formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                        addSuffix: true
                                      })}
                                  </p>
                                </div>
                                
                                {lastMessage && (
                                  <div className="mt-1 flex items-center">
                                    <p className={`text-sm truncate ${
                                      unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                                    }`}>
                                      {lastMessage.sender === user.id && (
                                        <span className="text-gray-400">You: </span>
                                      )}
                                      {lastMessage.content}
                                    </p>
                                    {lastMessage.sender === user.id && lastMessage.read && (
                                      <CheckIcon className="ml-1 h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                )}
                                
                                {conversation.status === 'archived' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Main Content - Select a conversation prompt */}
            <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}