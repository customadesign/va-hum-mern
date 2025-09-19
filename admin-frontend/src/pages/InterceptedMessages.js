import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentTextIcon,
  InboxIcon,
  ChatBubbleOvalLeftIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  FunnelIcon,
  StarIcon,
  BellIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { interceptAPI } from '../services/api';
import { toast } from 'react-toastify';

// Status color mapping with gradients and dark mode support
const statusConfig = {
  pending: {
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: ClockIcon,
    label: 'Pending',
    textColor: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
  },
  forwarded: {
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: ArrowRightIcon,
    label: 'Forwarded',
    textColor: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
  },
  replied: {
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircleIcon,
    label: 'Replied',
    textColor: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
  },
  resolved: {
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: CheckBadgeIcon,
    label: 'Resolved',
    textColor: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700'
  },
  spam: {
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: ExclamationTriangleIcon,
    label: 'Spam',
    textColor: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
  },
  // Default fallback for any undefined status
  default: {
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: InboxIcon,
    label: 'Unknown',
    textColor: 'text-gray-700 dark:text-gray-400',
    badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700'
  }
};

// Helper function to get status config safely
const getStatusConfig = (status) => {
  return statusConfig[status] || statusConfig.default;
};

const InterceptedMessages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const chatSectionRef = useRef(null);
  
  // State management
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const [forwardMessage, setForwardMessage] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [directChatMessage, setDirectChatMessage] = useState('');
  const [showDirectChatModal, setShowDirectChatModal] = useState(false);
  const [selectedVAForDirectChat, setSelectedVAForDirectChat] = useState(null);
  const [starredConversations, setStarredConversations] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showNotifications, setShowNotifications] = useState(true);
  const [viewMode, setViewMode] = useState('split'); // split, list, or chat
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readConversations, setReadConversations] = useState(new Set());
  const [animatingUnreadCount, setAnimatingUnreadCount] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(new Set()); // Track which users are typing
  const [optimisticMessages, setOptimisticMessages] = useState(new Map()); // Map conversationId -> messages[]
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const conversationParam = searchParams.get('conversation');

  // Fetch intercepted conversations with auto-refresh
  const { data: conversationsResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['intercepted-conversations'],
    queryFn: async () => {
      const response = await interceptAPI.getInterceptedConversations();
      return response.data;
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
   
  const conversations = conversationsResponse?.data?.conversations || [];
  const apiStats = conversationsResponse?.data?.statusCounts || {
    all: 0, pending: 0, forwarded: 0, replied: 0, resolved: 0, spam: 0
  };
  const unreadCount = conversationsResponse?.data?.unreadCount || 0;
  
  // Calculate unread count per conversation
  const conversationUnreadCounts = useMemo(() => {
    const counts = {};
    conversations.forEach(conv => {
      // Count unread messages in this conversation
      let unreadInConv = 0;
      if (conv.messages && Array.isArray(conv.messages)) {
        unreadInConv = conv.messages.filter(msg => {
          // Check if message is from business and not read
          const isFromBusiness = msg.sender?._id === conv.business?._id || 
                               msg.sender === conv.business?._id ||
                               msg.sender?.toString() === conv.business?.toString() ||
                               msg.sender === 'business';
          return !msg.read && isFromBusiness;
        }).length;
      }
      // Prefer the unreadCount.admin field if available, otherwise use calculated count
      counts[conv._id] = conv.unreadCount?.admin !== undefined ? conv.unreadCount.admin : unreadInConv;
    });
    return counts;
  }, [conversations]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationParam && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationParam);
      if (conversation) {
        handleSelectConversation(conversation);
        navigate('/messenger-chat', { replace: true });
      }
    }
  }, [conversationParam, conversations, navigate]);
  
  // Animate unread count changes
  useEffect(() => {
    if (previousUnreadCount !== unreadCount) {
      setAnimatingUnreadCount(true);
      const timer = setTimeout(() => {
        setAnimatingUnreadCount(false);
        setPreviousUnreadCount(unreadCount);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, previousUnreadCount]);
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // Get the base URL for the socket connection
    const socketUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:5001'
      : (process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin);
    
    // Initialize socket connection
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    // Listen for admin unread updates
    socketRef.current.on('admin_unread_update', (data) => {
      console.log('Received admin unread update:', data);
      
      // Update the unread count animation
      if (data.unreadCount !== undefined) {
        setPreviousUnreadCount(unreadCount);
        setAnimatingUnreadCount(true);
        setTimeout(() => setAnimatingUnreadCount(false), 600);
      }
      
      // If a specific conversation was marked as read, update our local state
      if (data.action === 'read' && data.conversationId) {
        setReadConversations(prev => new Set([...prev, data.conversationId]));
      }
      
      // Refresh the conversations list to get updated data
      queryClient.invalidateQueries({ queryKey: ['intercepted-conversations'] });
    });
    
    // Listen for new messages
    socketRef.current.on('new_intercepted_message', (data) => {
      console.log('New intercepted message:', data);
      
      // Show notification for new message
      toast.info('New message intercepted', {
        icon: '📨',
        position: 'top-center',
        autoClose: 3000
      });
      
      // Refresh conversations to get the new message
      queryClient.invalidateQueries({ queryKey: ['intercepted-conversations'] });
    });

    // Listen for typing status from other users
    socketRef.current.on('typing_status', (data) => {
      if (data.conversationId && data.userId !== user?.id) {
        setOtherUserTyping(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(`${data.conversationId}-${data.userId}`);
          } else {
            newSet.delete(`${data.conversationId}-${data.userId}`);
          }
          return newSet;
        });
        
        // Auto-clear typing after 3 seconds
        if (data.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(prev => {
              const newSet = new Set(prev);
              newSet.delete(`${data.conversationId}-${data.userId}`);
              return newSet;
            });
          }, 3000);
        }
      }
    });
    
    // Clean up socket connection on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [queryClient, unreadCount]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (conversationsResponse && !isLoading && !isFetching) {
      setLastRefreshed(new Date());
    }
  }, [conversationsResponse, isLoading, isFetching]);

  // Filter and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = [...conversations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.business?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.business?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.va?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.va?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.va?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      // Check both status and adminStatus fields for compatibility
      filtered = filtered.filter(conv => 
        conv.status === filterStatus || conv.adminStatus === filterStatus
      );
    }

    // Apply priority filter
    if (selectedPriority === 'starred') {
      filtered = filtered.filter(conv => starredConversations.has(conv._id));
    } else if (selectedPriority === 'urgent') {
      const status = conv => conv.adminStatus || conv.status || '';
      filtered = filtered.filter(conv => {
        const convStatus = status(conv);
        return convStatus === 'pending' || convStatus === 'forwarded';
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt || b.lastMessageAt) - new Date(a.updatedAt || a.lastMessageAt);
        case 'oldest':
          return new Date(a.updatedAt || a.lastMessageAt) - new Date(b.updatedAt || b.lastMessageAt);
        case 'business':
          const businessNameA = a.business?.company || a.business?.name || '';
          const businessNameB = b.business?.company || b.business?.name || '';
          return businessNameA.localeCompare(businessNameB);
        case 'va':
          const vaNameA = a.va?.firstName || a.va?.name || '';
          const vaNameB = b.va?.firstName || b.va?.name || '';
          return vaNameA.localeCompare(vaNameB);
        case 'status':
          const statusA = a.adminStatus || a.status || '';
          const statusB = b.adminStatus || b.status || '';
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [conversations, searchTerm, filterStatus, selectedPriority, sortBy, starredConversations]);

  // Mutations
  const forwardMutation = useMutation({
    mutationFn: async ({ conversationId, message, includeContext }) => {
      return await interceptAPI.forwardToVA(conversationId, { message, includeContext });
    },
    onSuccess: () => {
      toast.success('Message forwarded to VA successfully', {
        icon: '🚀',
        position: 'top-center',
        autoClose: 3000
      });
      queryClient.invalidateQueries({ queryKey: ['intercepted-conversations'] });
      setForwardMessage('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to forward message', {
        icon: '❌',
        position: 'top-center'
      });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ conversationId, message }) => {
      return await interceptAPI.replyToBusiness(conversationId, { message });
    },
    onSuccess: () => {
      toast.success('Reply sent to business successfully', {
        icon: '✅',
        position: 'top-center',
        autoClose: 3000
      });
      // Remove optimistic message for this conversation
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedConversation._id);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ['intercepted-conversations'] });
      setReplyMessage('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send reply', {
        icon: '❌',
        position: 'top-center'
      });
      // Remove failed optimistic message
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedConversation._id);
        return newMap;
      });
    }
  });

  const noteMutation = useMutation({
    mutationFn: async ({ conversationId, notes }) => {
      return await interceptAPI.updateInterceptNotes(conversationId, { notes });
    },
    onSuccess: () => {
      toast.success('Admin note saved', {
        icon: '📝',
        position: 'top-center',
        autoClose: 2000
      });
      // Remove optimistic note message for this conversation
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedConversation._id);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ['intercepted-conversations'] });
      setAdminNote('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update notes', {
        icon: '❌',
        position: 'top-center'
      });
      // Remove failed optimistic note
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedConversation._id);
        return newMap;
      });
    }
  });

  const directMessageMutation = useMutation({
    mutationFn: async ({ vaId, message }) => {
      return await interceptAPI.directMessageVA(vaId, { message });
    },
    onSuccess: () => {
      toast.success('Direct message sent to VA', {
        icon: '💬',
        position: 'top-center',
        autoClose: 3000
      });
      queryClient.invalidateQueries({ queryKey: ['intercepted-conversations'] });
      setDirectChatMessage('');
      setShowDirectChatModal(false);
      setSelectedVAForDirectChat(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send direct message', {
        icon: '❌',
        position: 'top-center'
      });
    }
  });

  // Mark conversation as read when selected
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    // If conversation has unread messages, mark them as read
    if (conversationUnreadCounts[conversation._id] > 0 && !readConversations.has(conversation._id)) {
      try {
        // Optimistically update UI
        setReadConversations(prev => new Set([...prev, conversation._id]));
        
        // Call backend to mark as read
        await interceptAPI.markConversationAsRead(conversation._id);
        
        // The socket event will trigger a refetch automatically
      } catch (error) {
        console.error('Failed to mark conversation as read:', error);
        // Revert optimistic update on error
        setReadConversations(prev => {
          const newSet = new Set(prev);
          newSet.delete(conversation._id);
          return newSet;
        });
      }
    }
  };

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefreshed(new Date());
      toast.success('Messages refreshed', {
        icon: '🔄',
        position: 'top-center',
        autoClose: 2000
      });
    } catch (error) {
      toast.error('Failed to refresh messages');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const toggleFullscreen = () => {
    if (!chatSectionRef.current) {
      toast.error('Chat section not found');
      return;
    }

    if (!document.fullscreenElement) {
      chatSectionRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast.success('Chat section entered fullscreen', {
          icon: '🖥️',
          position: 'top-center',
          autoClose: 2000
        });
      }).catch((err) => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        toast.success('Exited fullscreen mode', {
          icon: '🖥️',
          position: 'top-center',
          autoClose: 2000
        });
      }).catch((err) => {
        toast.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  const handleForward = (conversation) => {
    if (!forwardMessage.trim()) {
      toast.warning('Please enter a message to forward');
      return;
    }
    forwardMutation.mutate({
      conversationId: conversation._id,
      message: forwardMessage,
      includeContext: true
    });
  };

  const handleReply = (conversation) => {
    if (!replyMessage.trim()) {
      toast.warning('Please enter a reply message');
      return;
    }
    
    // Create optimistic message for immediate display
    const optimisticMessage = {
      _id: `optimistic-reply-${Date.now()}`,
      content: replyMessage,
      sender: conversation.va?._id || 'va',
      senderModel: 'VA',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      read: false
    };
    
    // Add optimistic message to the conversation
    setOptimisticMessages(prev => {
      const newMap = new Map(prev);
      const existingMessages = newMap.get(conversation._id) || [];
      newMap.set(conversation._id, [...existingMessages, optimisticMessage]);
      return newMap;
    });
    
    replyMutation.mutate({
      conversationId: conversation._id,
      message: replyMessage
    });
  };

  const handleAddNote = (conversation) => {
    if (!adminNote.trim()) {
      toast.warning('Please enter a note');
      return;
    }
    
    // Create optimistic admin note message
    const optimisticNote = {
      _id: `optimistic-note-${Date.now()}`,
      content: `Admin Note: ${adminNote}`,
      sender: 'admin',
      senderModel: 'Admin',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isAdminNote: true,
      read: true
    };
    
    // Add optimistic note to the conversation
    setOptimisticMessages(prev => {
      const newMap = new Map(prev);
      const existingMessages = newMap.get(conversation._id) || [];
      newMap.set(conversation._id, [...existingMessages, optimisticNote]);
      return newMap;
    });
    
    noteMutation.mutate({
      conversationId: conversation._id,
      notes: adminNote
    });
  };

  const handleDirectChatWithVA = (va) => {
    setSelectedVAForDirectChat(va);
    setShowDirectChatModal(true);
  };

  const handleSendDirectMessage = () => {
    if (!directChatMessage.trim()) {
      toast.warning('Please enter a message');
      return;
    }
    directMessageMutation.mutate({
      vaId: selectedVAForDirectChat._id,
      message: directChatMessage
    });
  };

  const toggleStarred = (conversationId) => {
    setStarredConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
        toast.info('Conversation unstarred', { autoClose: 1500 });
      } else {
        newSet.add(conversationId);
        toast.info('Conversation starred', { autoClose: 1500 });
      }
      return newSet;
    });
  };

  const toggleMessageExpanded = (messageId) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatMessageTime = (date) => {
    const messageDate = parseISO(date);
    if (isToday(messageDate)) {
      return `Today at ${format(messageDate, 'h:mm a')}`;
    } else if (isYesterday(messageDate)) {
      return `Yesterday at ${format(messageDate, 'h:mm a')}`;
    } else {
      return format(messageDate, 'MMM d, yyyy h:mm a');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-700 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading messages...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isFullscreen ? 'min-h-screen' : ''}`}>
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and Stats */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl shadow-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Message Center
                  {unreadCount > 0 && (
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: animatingUnreadCount ? 1.2 : 1 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className={`px-2.5 py-1 bg-red-500 dark:bg-red-600 text-white text-xs font-bold rounded-full ${
                        animatingUnreadCount ? '' : 'animate-pulse'
                      }`}
                    >
                      {unreadCount} New
                    </motion.span>
                  )}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage and respond to intercepted conversations
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Try New Interface Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/messenger-chat')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md"
              >
                <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
                <span className="font-medium">Try New Messenger UI</span>
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">BETA</span>
              </motion.button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'split'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('chat')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'chat'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Chat View
                </button>
              </div>

              {/* Notification Toggle */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg transition-all ${
                  showNotifications
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                {showNotifications ? (
                  <BellIconSolid className="h-5 w-5" />
                ) : (
                  <BellIcon className="h-5 w-5" />
                )}
              </button>

              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 transition-all shadow-md disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </motion.button>

              {/* Last Updated */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(apiStats).map(([status, count]) => {
              const config = status === 'all' 
                ? { 
                    color: 'from-gray-500 to-gray-600',
                    icon: InboxIcon,
                    label: 'All Messages',
                    badge: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700'
                  }
                : getStatusConfig(status);
              
              return (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilterStatus(status)}
                  className={`relative overflow-hidden rounded-xl p-3 transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r ' + config.color + ' text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {config && <config.icon className={`h-4 w-4 ${filterStatus === status ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />}
                      <span className={`text-sm font-medium ${filterStatus === status ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {config?.label || status}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${filterStatus === status ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {count}
                    </span>
                  </div>
                  {filterStatus === status && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by business, VA name, or message content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2">
            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Priority</option>
              <option value="starred">Starred Only</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="business">By Business</option>
              <option value="va">By VA</option>
              <option value="status">By Status</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 transition-all ${
                showFilters
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
              {showFilters && <span className="text-xs bg-indigo-600 dark:bg-indigo-500 text-white px-1.5 py-0.5 rounded">ON</span>}
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Additional filter options can be added here */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <label className="block mb-1 font-medium">Date Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>All Time</option>
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {/* Conversations List */}
        <div className={`${viewMode === 'chat' ? 'hidden' : viewMode === 'list' ? 'w-full' : 'w-full lg:w-2/5 xl:w-1/3'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
          <div className="flex-1 overflow-y-auto">
            {filteredAndSortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <InboxIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No conversations found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Intercepted messages will appear here'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {filteredAndSortedConversations.map((conversation, index) => {
                    // Use adminStatus if available, fallback to status
                    const statusField = conversation.adminStatus || conversation.status || 'pending';
                    const config = getStatusConfig(statusField);
                    const isStarred = starredConversations.has(conversation._id);
                    const isSelected = selectedConversation?._id === conversation._id;
                    const hasUnread = conversationUnreadCounts[conversation._id] > 0 && !readConversations.has(conversation._id);
                    
                    return (
                      <motion.div
                        key={conversation._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`relative cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          isSelected ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-l-4 border-indigo-500 dark:border-indigo-400' : 
                          hasUnread ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-400 dark:border-blue-500' : ''
                        }`}
                      >
                        <div className="p-4">
                          {/* Conversation Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Avatar/Icon */}
                              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                                <config.icon className={`h-5 w-5 ${config.textColor}`} />
                              </div>
                              
                              {/* Conversation Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`truncate ${
                                    hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {conversation.business?.company || conversation.business?.name || 'Unknown Business'}
                                  </h3>
                                  {hasUnread && (
                                    <motion.span
                                      key={`unread-${conversation._id}-${conversationUnreadCounts[conversation._id]}`}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                      className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 dark:bg-blue-600 text-white text-xs font-bold rounded-full animate-pulse"
                                    >
                                      {conversationUnreadCounts[conversation._id]}
                                    </motion.span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStarred(conversation._id);
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    {isStarred ? (
                                      <StarIconSolid className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                                    ) : (
                                      <StarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400" />
                                    )}
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  <UserIcon className="h-3.5 w-3.5" />
                                  <span className="truncate">
                                    {conversation.va ? 
                                      (conversation.va.firstName && conversation.va.lastName 
                                        ? `${conversation.va.firstName} ${conversation.va.lastName}` 
                                        : conversation.va.name || 'VA User') : 
                                      'No VA assigned'
                                    }
                                  </span>
                                </div>
                                
                                {/* Last Message Preview */}
                                {conversation.lastMessage && (
                                  <p className={`text-sm line-clamp-2 mt-1 ${
                                    hasUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {hasUnread && (
                                      <span className="inline-block w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-1.5 animate-pulse"></span>
                                    )}
                                    {conversation.lastMessage}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="flex flex-col items-end gap-2">
                              {hasUnread && (
                                <motion.div
                                  key={`envelope-${conversation._id}`}
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  transition={{ type: "spring", bounce: 0.5 }}
                                  className="p-1 bg-blue-500 dark:bg-blue-600 rounded-full shadow-lg"
                                >
                                  <EnvelopeIcon className="h-3.5 w-3.5 text-white animate-pulse" />
                                </motion.div>
                              )}
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${config.badge}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Message Count & Priority Indicators */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <EnvelopeIcon className="h-3.5 w-3.5" />
                                {conversation.messageCount || conversation.messages?.length || 0} messages
                              </span>
                              {hasUnread && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"
                                >
                                  <ExclamationCircleIcon className="h-3.5 w-3.5 animate-pulse" />
                                  {conversationUnreadCounts[conversation._id]} new
                                </motion.span>
                              )}
                            </div>
                            
                            {conversation.priority === 'high' && (
                              <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                High Priority
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId="selectedConversation"
                            className="absolute inset-0 border-2 border-indigo-500 dark:border-indigo-400 rounded-lg pointer-events-none"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Details */}
        {viewMode !== 'list' && (
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col">
            {selectedConversation ? (
              <div ref={chatSectionRef} className={`flex-1 flex flex-col ${isFullscreen ? 'bg-white dark:bg-gray-900' : ''}`}>
                {/* Conversation Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-xl">
                        <BuildingOfficeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedConversation.business?.company || selectedConversation.business?.name || 'Unknown Business'}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            {selectedConversation.va ? 
                              (selectedConversation.va.firstName && selectedConversation.va.lastName 
                                ? `${selectedConversation.va.firstName} ${selectedConversation.va.lastName}` 
                                : selectedConversation.va.name || 'VA User') : 
                              'No VA assigned'
                            }
                          </span>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusConfig(selectedConversation.adminStatus || selectedConversation.status || 'pending').badge}`}>
                            {getStatusConfig(selectedConversation.adminStatus || selectedConversation.status || 'pending').label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Fullscreen Toggle */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleFullscreen}
                        className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all shadow-md"
                        title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Chat (F11)"}
                      >
                        {isFullscreen ? (
                          <ArrowsPointingInIcon className="h-5 w-5" />
                        ) : (
                          <ArrowsPointingOutIcon className="h-5 w-5" />
                        )}
                      </motion.button>
                      
                      <button
                        onClick={() => toggleStarred(selectedConversation._id)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {starredConversations.has(selectedConversation._id) ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(() => {
                    // Combine real messages with optimistic messages
                    const realMessages = selectedConversation.messages || [];
                    const optMessages = optimisticMessages.get(selectedConversation._id) || [];
                    const allMessages = [...realMessages, ...optMessages];
                    
                    return (
                      <>
                        {allMessages.length > 0 ? (
                          <>
                            {allMessages.map((message, index) => {
                            const isExpanded = expandedMessages.has(message._id);
                            // Check if message is from business
                            const isFromBusiness = message.sender?._id === selectedConversation.business?._id ||
                                                 message.sender === selectedConversation.business?._id ||
                                                 message.sender?.toString() === selectedConversation.business?.toString() ||
                                                 message.sender === 'business' ||
                                                 message.senderModel === 'Business';
                            const isFromAdmin = message.sender === 'admin' || message.isAdminNote;
                            const isUnread = !message.read && isFromBusiness && !message.isOptimistic;
                            const isOptimistic = message.isOptimistic;
                            
                            return (
                              <motion.div
                                key={message._id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex ${isFromBusiness ? 'justify-start' : 'justify-end'} ${
                                  isUnread ? 'relative' : ''
                                }`}
                              >
                                {isUnread && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute -left-8 top-1/2 -translate-y-1/2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">NEW</span>
                                    </div>
                                  </motion.div>
                                )}
                                <div className={`max-w-2xl ${isFromBusiness ? 'order-2' : 'order-1'}`}>
                                  <div className={`rounded-2xl p-4 shadow-sm ${
                                    isFromAdmin
                                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
                                      : isFromBusiness
                                        ? isUnread
                                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                                        : isOptimistic
                                          ? 'bg-gradient-to-r from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600 text-white opacity-70 border-2 border-dashed border-indigo-300 dark:border-indigo-400'
                                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white'
                                  }`}>
                                    {/* Message Header */}
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {isFromAdmin ? (
                                          <DocumentTextIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                        ) : isFromBusiness ? (
                                          <BuildingOfficeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        ) : (
                                          <UserIcon className="h-4 w-4 text-white/80" />
                                        )}
                                        <span className={`text-xs font-medium ${
                                          isFromAdmin ? 'text-yellow-700 dark:text-yellow-400' :
                                          isFromBusiness ? 'text-gray-600 dark:text-gray-400' : 'text-white/90'
                                        }`}>
                                          {isFromAdmin ? 'Admin' : isFromBusiness ? 'Business' : 'VA'}
                                        </span>
                                        {isOptimistic && (
                                          <span className="text-xs text-white/60 italic">Sending...</span>
                                        )}
                                      </div>
                                      <span className={`text-xs ${
                                        isFromAdmin ? 'text-yellow-600 dark:text-yellow-400' :
                                        isFromBusiness ? 'text-gray-500 dark:text-gray-400' : 'text-white/80'
                                      }`}>
                                        {formatMessageTime(message.timestamp || message.createdAt)}
                                      </span>
                                    </div>
                                    
                                    {/* Message Content */}
                                    <div className={`${
                                      isFromAdmin ? 'text-yellow-800 dark:text-yellow-200' :
                                      isFromBusiness ? 'text-gray-800 dark:text-gray-200' : 'text-white'
                                    }`}>
                                      <p className={`text-sm leading-relaxed ${
                                        !isExpanded && message.content?.length > 200 ? 'line-clamp-3' : ''
                                      }`}>
                                        {message.content}
                                      </p>
                                      
                                      {message.content?.length > 200 && (
                                        <button
                                          onClick={() => toggleMessageExpanded(message._id)}
                                          className={`mt-2 text-xs font-medium ${
                                            isFromBusiness ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300' : 'text-white/90 hover:text-white'
                                          }`}
                                        >
                                          {isExpanded ? 'Show less' : 'Show more'}
                                        </button>
                                      )}
                                    </div>
                                    
                                    {/* Message Actions */}
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-200/20 dark:border-gray-700/30">
                                        <div className="flex items-center gap-2 text-xs">
                                          <DocumentTextIcon className="h-4 w-4" />
                                          <span>{message.attachments.length} attachment(s)</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                            })}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <ChatBubbleOvalLeftIcon className="h-12 w-12 mb-3" />
                            <p>No messages in this conversation yet</p>
                          </div>
                        )}
                        
                        {/* Typing Indicator - Only show when others are typing */}
                        {otherUserTyping.has(`${selectedConversation._id}-business`) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center space-x-3"
                          >
                            <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Business is typing...</span>
                          </motion.div>
                        )}
                         
                        {/* Admin Notes Section */}
                        {selectedConversation.adminNotes && Array.isArray(selectedConversation.adminNotes) && selectedConversation.adminNotes.length > 0 && (
                          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <DocumentTextIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                              <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">Admin Notes</h3>
                            </div>
                            <div className="space-y-2">
                              {selectedConversation.adminNotes.map((note, index) => (
                                <div key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
                                  <p>{note.content}</p>
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                    {formatMessageTime(note.createdAt)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Action Panel */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDirectChatWithVA(selectedConversation.va)}
                        disabled={!selectedConversation.va}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChatBubbleOvalLeftIcon className="h-4 w-4" />
                        Direct Message VA
                      </button>
                      
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View Full History
                      </button>
                      
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                      >
                        <CheckBadgeIcon className="h-4 w-4" />
                        Mark Resolved
                      </button>
                    </div>
                    
                    {/* Reply to Business */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reply to Business</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => {
                            setReplyMessage(e.target.value);
                            
                            // Emit typing status via WebSocket
                            if (socketRef.current && selectedConversation) {
                              socketRef.current.emit('typing_start', {
                                conversationId: selectedConversation._id,
                                userId: user?.id
                              });

                              clearTimeout(typingTimeoutRef.current);
                              typingTimeoutRef.current = setTimeout(() => {
                                if (socketRef.current) {
                                  socketRef.current.emit('typing_stop', {
                                    conversationId: selectedConversation._id,
                                    userId: user?.id
                                  });
                                }
                              }, 1000);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(selectedConversation);
                            }
                          }}
                          placeholder="Type your reply... (Press Enter to send)"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReply(selectedConversation)}
                          disabled={replyMutation.isLoading}
                          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                          Send Reply
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Forward to VA */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Forward to VA with Message</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={forwardMessage}
                          onChange={(e) => {
                            setForwardMessage(e.target.value);
                            
                            // Emit typing status via WebSocket
                            if (socketRef.current && selectedConversation) {
                              socketRef.current.emit('typing_start', {
                                conversationId: selectedConversation._id,
                                userId: user?.id
                              });

                              clearTimeout(typingTimeoutRef.current);
                              typingTimeoutRef.current = setTimeout(() => {
                                if (socketRef.current) {
                                  socketRef.current.emit('typing_stop', {
                                    conversationId: selectedConversation._id,
                                    userId: user?.id
                                  });
                                }
                              }, 1000);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleForward(selectedConversation);
                            }
                          }}
                          placeholder="Add a message for the VA... (Press Enter to send)"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleForward(selectedConversation)}
                          disabled={forwardMutation.isLoading || !selectedConversation.va}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                          Forward
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Add Admin Note */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Admin Note</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={adminNote}
                          onChange={(e) => {
                            setAdminNote(e.target.value);
                            
                            // Emit typing status via WebSocket
                            if (socketRef.current && selectedConversation) {
                              socketRef.current.emit('typing_start', {
                                conversationId: selectedConversation._id,
                                userId: user?.id
                              });

                              clearTimeout(typingTimeoutRef.current);
                              typingTimeoutRef.current = setTimeout(() => {
                                if (socketRef.current) {
                                  socketRef.current.emit('typing_stop', {
                                    conversationId: selectedConversation._id,
                                    userId: user?.id
                                  });
                                }
                              }, 1000);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddNote(selectedConversation);
                            }
                          }}
                          placeholder="Add an internal note... (Press Enter to save)"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddNote(selectedConversation)}
                          disabled={noteMutation.isLoading}
                          className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 dark:from-yellow-600 dark:to-orange-700 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 dark:hover:from-yellow-700 dark:hover:to-orange-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Add Note
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-center">
                  <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-4">
                    <ChatBubbleLeftRightIcon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Select a conversation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose a conversation from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Chat Modal */}
      <AnimatePresence>
        {showDirectChatModal && selectedVAForDirectChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDirectChatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 dark:bg-white/10 rounded-xl backdrop-blur-sm">
                      <ChatBubbleOvalLeftIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Direct Message to VA</h2>
                      <p className="text-white/80 text-sm">
                        {selectedVAForDirectChat.firstName} {selectedVAForDirectChat.lastName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDirectChatModal(false)}
                    className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-800">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Message
                    </label>
                    <textarea
                      value={directChatMessage}
                      onChange={(e) => setDirectChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendDirectMessage();
                        }
                      }}
                      placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDirectChatModal(false)}
                      className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendDirectMessage}
                      disabled={directMessageMutation.isLoading || !directChatMessage.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 dark:hover:from-purple-700 dark:hover:to-pink-800 transition-all shadow-md disabled:opacity-50 font-medium flex items-center gap-2"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send Message
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast for Real-time Updates */}
      {showNotifications && unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white p-4 rounded-xl shadow-2xl max-w-sm z-40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg">
              <BellIconSolid className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">New Messages</p>
              <p className="text-sm text-white/80">You have {unreadCount} unread messages</p>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InterceptedMessages;