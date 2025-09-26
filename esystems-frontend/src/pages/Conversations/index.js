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

  // Sample conversations for demonstration when no real conversations exist
  const getSampleConversations = () => {
    if (user.profile?.va) {
      // Sample conversations for VAs (from E Systems Admin)
      return [
        {
          _id: 'sample-1',
          participants: [user.id, 'esystems-admin'],
          business: {
            _id: 'esystems-admin',
            email: 'admin@esystems.local',
            admin: true,
            profile: {
              name: 'E Systems Admin',
              company: 'E Systems',
              avatar: null,
              hero: 'Platform Administration'
            }
          },
          messages: [
            {
              _id: 'msg-1',
              sender: 'esystems-admin',
              content: 'Welcome to your E Systems Inbox! This is where you\'ll receive platform updates and client inquiries.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
              _id: 'msg-2',
              sender: user.id,
              content: 'Thank you for reaching out! I\'d love to hear more about the project. What kind of work are you looking for?',
              createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
            },
            {
              _id: 'msg-3',
              sender: 'esystems-admin',
              content: 'Please complete your profile to improve visibility with businesses.',
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }
          ],
          lastMessage: 'Please complete your profile to improve visibility with businesses.',
          lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 0 }
        },
        {
          _id: 'sample-2',
          participants: [user.id, 'esystems-admin-2'],
          business: {
            _id: 'esystems-admin-2',
            email: 'admin@esystems.local',
            admin: true,
            profile: {
              name: 'E Systems Admin',
              company: 'E Systems',
              avatar: null,
              hero: 'Platform Administration'
            }
          },
          messages: [
            {
              _id: 'msg-4',
              sender: 'esystems-admin-2',
              content: 'Remember to respond to messages within 24 hours to maintain a professional reputation.',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
            },
            {
              _id: 'msg-5',
              sender: user.id,
              content: 'Hi there! Yes, I\'m currently available. What does the position involve?',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
            }
          ],
          lastMessage: 'Remember to respond to messages within 24 hours to maintain a professional reputation.',
          lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'sample-3',
          participants: [user.id, 'esystems-admin-3'],
          business: {
            _id: 'esystems-admin-3',
            email: 'admin@esystems.local',
            admin: true,
            profile: {
              name: 'E Systems Admin',
              company: 'E Systems',
              avatar: null,
              hero: 'Platform Administration'
            }
          },
          messages: [
            {
              _id: 'msg-6',
              sender: user.id,
              content: 'Thank you for the opportunity! I\'m excited to get started on the project.',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            }
          ],
          lastMessage: 'Thank you for the opportunity! I\'m excited to get started on the project.',
          lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 0 }
        }
      ];
    } else {
      // Sample conversations for businesses
      return [
        {
          _id: 'sample-1',
          participants: [user.id, 'va-1'],
          va: {
            _id: 'va-1',
            email: 'sarah.johnson@email.com',
            profile: {
              name: 'Sarah Johnson',
              avatar: null,
              hero: 'Experienced Virtual Assistant specializing in social media & admin support'
            }
          },
          messages: [
            {
              _id: 'msg-1',
              sender: user.id,
              content: 'Hi Sarah! I reviewed your profile and I think you\'d be a great fit for our social media management needs.',
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
            },
            {
              _id: 'msg-2',
              sender: 'va-1',
              content: 'Thank you for reaching out! I\'d love to learn more about your requirements and how I can help.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          ],
          lastMessage: 'Thank you for reaching out! I\'d love to learn more about your requirements and how I can help.',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'sample-2',
          participants: [user.id, 'va-2'],
          va: {
            _id: 'va-2',
            email: 'mike.chen@email.com',
            profile: {
              name: 'Mike Chen',
              avatar: null,
              hero: 'Data entry specialist and customer service expert'
            }
          },
          messages: [
            {
              _id: 'msg-3',
              sender: 'va-2',
              content: 'I saw your job posting and I believe my skills align perfectly with what you\'re looking for.',
              createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
            }
          ],
          lastMessage: 'I saw your job posting and I believe my skills align perfectly with what you\'re looking for.',
          lastMessageAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 1 }
        }
      ];
    }
  };

  // Use sample conversations if no real conversations exist
  const displayConversations = conversations?.length > 0 ? conversations : getSampleConversations();

  const getOtherParticipant = (conversation) => {
    // Prefer admin participant when present (E Systems admin messaging)
    if (conversation?.business?.admin) return conversation.business;
    if (conversation?.va?.admin) return conversation.va;
    // Fallback to role-based other participant
    if (user.profile?.va) return conversation.business;
    return conversation.va;
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
                <p className="mt-1 text-sm text-gray-700">
                  {displayConversations?.length || 0} conversation{displayConversations?.length !== 1 && 's'}
                  {(!conversations || conversations.length === 0) && displayConversations?.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Demo
                    </span>
                  )}
                </p>
              </div>

              <div className="overflow-y-auto h-full pb-20">
                {displayConversations?.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-700" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-700">
                      {user.profile?.va 
                        ? 'When businesses contact you, messages will appear here.'
                        : 'Start a conversation with a VA to begin messaging.'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {displayConversations?.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const unreadCount = getUnreadCount(conversation);
                      const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                      const isIntercepted = conversation.isIntercepted;
                      
                      return (
                        <li key={conversation._id}>
                          <Link
                            to={`/conversations/${conversation._id}`}
                            className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${
                              unreadCount > 0 ? 'bg-blue-50' : ''
                            } ${isIntercepted && user.admin ? 'border-l-4 border-orange-400' : ''}`}
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
                                    <UserCircleIcon className="h-8 w-8 text-gray-700" />
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
                                  <div className="flex items-center space-x-2">
                                    {/* Robust name fallback incl. admin label */}
                                    <p className={`text-sm font-medium ${
                                      unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {otherParticipant?.profile?.name 
                                        || otherParticipant?.name 
                                        || otherParticipant?.profile?.company 
                                        || otherParticipant?.email 
                                        || (otherParticipant?.admin ? 'E Systems Admin' : 'Unknown User')}
                                      {otherParticipant?.admin && (
                                        <CheckBadgeIcon className="inline h-4 w-4 text-purple-600 ml-1" />
                                      )}
                                    </p>
                                    {isIntercepted && user.admin && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                        Intercepted
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs ${
                                    unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-700'
                                  }`}>
                                    {conversation.lastMessageAt &&
                                      formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                        addSuffix: true
                                      })}
                                  </p>
                                </div>
                                
                                {/* Show original sender info for intercepted conversations */}
                                {isIntercepted && user.admin && conversation.originalSender && (
                                  <div className="mt-1 text-xs text-orange-600">
                                    From: {conversation.originalSender.profile?.company || conversation.originalSender.email} → {conversation.va?.profile?.name || conversation.va?.email}
                                  </div>
                                )}
                                
                                  {lastMessage && (
                                  <div className="mt-1 flex items-center">
                                    {/* Normalize sender id to detect 'You:' */}
                                    <p className={`text-sm truncate ${
                                      unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-700'
                                    }`}>
                                      {(() => {
                                        const myId = (user && (user.id || user._id)) || null;
                                        const senderId = typeof lastMessage.sender === 'string' 
                                          ? lastMessage.sender 
                                          : (lastMessage.sender?._id || lastMessage.sender?.id);
                                        return myId && senderId === myId;
                                      })() && (
                                        <span className="text-gray-700">You: </span>
                                      )}
                                      {lastMessage.content}
                                    </p>
                                    {(() => {
                                      const myId = (user && (user.id || user._id)) || null;
                                      const senderId = typeof lastMessage.sender === 'string' 
                                        ? lastMessage.sender 
                                        : (lastMessage.sender?._id || lastMessage.sender?.id);
                                      return myId && senderId === myId && lastMessage.read;
                                    })() && (
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
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-700" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="mt-2 text-sm text-gray-700">
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