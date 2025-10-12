import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useBranding } from '../../contexts/BrandingContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  InboxIcon,
  UserCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import SafeHtml from '../../components/SafeHtml';
import MessageCounter from '../../components/MessageCounter';
import { DEFAULT_SYSTEM_HTML } from '../../constants/systemHtml';
import useProfileCompletion, { PROFILE_GATE_THRESHOLD } from '../../hooks/useProfileCompletion';
import useMessageCounts from '../../hooks/useMessageCounts';
import { toast } from 'react-toastify';

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

// Demo archive simulation (persist across reloads)
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

// Unarchive button component with optimistic update
function UnarchiveButton({ convId, userId }) {
  const queryClient = useQueryClient();
  const { moveToInbox } = useMessageCounts();
  
  const mutate = useMutation(
    async () => {
      const res = await api.put(`/conversations/${convId}/unarchive`);
      return res.data.data;
    },
    {
      onMutate: async () => {
        await Promise.all([
          queryClient.cancelQueries(['conversations', 'archived', userId]),
          queryClient.cancelQueries(['conversations', 'active', userId])
        ]);
        const prevArchived = queryClient.getQueryData(['conversations', 'archived', userId]);
        const prevActive = queryClient.getQueryData(['conversations', 'active', userId]);
        // Optimistically remove from archived
        if (prevArchived?.data) {
          queryClient.setQueryData(['conversations', 'archived', userId], {
            ...prevArchived,
            data: prevArchived.data.filter((c) => c._id !== convId)
          });
        }
        // Optimistically update message counts
        moveToInbox();
        return { prevArchived, prevActive };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prevArchived) {
          queryClient.setQueryData(['conversations', 'archived', userId], ctx.prevArchived);
        }
        toast.error('Failed to unarchive conversation');
      },
      onSettled: () => {
        queryClient.invalidateQueries(['conversations', 'archived', userId]);
        queryClient.invalidateQueries(['conversations', 'active', userId]);
      }
    }
  );
  
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Demo simulation (no backend)
        if (convId.startsWith('demo-')) {
          const map = getDemoArchiveMap();
          if (map[convId]) {
            delete map[convId];
            setDemoArchiveMap(map);
          }
          toast.success('Conversation restored to Inbox');
          // Trigger list refresh and update counts
          queryClient.invalidateQueries(['conversations', 'archived', userId]);
          queryClient.invalidateQueries(['conversations', 'active', userId]);
          moveToInbox();
          return;
        }
        mutate.mutate();
      }}
      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
      title="Unarchive"
    >
      Unarchive
    </button>
  );
}

export default function Conversations() {
  const { branding } = useBranding();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = (searchParams.get('view') || 'inbox').toLowerCase();
  const view = viewParam === 'archived' ? 'archived' : 'inbox';
  const statusParam = view === 'archived' ? 'archived' : 'active';
  const userId = (user && (user.id || user._id)) || undefined;

  // Unified, normalized percent and eligibility (0–100 scale) with shared threshold
  const { percent: completionPercent, eligible } = useProfileCompletion();
  
  // Get message counts for real-time updates
  const { inboxCount, archivedCount, moveToArchived } = useMessageCounts();

  // Fetch Inbox (active) conversations
  const {
    data: activeResponse,
    isLoading: activeLoading,
    error: activeError
  } = useQuery(
    ['conversations', 'active', user?.id],
    async () => {
      const res = await api.get('/conversations', { params: { status: 'active' } });
      return res.data;
    },
    {
      enabled: !!user && eligible,
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch active conversations:', error);
      }
    }
  );

  // Fetch Archived conversations
  const {
    data: archivedResponse,
    isLoading: archivedLoading,
    error: archivedError
  } = useQuery(
    ['conversations', 'archived', user?.id],
    async () => {
      const res = await api.get('/conversations', { params: { status: 'archived' } });
      return res.data;
    },
    {
      enabled: !!user && eligible,
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      onError: (error) => {
        console.error('Failed to fetch archived conversations:', error);
      }
    }
  );

  // Archive conversation mutation with optimistic updates
  const archiveMutation = useMutation(
    async (convId) => {
      const res = await api.put(`/conversations/${convId}/archive`);
      return res.data.data;
    },
    {
      onMutate: async (convId) => {
        await Promise.all([
          queryClient.cancelQueries(['conversations', 'active', userId]),
          queryClient.cancelQueries(['conversations', 'archived', userId])
        ]);
        const prevActive = queryClient.getQueryData(['conversations', 'active', userId]);
        const prevArchived = queryClient.getQueryData(['conversations', 'archived', userId]);
        
        // Optimistically move from active to archived
        if (prevActive?.data) {
          queryClient.setQueryData(['conversations', 'active', userId], {
            ...prevActive,
            data: prevActive.data.filter((c) => c._id !== convId)
          });
        }
        
        // Optimistically update message counts
        moveToArchived();
        
        return { prevActive, prevArchived };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prevActive) {
          queryClient.setQueryData(['conversations', 'active', userId], ctx.prevActive);
        }
        toast.error('Failed to archive conversation');
      },
      onSettled: () => {
        queryClient.invalidateQueries(['conversations', 'active', userId]);
        queryClient.invalidateQueries(['conversations', 'archived', userId]);
      }
    }
  );

  const isVA = Boolean(
    user?.va ||
    user?.role === 'va' ||
    user?.profile?.type === 'va' ||
    user?.profile?.va
  );
  const profileCompletionPct = Math.round(completionPercent || 0);

  // Get real conversations from API responses
  const realActiveConversations = activeResponse?.data || [];
  const realArchivedConversations = archivedResponse?.data || [];
  const conversations =
    view === 'archived'
      ? realArchivedConversations
      : realActiveConversations;

  // Sample conversations for demonstration when no real conversations exist
  const getSampleConversations = () => {
    const demoMap = getDemoArchiveMap();
    if (isVA) {
      // Gate VA default messages until eligible
      if (!eligible) {
        return [];
      }
      // Once 80%+, show the EXACT two Linkage Admin default messages now used elsewhere
      const base = [
        {
          _id: 'demo-1',
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
              content:
                'Thank you for joining Linkage VA Hub! 🎉\n' +
                'We’re excited to have you onboard. Keep an eye on your inbox and messages, business owners may reach out soon with opportunities to contract your services.\n' +
                'If you have any questions about your VA profile or upcoming job offers, our support team is always here to help.',
              bodyHtml:
                '<p>Thank you for joining <strong>Linkage VA Hub</strong>! 🎉</p>' +
                '<p>We’re excited to have you onboard. Keep an eye on your inbox and messages, business owners may reach out soon with opportunities to contract your services.</p>' +
                '<p>If you have any questions about your VA profile or upcoming job offers, our support team is always here to help.</p>',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          ],
          lastMessage:
            'Thank you for joining Linkage VA Hub! 🎉 We’re excited to have you onboard. Keep an eye on your inbox and messages, business owners may reach out soon with opportunities to contract your services. If you have any questions about your VA profile or upcoming job offers, our support team is always here to help.',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'demo-2',
          participants: [user.id, 'admin-2'],
          business: {
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
              content:
                'Welcome to Linkage VA Hub! 🎉\n' +
                'We’re thrilled to have you on board. Keep an eye out for messages from business owners who may be interested in contracting your services.\n' +
                'To increase your chances of landing job opportunities, join our community, it’s where VAs get priority access to employment opportunities!',
              bodyHtml:
                '<p>Welcome to <strong>Linkage VA Hub</strong>! 🎉</p>' +
                '<p>We’re thrilled to have you on board. Keep an eye out for messages from business owners who may be interested in contracting your services.</p>' +
                '<p>To increase your chances of landing job opportunities, join our <a href="/community">community</a>, it’s where VAs get priority access to employment opportunities!</p>',
              createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
            }
          ],
          lastMessage:
            'Welcome to Linkage VA Hub! 🎉 We’re thrilled to have you on board. Keep an eye out for messages from business owners who may be interested in contracting your services. To increase your chances of landing job opportunities, join our community, it’s where VAs get priority access to employment opportunities!',
          lastMessageAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 1 }
        }
      ];
      return base.map((c) => ({ ...c, status: demoMap[c._id] ? 'archived' : 'active' }));
    } else {
      // Sample conversations for businesses
      const base = [
        {
          _id: 'demo-1',
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
              sender: 'admin-1',
              content:
                'Thank you for joining Linkage VA Hub! 🎉\n' +
                'We’re excited to have you onboard. Keep an eye on your messages — you may hear from VAs soon.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
          ],
          lastMessage: 'Thank you for joining Linkage VA Hub! 🎉 We’re excited to have you onboard. Keep an eye on your messages — you may hear from VAs soon.',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 0, business: 1 }
        },
        {
          _id: 'demo-2',
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
              content: 'Welcome! If you need help posting a role or contacting VAs, our team is here to assist.',
              createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
            }
          ],
          lastMessage: 'Welcome! If you need help posting a role or contacting VAs, our team is here to assist.',
          lastMessageAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'active',
          unreadCount: { va: 1, business: 1 }
        }
      ];
      return base.map((c) => ({ ...c, status: demoMap[c._id] ? 'archived' : 'active' }));
    }
  };

  // Use sample conversations if there are no real ones (only when eligible), and filter by view
  const sampleList = getSampleConversations();
  const sampleFiltered = sampleList.filter((c) =>
    view === 'archived' ? c.status === 'archived' : c.status !== 'archived'
  );
  
  // Determine which conversations to display:
  // 1. If not eligible, show empty array (gated view will render)
  // 2. If eligible and we have real conversations, show them
  // 3. If eligible but no real conversations (or error), show samples
  const hasRealConversations = conversations && conversations.length > 0;
  const displayConversations = eligible
    ? (hasRealConversations ? conversations : sampleFiltered)
    : [];

  const getOtherParticipant = (conversation) => {
    if (isVA) {
      return conversation.business;
    } else {
      return conversation.va;
    }
  };

  const getUnreadCount = (conversation) => {
    if (isVA) {
      return conversation.unreadCount?.va || 0;
    } else {
      return conversation.unreadCount?.business || 0;
    }
  };

  const conversationsLoading = view === 'archived' ? archivedLoading : activeLoading;
  if (eligible && conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Render gated view until eligible (percent >= threshold)
  if (!eligible) {
    return (
      <>
        <Helmet>
          <title>Messages - {branding.name}</title>
        </Helmet>

        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-blue-100 p-4">
                  <InboxIcon className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to your messages
              </h2>
              
              <p className="text-lg text-gray-700 mb-6">
                To get started, visit your <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 font-semibold underline">Dashboard</Link> to complete your profile and begin conversations.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-sm font-semibold text-gray-900">Profile Completion Required</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Your profile is currently <span className="font-bold text-blue-600">{profileCompletionPct || 0}%</span> complete. 
                  You need <span className="font-bold">{PROFILE_GATE_THRESHOLD}%</span> or higher completion to access messaging.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletionPct || 0}%` }}
                  />
                </div>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Complete Your Profile
                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </>
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
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <InboxIcon className="h-7 w-7 mr-2" />
                    Messages
                    {user.admin && (
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Admin View
                      </span>
                    )}
                  </h1>
                </div>
                
                {/* Message Counter */}
                <div className="mb-4">
                  <MessageCounter 
                    compact={true}
                    showLabels={false}
                    showTotal={false}
                    className="justify-start"
                  />
                </div>

                {/* Tabs: Inbox / Archived with real-time counts */}
                <div className="flex items-center space-x-2">
                  <button
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'inbox' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setSearchParams({ view: 'inbox' })}
                  >
                    Inbox ({inboxCount})
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'archived' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setSearchParams({ view: 'archived' })}
                  >
                    Archived ({archivedCount})
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {displayConversations?.length || 0} conversation{displayConversations?.length !== 1 && 's'} in {view}
                </p>
              </div>

              <div className="overflow-y-auto h-full pb-20">
                {/* Mobile-only system nudge - show only when not eligible */}
                {!eligible && (
                  <div className="md:hidden px-6 py-3 border-b border-gray-200 bg-white">
                    <SafeHtml html={DEFAULT_SYSTEM_HTML} />
                  </div>
                )}
                {displayConversations?.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {isVA 
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
                                  <div className="flex items-center space-x-2">
                                    <p className={`text-xs ${
                                      unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'
                                    }`}>
                                      {conversation.lastMessageAt &&
                                        formatDistanceToNow(new Date(conversation.lastMessageAt), {
                                          addSuffix: true
                                        })}
                                    </p>
                                    {/* Archive/Unarchive controls */}
                                    {view === 'inbox' && conversation.status === 'active' && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          archiveMutation.mutate(conversation._id);
                                        }}
                                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        title="Archive"
                                      >
                                        Archive
                                      </button>
                                    )}
                                    {view === 'archived' && (
                                      <UnarchiveButton convId={conversation._id} userId={userId} />
                                    )}
                                  </div>
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
                {/* Default system nudge - only when not eligible */}
                {!eligible && (
                  <div className="mb-6 text-left bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    <SafeHtml html={DEFAULT_SYSTEM_HTML} />
                  </div>
                )}
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
