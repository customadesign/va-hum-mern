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

  const { data: conversation, isLoading } = useQuery(
    ['conversation', id],
    async () => {
      const response = await api.get(`/conversations/${id}`);
      return response.data.data;
    },
    {
      refetchInterval: 5000 // Poll for new messages every 5 seconds
    }
  );

  const sendMessageMutation = useMutation(
    async (messageText) => {
      const response = await api.post(`/conversations/${id}/messages`, {
        message: messageText
      });
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['conversation', id]);
        queryClient.invalidateQueries('conversations');
        setMessage('');
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
    if (user.profile?.va) {
      return conversation?.business;
    } else {
      return conversation?.va;
    }
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
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <div className="flex items-center space-x-3">
                <Link
                  to="/conversations"
                  className="text-gray-400 hover:text-gray-500"
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
                    <UserCircleIcon className="h-7 w-7 text-gray-500" />
                  </div>
                )}
                
                <div>
                  <h1 className="text-lg font-medium text-gray-900 flex items-center">
                    {otherParticipant?.profile?.name || otherParticipant?.profile?.company || 'Unknown User'}
                    {otherParticipant?.admin && (
                      <CheckBadgeIcon className="h-5 w-5 text-purple-600 ml-1" />
                    )}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {otherParticipant?.profile?.hero || otherParticipant?.email}
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-gray-400 hover:text-gray-500"
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
                    <p className="text-xs text-gray-600">
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
                    const isCurrentUser = msg.sender === user.id || msg.sender._id === user.id;
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
                                <UserCircleIcon className="h-5 w-5 text-gray-500" />
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
                            <p className="text-xs text-gray-500 mt-1">
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