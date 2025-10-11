import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { useBranding } from '../../contexts/BrandingContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  // Back-compat: if a legacy sample-* path is hit, redirect to list to avoid any raw URL text rendering
  useEffect(() => {
    if (id && id.startsWith('sample-')) {
      navigate('/conversations');
    }
  }, [id, navigate]);

  const { data: conversation, isLoading } = useQuery(
    ['conversation', id],
    async () => {
      // Check if this is a demo conversation ID
      if (id.startsWith('demo-')) {
        return getSampleConversation(id);
      }
      const response = await api.get(`/conversations/${id}`);
      return response.data.data;
    },
    {
      refetchInterval: id.startsWith('sample-') ? false : 5000 // Don't poll for sample conversations
    }
  );

  // Get sample conversation data by ID
  const getSampleConversation = (sampleId) => {
    const sampleConversations = getSampleConversations();
    return sampleConversations.find(conv => conv._id === sampleId);
  };

  // Sample conversations helper function (same as in index.js)
  const getSampleConversations = () => {
    if (user.profile?.va) {
      // Sample conversations for VAs
      return [
        {
          _id: 'demo-1',
          participants: [user.id, 'business-1'],
          business: {
            _id: 'business-1',
            email: 'contact@techcorp.com',
            profile: {
              name: 'TechCorp Solutions',
              company: 'TechCorp Solutions',
              avatar: null,
              hero: 'Leading technology consulting firm'
            }
          },
          messages: [
            {
              _id: 'msg-1',
              sender: 'business-1',
              content: 'Hi! I saw your profile and I\'m impressed with your skills. We have a project that might be a perfect fit for you.',
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
              sender: 'business-1',
              content: 'We need help with social media management and content creation for our new product launch. The project would run for 3 months.',
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }
          ],
          lastMessage: 'We need help with social media management and content creation for our new product launch. The project would run for 3 months.',
          lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 0 }
        },
        {
          _id: 'demo-2',
          participants: [user.id, 'business-2'],
          business: {
            _id: 'business-2',
            email: 'hiring@creativestudio.com',
            profile: {
              name: 'Creative Studio',
              company: 'Creative Studio',
              avatar: null,
              hero: 'Digital marketing and design agency'
            }
          },
          messages: [
            {
              _id: 'msg-4',
              sender: 'business-2',
              content: 'Hello! Are you available for a long-term virtual assistant position?',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
            },
            {
              _id: 'msg-5',
              sender: user.id,
              content: 'Hi there! Yes, I\'m currently available. What does the position involve?',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
            }
          ],
          lastMessage: 'Hi there! Yes, I\'m currently available. What does the position involve?',
          lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'demo-3',
          participants: [user.id, 'business-3'],
          business: {
            _id: 'business-3',
            email: 'team@startupventure.io',
            profile: {
              name: 'Startup Venture',
              company: 'Startup Venture',
              avatar: null,
              hero: 'Fast-growing SaaS startup'
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
          _id: 'demo-1',
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
          _id: 'demo-2',
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

  const sendMessageMutation = useMutation(
    async (messageText) => {
      // Handle sample conversation messages
      if (id.startsWith('sample-')) {
        // Simulate sending a message in a sample conversation
        return {
          _id: 'new-msg-' + Date.now(),
          sender: user.id,
          content: messageText,
          createdAt: new Date()
        };
      }
      const response = await api.post(`/conversations/${id}/messages`, {
        message: messageText
      });
      return response.data.data;
    },
    {
      onSuccess: (newMessage) => {
        if (id.startsWith('sample-')) {
          // For sample conversations, show a demo message
          toast.info('This is a demo conversation. In a real conversation, your message would be sent.');
          setMessage('');
        } else {
          queryClient.invalidateQueries(['conversation', id]);
          queryClient.invalidateQueries('conversations');
          setMessage('');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send message');
      }
    }
  );

  const archiveConversationMutation = useMutation(
    async () => {
      const response = await api.put(`/conversations/${id}/archive`);
      return response.data.data;
    },
    {
      onSuccess: () => {
        toast.success('Conversation archived');
        navigate('/conversations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to archive conversation');
      }
    }
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const getOtherParticipant = () => {
    // Prefer admin participant when present (E Systems Admin)
    if (conversation?.business?.admin) return conversation.business;
    if (conversation?.va?.admin) return conversation.va;
    // Fallback to role-based other participant
    return user.profile?.va ? conversation?.business : conversation?.va;
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday ' + format(messageDate, 'h:mm a');
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages?.forEach(msg => {
      const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();
  const messageGroups = groupMessagesByDate(conversation?.messages || []);

  return (
    <>
      <Helmet>
        <title>
          {otherParticipant?.profile?.name || otherParticipant?.profile?.company || 'Conversation'} - {branding.name}
        </title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Demo Banner for Sample Conversations */}
        {id.startsWith('sample-') && (
          <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              This is a demo conversation to show how messaging works. Try typing a message!
            </span>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <div className="flex items-center space-x-3">
                <Link
                  to="/conversations"
                  className="text-gray-700 hover:text-gray-700"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                
                {otherParticipant?.profile?.avatar ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={otherParticipant.profile.avatar}
                    alt=""
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserCircleIcon className="h-7 w-7 text-gray-700" />
                  </div>
                )}
                
                <div>
                  <h1 className="text-lg font-medium text-gray-900 flex items-center">
                    {otherParticipant?.profile?.name 
                      || otherParticipant?.name 
                      || otherParticipant?.profile?.company 
                      || otherParticipant?.email 
                      || (otherParticipant?.admin ? 'E Systems Admin' : 'Unknown User')}
                    {otherParticipant?.admin && (
                      <CheckBadgeIcon className="h-5 w-5 text-purple-600 ml-1" />
                    )}
                  </h1>
                  <p className="text-sm text-gray-700">
                    {otherParticipant?.profile?.hero || otherParticipant?.email}
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-gray-700 hover:text-gray-700"
                >
                  <EllipsisVerticalIcon className="h-6 w-6" />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => archiveConversationMutation.mutate()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <ArchiveBoxIcon className="h-4 w-4 mr-3" />
                        Archive conversation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {Object.entries(messageGroups).map(([date, messages]) => (
              <div key={date}>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gray-200 rounded-full px-3 py-1">
                    <p className="text-xs text-gray-700">
                      {isToday(new Date(date)) 
                        ? 'Today' 
                        : isYesterday(new Date(date)) 
                        ? 'Yesterday' 
                        : format(new Date(date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {messages.map((msg, idx) => {
                    const myId = (user && (user.id || user._id)) || null;
                    const senderId = typeof msg.sender === 'string' 
                      ? msg.sender 
                      : (msg.sender?._id || msg.sender?.id);
                    const isCurrentUser = !!myId && senderId === myId;
                    const showAvatar = idx === 0 || messages[idx - 1].sender !== msg.sender;
                    
                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                          isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          {showAvatar && !isCurrentUser && (
                            otherParticipant?.profile?.avatar ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                src={otherParticipant.profile.avatar}
                                alt=""
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                <UserCircleIcon className="h-5 w-5 text-gray-700" />
                              </div>
                            )
                          )}
                          
                          {!showAvatar && !isCurrentUser && (
                            <div className="w-8 h-8 flex-shrink-0" />
                          )}
                          
                          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2 rounded-2xl ${
                              isCurrentUser 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-900 shadow-sm'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">
                              {formatMessageTime(msg.createdAt)}
                              {isCurrentUser && msg.read && ' • Read'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  className="block w-full resize-none border-gray-300 rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type a message..."
                  disabled={sendMessageMutation.isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isLoading}
                className="inline-flex items-center justify-center p-3 rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}