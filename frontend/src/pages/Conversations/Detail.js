import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import SafeHtml from '../../components/SafeHtml';
import { initSocket, joinConversation, leaveConversation, typingStart, typingStop } from '../../services/socket';

// Allowlist sanitizer for controlled system HTML: keep only <a> with safe attributes
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
    return (html || '').replace(/<[^>]*>/g, '');
  }
}

// ===== Demo archive simulation (persist across reloads) =====
const DEMO_ARCHIVE_KEY = 'linkage_demo_archived_v1';
function getDemoArchiveMap() {
  try {
    const raw = localStorage.getItem(DEMO_ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function setDemoArchiveMap(map) {
  try {
    localStorage.setItem(DEMO_ARCHIVE_KEY, JSON.stringify(map));
  } catch {
    // no-op
  }
}

export default function ConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const userId = user?.id || user?._id;

  // Back-compat: if legacy sample-* slug is visited, redirect to list to avoid raw text rendering
  useEffect(() => {
    if (id && id.startsWith('sample-')) {
      navigate('/conversations');
    }
  }, [id, navigate]);

  // Demo conversations use demo-* slugs; never render route text in UI
  const isSampleConversation = id.startsWith('demo-');
  const demoArchived = isSampleConversation ? Boolean(getDemoArchiveMap()[id]) : false;
  const isVA = Boolean(
    user?.va ||
    user?.role === 'va' ||
    user?.profile?.type === 'va' ||
    user?.profile?.va
  );

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data;
    },
    enabled: Boolean(userId && isVA)
  });

  const profileCompletionPct = profileData?.profileCompletion?.percentage ?? 0;
  const canViewSampleConversations = !isVA || profileCompletionPct >= 80;

  const getSampleConversations = useCallback(() => {
    if (!userId) {
      return [];
    }

    if (isVA) {
      if (!canViewSampleConversations) {
        return [];
      }
      // Sample conversations for VAs
      return [
        {
          _id: 'demo-1',
          participants: [userId, 'admin-1'],
          business: {
            _id: 'admin-1',
            email: 'support@linkage.com',
            profile: {
              name: 'Linkage Admin',
              company: 'Linkage',
              avatar: null,
              hero: 'Linkage Support Team'
            }
          },
          messages: [
            {
              _id: 'msg-1',
              sender: 'admin-1',
              content: 'Welcome to Linkage! We\'re here to help you connect with great business opportunities. Feel free to reach out if you have any questions.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
              _id: 'msg-2',
              sender: userId,
              content: 'Thank you! I appreciate the warm welcome. I\'m excited to get started.',
              createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
            },
            {
              _id: 'msg-3',
              sender: 'admin-1',
              content: 'That\'s great to hear! Make sure to keep your profile updated with your latest skills and experience. This helps businesses find you more easily.',
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }
          ],
          lastMessage: 'That\'s great to hear! Make sure to keep your profile updated with your latest skills and experience. This helps businesses find you more easily.',
          lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 0 }
        },
        {
          _id: 'demo-2',
          participants: [userId, 'admin-2'],
          business: {
            _id: 'admin-2',
            email: 'support@linkage.com',
            profile: {
              name: 'Linkage Admin',
              company: 'Linkage',
              avatar: null,
              hero: 'Linkage Support Team'
            }
          },
          messages: [
            {
              _id: 'msg-4',
              sender: 'admin-2',
              content: 'Quick tip: Responding promptly to business inquiries increases your chances of landing great projects!',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
            },
            {
              _id: 'msg-5',
              sender: userId,
              content: 'Thanks for the advice! I\'ll make sure to check my messages regularly.',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
            }
          ],
          lastMessage: 'Thanks for the advice! I\'ll make sure to check my messages regularly.',
          lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'demo-3',
          participants: [userId, 'business-3'],
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
              sender: userId,
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
          participants: [userId, 'admin-1'],
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
              sender: userId,
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
          _id: 'demo-2',
          participants: [userId, 'admin-2'],
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
  }, [userId, isVA, canViewSampleConversations]);

  const sampleConversation = useMemo(() => {
    if (!isSampleConversation) {
      return null;
    }
    const samples = getSampleConversations();
    return samples.find((conv) => conv._id === id) || null;
  }, [id, isSampleConversation, getSampleConversations]);

  const { data: apiConversation, isLoading: isConversationLoading } = useQuery(
    ['conversation', id],
    async () => {
      try {
        const response = await api.get(`/conversations/${id}`);
        return response.data.data;
      } catch (err) {
        // Check if this is a gating error (for business users)
        if (err.response?.status === 403 && err.response?.data?.gated) {
          // Redirect to conversations list where gated view will show
          toast.info('Please complete your profile to access messages');
          navigate('/conversations');
          throw err;
        }
        throw err;
      }
    },
    {
      enabled: !isSampleConversation,
      refetchInterval: isSampleConversation ? false : 5000,
      retry: (failureCount, error) => {
        // Don't retry on gating errors
        if (error?.response?.status === 403 && error?.response?.data?.gated) {
          return false;
        }
        return failureCount < 3;
      }
    }
  );

  const conversation = isSampleConversation
    ? (sampleConversation ? { ...sampleConversation, status: demoArchived ? 'archived' : 'active' } : null)
    : apiConversation;
  const isLoading = (!isSampleConversation && isConversationLoading) ||
    (isSampleConversation && isVA && isProfileLoading);

  const sendMessageMutation = useMutation(
    async (messageText) => {
      // Handle sample conversation messages
      if (isSampleConversation) {
        // Simulate sending a message in a sample conversation
        return {
          _id: 'new-msg-' + Date.now(),
          sender: userId,
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
      onMutate: async (messageText) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(['conversation', id]);

        // Snapshot the previous value
        const previous = queryClient.getQueryData(['conversation', id]);

        // Optimistically update to the new value
        const tempId = 'temp-' + Date.now();
        const optimisticMsg = {
          _id: tempId,
          sender: userId,
          content: messageText,
          createdAt: new Date().toISOString(),
          status: 'sending'
        };

        if (previous) {
          const updated = {
            ...previous,
            messages: [...(previous.messages || []), optimisticMsg],
            lastMessage: messageText,
            lastMessageAt: new Date().toISOString()
          };
          queryClient.setQueryData(['conversation', id], updated);
        }

        // Return a context with the previous data to roll back if needed
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(['conversation', id], context.previous);
        }
        toast.error('Failed to send message');
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries(['conversation', id]);
      },
      onSuccess: (newMessage) => {
        if (isSampleConversation) {
          // For sample conversations, show a demo message
          toast.info('This is a demo conversation. In a real conversation, your message would be sent.');
          setMessage('');
        } else {
          setMessage('');
        }
      }
    }
  );

  const archiveConversationMutation = useMutation(
    async () => {
      const response = await api.put(`/conversations/${id}/archive`);
      return response.data.data;
    },
    {
      onMutate: async () => {
        const uid = user?.id || user?._id;
        await Promise.all([
          queryClient.cancelQueries(['conversations', 'active', uid]),
          queryClient.cancelQueries(['conversations', 'archived', uid])
        ]);
      },
      onSuccess: () => {
        const uid = user?.id || user?._id;
        queryClient.invalidateQueries(['conversations', 'active', uid]);
        queryClient.invalidateQueries(['conversations', 'archived', uid]);
        navigate('/conversations?view=archived');
      },
      onError: (error) => {
        toast.error(error?.response?.data?.error || error?.message || 'Failed to archive conversation');
      }
    }
  );

  const unarchiveConversationMutation = useMutation(
    async () => {
      const response = await api.put(`/conversations/${id}/unarchive`);
      return response.data.data;
    },
    {
      onMutate: async () => {
        const uid = user?.id || user?._id;
        await Promise.all([
          queryClient.cancelQueries(['conversations', 'active', uid]),
          queryClient.cancelQueries(['conversations', 'archived', uid])
        ]);
      },
      onSuccess: () => {
        const uid = user?.id || user?._id;
        queryClient.invalidateQueries(['conversations', 'active', uid]);
        queryClient.invalidateQueries(['conversations', 'archived', uid]);
        navigate('/conversations?view=inbox');
      },
      onError: (error) => {
        toast.error(error?.response?.data?.error || error?.message || 'Failed to unarchive conversation');
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
    // Check if the conversation has a system user participant
    if (conversation?.participants) {
      const systemUser = conversation.participants.find(p => 
        p.email === 'system@linkagevahub.com' || p.name === 'Linkage Admin'
      );
      if (systemUser) {
        return systemUser;
      }
    }
    
    // Fallback to original logic
    if (isVA) {
      return conversation?.business;
    } else {
      return conversation?.va;
    }
  };

  // Check if the other participant is the system user
  const isSystemUser = (participant) => {
    return participant?.email === 'system@linkagevahub.com' || participant?.name === 'Linkage Admin';
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

  // Initialize socket and join conversation room, handle typing status updates
  useEffect(() => {
    if (isSampleConversation && isVA && !canViewSampleConversations) {
      return undefined;
    }

    const socket = initSocket();
    joinConversation(id);

    const handleTypingStatus = (payload) => {
      try {
        const { conversationId, userId: typerId, isTyping } = payload || {};
        const currentUserId = userId;
        if (!conversationId || conversationId !== id) return;
        if (typerId && currentUserId && typerId.toString() === currentUserId.toString()) return;
        setIsOtherTyping(!!isTyping);
      } catch (e) {
        // no-op
      }
    };

    socket.on('typing_status', handleTypingStatus);

    return () => {
      socket.off('typing_status', handleTypingStatus);
      leaveConversation(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId, isSampleConversation, isVA, canViewSampleConversations]);

  const emitTyping = () => {
    const currentUserId = userId;
    if (!currentUserId) return;
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      typingStart(id, currentUserId);
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      typingStop(id, currentUserId);
    }, 1200);
  };

  if (isSampleConversation && isVA && !isProfileLoading && !canViewSampleConversations) {
    return (
      <>
        <Helmet>
          <title>Complete Your Profile - {branding.name}</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Finish Your Profile to Unlock Demo Messages</h1>
            <p className="mt-4 text-sm text-gray-600">
              Demo conversations unlock once your virtual assistant profile is at least 80% complete.
              Head back to your profile to finish the remaining sections and preview sample messages.
            </p>
            <div className="mt-6 flex flex-col space-y-3">
              <Link
                to="/profile-setup"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Continue Profile Setup
              </Link>
              <Link
                to="/conversations"
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Messages
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <>
        <Helmet>
          <title>Conversation Not Found - {branding.name}</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900">We couldn&apos;t find that conversation</h1>
            <p className="mt-4 text-sm text-gray-600">
              It may have been removed or you might not have access to view it. Please return to your messages and try again.
            </p>
            <div className="mt-6">
              <Link
                to="/conversations"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Messages
              </Link>
            </div>
          </div>
        </div>
      </>
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
        {isSampleConversation && (
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
                  className="text-gray-400 hover:text-gray-500"
                  data-testid="back-to-list"
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
                    {isSystemUser(otherParticipant) 
                      ? 'Linkage Admin' 
                      : (otherParticipant?.profile?.name || otherParticipant?.profile?.company || 'Unknown User')
                    }
                    {otherParticipant?.admin && (
                      <CheckBadgeIcon className="h-5 w-5 text-purple-600 ml-1" />
                    )}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isSystemUser(otherParticipant) 
                      ? 'system@linkagevahub.com' 
                      : (otherParticipant?.profile?.hero || otherParticipant?.email)
                    }
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-gray-400 hover:text-gray-500"
                  data-testid="options-toggle"
                >
                  <EllipsisVerticalIcon className="h-6 w-6" />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {(conversation?.status === 'archived') ? (
                        <button
                          onClick={() => {
                            if (isSampleConversation) {
                              // Demo simulation (client-only)
                              const map = getDemoArchiveMap();
                              if (map[id]) {
                                delete map[id];
                                setDemoArchiveMap(map);
                              }
                              const uid = user?.id || user?._id;
                              toast.success('Conversation restored to Inbox');
                              // Update cached detail and lists
                              queryClient.setQueryData(['conversation', id], { ...(conversation || {}), status: 'active' });
                              queryClient.invalidateQueries(['conversations', 'active', uid]);
                              queryClient.invalidateQueries(['conversations', 'archived', uid]);
                              setShowOptions(false);
                              navigate('/conversations?view=inbox');
                              return;
                            }
                            unarchiveConversationMutation.mutate();
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          data-testid="unarchive-conversation"
                        >
                          <ArchiveBoxIcon className="h-4 w-4 mr-3" />
                          Unarchive conversation
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (isSampleConversation) {
                              // Demo simulation (client-only)
                              const map = getDemoArchiveMap();
                              map[id] = true;
                              setDemoArchiveMap(map);
                              const uid = user?.id || user?._id;
                              toast.success('Conversation archived');
                              // Update cached detail and lists
                              queryClient.setQueryData(['conversation', id], { ...(conversation || {}), status: 'archived' });
                              queryClient.invalidateQueries(['conversations', 'active', uid]);
                              queryClient.invalidateQueries(['conversations', 'archived', uid]);
                              setShowOptions(false);
                              navigate('/conversations?view=archived');
                              return;
                            }
                            archiveConversationMutation.mutate();
                          }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          data-testid="archive-conversation"
                        >
                          <ArchiveBoxIcon className="h-4 w-4 mr-3" />
                          Archive conversation
                        </button>
                      )}
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
                    const isCurrentUser = msg.sender === userId || msg.sender?._id === userId;
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
                              {msg.bodyHtml || msg.bodyHtmlSafe ? (
                                <div className="text-sm">
                                  <SafeHtml html={msg.bodyHtmlSafe || msg.bodyHtml} />
                                </div>
                              ) : (
                                <p className="text-sm">{msg.content}</p>
                              )}
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
            {/* Typing indicator */}
            {isOtherTyping && (
              <div className="mt-2 text-xs text-gray-500 italic">
                Typing...
              </div>
            )}
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
                  onChange={(e) => {
                    setMessage(e.target.value);
                    emitTyping();
                  }}
                  onKeyDown={(e) => {
                    // Emit typing for normal keystrokes
                    if (!(e.key === 'Enter' && !e.shiftKey)) {
                      emitTyping();
                    }
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
