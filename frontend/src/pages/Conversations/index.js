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
import SafeHtml from '../../components/SafeHtml';
import { DEFAULT_SYSTEM_HTML } from '../../constants/systemHtml';

// Strip HTML tags for safe preview display
function stripHtml(input) {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
}

// Allowlist sanitizer for the system nudge (keep only <a> and enforce safe attrs)
function sanitizeSystemHtml(html) {
  try {
    const tpl = document.createElement('template');
    tpl.innerHTML = html || '';
    const nodes = tpl.content.querySelectorAll('*');
    nodes.forEach((el) => {
      const tag = el.tagName.toUpperCase();
      if (tag !== 'A') {
        const text = document.createTextNode(el.textContent || '');
        el.replaceWith(text);
        return;
      }
      const a = el;
      const href = a.getAttribute('href') || '';
      const safeHref =
        href.startsWith('/') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:')
          ? href
          : '#';
      a.setAttribute('href', safeHref);
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('target', safeHref.startsWith('/') ? '_self' : '_blank');
      const existingClass = a.getAttribute('class') || '';
      a.setAttribute('class', (existingClass + ' text-blue-600 underline').trim());
      Array.from(a.attributes).forEach((attr) => {
        if (!['href', 'rel', 'target', 'class'].includes(attr.name)) {
          a.removeAttribute(attr.name);
        }
      });
    });
    return tpl.innerHTML;
  } catch {
    return stripHtml(html || '');
  }
}

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
      // Sample conversations for VAs
      return [
        {
          _id: 'sample-1',
          participants: [user.id, 'admin-1'],
          business: {
            _id: 'admin-1',
            email: 'admin@linkage.ph',
            profile: {
              name: 'Linkage Admin',
              company: 'Linkage VA Hub',
              avatar: null,
              hero: 'Official Linkage VA Hub Administration'
            }
          },
          messages: [
            {
              _id: 'msg-1',
              sender: 'admin-1',
              content: 'Thank you for reaching out! I\'d love to learn more about your requirements and how I can help.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          ],
          lastMessage: 'Thank you for reaching out! I\'d love to learn more about your requirements and how I can help.',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 0 }
        },
        {
          _id: 'sample-2',
          participants: [user.id, 'admin-2'],
          business: {
            _id: 'admin-2',
            email: 'support@linkage.ph',
            profile: {
              name: 'Linkage Admin',
              company: 'Linkage VA Hub',
              avatar: null,
              hero: 'Official Linkage VA Hub Administration'
            }
          },
          messages: [
            {
              _id: 'msg-2',
              sender: 'admin-2',
              content: 'I saw your job posting and I believe my skills in virtual assistance would be a great match for your needs.',
              createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
            }
          ],
          lastMessage: 'I saw your job posting and I believe my skills in virtual assistance would be a great match for your needs.',
          lastMessageAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        }
      ];
    } else {
      // Sample conversations for businesses
      return [
        {
          _id: 'sample-1',
          participants: [user.id, 'admin-1'],
          va: {
            _id: 'admin-1',
            email: 'admin@linkage.com',
            profile: {
              name: 'Linkage Admin',
              avatar: null,
              hero: 'Linkage Support Team'
            }
          },
          messages: [
            {
              _id: 'msg-1',
              sender: user.id,
              content: 'Hello! I\'d like to learn more about posting a job and finding the right virtual assistant.',
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
            },
            {
              _id: 'msg-2',
              sender: 'admin-1',
              content: 'Welcome to Linkage! We\'re here to help you find the perfect virtual assistant for your business needs. Feel free to ask any questions!',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          ],
          lastMessage: 'Welcome to Linkage! We\'re here to help you find the perfect virtual assistant for your business needs. Feel free to ask any questions!',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'sample-2',
          participants: [user.id, 'admin-2'],
          va: {
            _id: 'admin-2',
            email: 'support@linkage.com',
            profile: {
              name: 'Linkage Admin',
              avatar: null,
              hero: 'Linkage Support Team'
            }
          },
          messages: [
            {
              _id: 'msg-3',
              sender: 'admin-2',
              content: 'Thank you for joining Linkage! If you have any questions about finding virtual assistants or posting jobs, we\'re here to assist.',
              createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
            }
          ],
          lastMessage: 'Thank you for joining Linkage! If you have any questions about finding virtual assistants or posting jobs, we\'re here to assist.',
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
                  {displayConversations?.length || 0} conversation{displayConversations?.length !== 1 && 's'}
                  {(!conversations || conversations.length === 0) && displayConversations?.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Demo
                    </span>
                  )}
                </p>
              </div>

              <div className="overflow-y-auto h-full pb-20">
                {/* Mobile-only system nudge */}
                <div className="md:hidden px-6 py-3 border-b border-gray-200 bg-white">
                  <SafeHtml html={DEFAULT_SYSTEM_HTML} />
                </div>
                {displayConversations?.length === 0 ? (
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
                    {displayConversations?.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation);
                      const unreadCount = getUnreadCount(conversation);
                      const lastMessage = conversation.messages?.[conversation.messages.length - 1];
                      const isIntercepted = conversation.isIntercepted;
                      // Prefer system/override sender label when present
                      const label =
                        lastMessage?.displayedSenderName ||
                        otherParticipant?.profile?.name ||
                        otherParticipant?.profile?.company ||
                        otherParticipant?.displayName ||
                        otherParticipant?.name ||
                        'Unknown User';
                      // Safe preview text (avoid rendering raw HTML from system messages)
                      const previewText = stripHtml(lastMessage?.content || lastMessage?.bodyHtml || '');
                      // Prefer sanitized HTML for preview when available
                      const lastBodyHtml = lastMessage?.bodyHtmlSafe || lastMessage?.bodyHtml;
                      // Detect virtual default system conversation injected by API
                      const isSystemVirtual = conversation.isSystemConversation === true || conversation._id === 'system-default';
                      const toHref = isSystemVirtual ? '/dashboard' : `/conversations/${conversation._id}`;
                      return (
                        <li key={conversation._id}>
                          <Link
                            to={toHref}
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
                                  <div className="flex items-center space-x-2">
                                    <p className={`text-sm font-medium ${
                                      unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {label}
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
                                    unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'
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
                                  <div className="mt-1">
                                    {lastBodyHtml ? (
                                      <div
                                        className={`text-sm ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'} truncate`}
                                      >
                                        <SafeHtml html={lastBodyHtml} />
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                          {lastMessage.sender === user.id && (
                                            <span className="text-gray-400">You: </span>
                                          )}
                                          {previewText || 'Attachment'}
                                        </p>
                                        {lastMessage.sender === user.id && lastMessage.read && (
                                          <CheckIcon className="ml-1 h-4 w-4 text-blue-600 flex-shrink-0" />
                                        )}
                                      </div>
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
              <div className="text-center max-w-md px-6">
                {/* Default system nudge */}
                <div className="mb-6 text-left bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <SafeHtml html={DEFAULT_SYSTEM_HTML} />
                </div>
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