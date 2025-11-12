import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { interceptAPI } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import io from 'socket.io-client';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  PaperClipIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  ArrowUturnLeftIcon,
  BellSlashIcon,
  BellIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  XMarkIcon,
  ShieldCheckIcon,
  FunnelIcon,
  ArchiveBoxIcon,
  ClockIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EyeIcon,
  EyeSlashIcon,
  CloudArrowUpIcon,
  TagIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

const MessengerChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // New state for filtering and categorization
  const [activeTab, setActiveTab] = useState('unread'); // 'unread', 'all', 'archive'
  const [filterAdminMessages, setFilterAdminMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'admin', 'participants'
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRafRef = useRef(null);
  // Track window focus for auto-read
  const [windowFocused, setWindowFocused] = useState(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);
  // Debounce for read-marking
  const markReadDebounceRef = useRef(null);
  // Store previous unread counts for rollback on failure
  const prevUnreadRef = useRef({}); // { [conversationId]: number }

  // Fetch intercepted conversations using the same API as classic view
  const { data: conversationsResponse, isLoading } = useQuery({
    queryKey: ['intercepted-conversations', activeTab],
    queryFn: async () => {
      const response = await interceptAPI.getInterceptedConversations({
        status: activeTab === 'archive' ? 'resolved' : activeTab === 'unread' ? 'pending' : undefined
      });
      return response.data;
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const conversations = conversationsResponse?.data?.conversations || [];

  // WebSocket connection setup
  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : (process.env.REACT_APP_API_URL?.replace('/api', '') || window.location.origin);
    
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    // Join admin room
    if (user?.id) {
      socketRef.current.emit('join', user.id);
    }

    // Listen for typing status from other users
    socketRef.current.on('typing_status', (data) => {
      if (selectedConversation && data.conversationId === selectedConversation._id && data.userId !== user?.id) {
        setOtherUserTyping(data.isTyping);
        
        if (data.isTyping) {
          // Clear typing after 3 seconds if no stop signal
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        } else {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    });

    // Listen for new messages
    socketRef.current.on('new_message', (data) => {
      if (selectedConversation && data.conversation === selectedConversation._id) {
        // If user is actively viewing this thread and window is focused,
        // auto-mark as read (optimistic) and persist; do not increment unread.
        if (windowFocused) {
          optimisticClearUnread(selectedConversation._id);
          scheduleMarkRead(selectedConversation._id, true);
        }
        // Still refresh conversations to get the new message content
        queryClient.invalidateQueries(['intercepted-conversations']);
      }
    });

    // Listen for admin unread updates
    socketRef.current.on('admin_unread_update', () => {
      queryClient.invalidateQueries(['intercepted-conversations']);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id, queryClient, selectedConversation, windowFocused]);

  // Window/tab focus tracking
  useEffect(() => {
    const onVisibility = () => {
      const focused = document.visibilityState === 'visible';
      setWindowFocused(focused);
      // When refocusing while a conversation is open, auto-clear unread
      if (focused && selectedConversation?._id) {
        optimisticClearUnread(selectedConversation._id);
        scheduleMarkRead(selectedConversation._id, true);
      }
    };
    const onFocus = () => {
      setWindowFocused(true);
      if (selectedConversation?._id) {
        optimisticClearUnread(selectedConversation._id);
        scheduleMarkRead(selectedConversation._id, true);
      }
    };
    const onBlur = () => setWindowFocused(false);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [selectedConversation?._id]);

  // Read marker mutation (idempotent)
  const markReadMutation = useMutation({
    mutationFn: (conversationId) => interceptAPI.markConversationAsRead(conversationId),
    onError: (_err, conversationId) => {
      // Rollback unread counts on failure
      rollbackUnread(conversationId);
    },
  });

  // Optimistically clear unread badge/counts for a conversation
  const optimisticClearUnread = (conversationId) => {
    // Store previous unread for rollback (only once)
    const conversations = queryClient.getQueryData(['intercepted-conversations', activeTab]);
    const prevEntry = prevUnreadRef.current[conversationId];
    let prevCount = undefined;
    if (!prevEntry && conversations?.data?.conversations) {
      const conv = conversations.data.conversations.find(c => c._id === conversationId);
      if (conv) {
        prevCount = conv.unreadCount || 0;
        prevUnreadRef.current[conversationId] = prevCount;
      }
    }
    // Update selectedConversation
    setSelectedConversation((cur) => {
      if (!cur || cur._id !== conversationId) return cur;
      if ((cur.unreadCount || 0) === 0) return cur;
      return { ...cur, unreadCount: 0 };
    });
    // Update cache so list/totals reflect cleared unread immediately
    queryClient.setQueryData(['intercepted-conversations', activeTab], (old) => {
      if (!old?.data?.conversations) return old;
      const nextConversations = old.data.conversations.map(c =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      return { ...old, data: { ...old.data, conversations: nextConversations } };
    });
  };

  // Rollback unread counts on network error
  const rollbackUnread = (conversationId) => {
    const prevCount = prevUnreadRef.current[conversationId];
    if (typeof prevCount === 'undefined') return;
    setSelectedConversation((cur) => {
      if (!cur || cur._id !== conversationId) return cur;
      return { ...cur, unreadCount: prevCount };
    });
    queryClient.setQueryData(['intercepted-conversations', activeTab], (old) => {
      if (!old?.data?.conversations) return old;
      const nextConversations = old.data.conversations.map(c =>
        c._id === conversationId ? { ...c, unreadCount: prevCount } : c
      );
      return { ...old, data: { ...old.data, conversations: nextConversations } };
    });
    // Clear saved prev count after rollback to avoid stale restores
    delete prevUnreadRef.current[conversationId];
  };

  // Debounced mark-as-read scheduler (also used to coalesce bursts)
  const scheduleMarkRead = (conversationId, debounce = true) => {
    if (!conversationId) return;
    if (markReadDebounceRef.current) {
      clearTimeout(markReadDebounceRef.current);
    }
    const run = () => {
      markReadMutation.mutate(conversationId, {
        onSuccess: () => {
          // Success: keep cleared, cleanup prev record
          delete prevUnreadRef.current[conversationId];
        }
      });
    };
    if (debounce) {
      markReadDebounceRef.current = setTimeout(run, 200);
    } else {
      run();
    }
  };

  // Join/leave conversation room when conversation changes
  useEffect(() => {
    if (socketRef.current && selectedConversation) {
      // Leave previous conversation room
      socketRef.current.emit('leave-conversation', selectedConversation._id);
      // Join new conversation room
      socketRef.current.emit('join-conversation', selectedConversation._id);
      
      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave-conversation', selectedConversation._id);
        }
      };
    }
  }, [selectedConversation?._id]);

  // When switching to a conversation and window is focused, auto-clear unread
  useEffect(() => {
    if (selectedConversation?._id && windowFocused) {
      optimisticClearUnread(selectedConversation._id);
      scheduleMarkRead(selectedConversation._id, true);
    }
  }, [selectedConversation?._id, windowFocused]);

  useEffect(() => {
    // Simulate online users for demo
    setOnlineUsers(new Set(['user1', 'user3', 'user5']));
  }, []);

  useEffect(() => {
    scheduleScrollToBottom();
  }, [selectedConversation, optimisticMessages]);

  // Clear optimistic messages when conversation changes
  useEffect(() => {
    setOptimisticMessages([]);
    setOtherUserTyping(false);
    setAttachments([]);
  }, [selectedConversation?._id]);

  // Mutations for admin actions
  const replyMutation = useMutation({
    mutationFn: async ({ conversationId, message, attachments }) => {
      return await interceptAPI.replyToBusiness(conversationId, { message, attachments });
    },
    onSuccess: (response, variables) => {
      // Reconcile with server: replace selectedConversation with fresh server copy
      const conv = response?.data?.data;
      if (conv) {
        setSelectedConversation(conv);
      }
      // Clear optimistic messages for this conversation (server copy now contains the persisted message)
      setOptimisticMessages(prev => prev.filter(m => m.conversationId !== variables.conversationId));
      // Update conversations cache preview immediately to avoid resort lag
      queryClient.setQueryData(['intercepted-conversations', activeTab], (old) => {
        if (!old?.data?.conversations) return old;
        const next = { ...old, data: { ...old.data, conversations: old.data.conversations.map(c => {
          if (c._id === (conv?._id || variables.conversationId)) {
            return conv ? conv : { ...c, lastMessage: variables.message, updatedAt: new Date().toISOString() };
          }
          return c;
        }) } };
        return next;
      });
      setNewMessage('');
      setAttachments([]);
      // Refetch in background to keep everything consistent
      queryClient.invalidateQueries(['intercepted-conversations']);
      // Keep view pinned
      setTimeout(scheduleScrollToBottom, 50);
    },
    onError: (_error, variables) => {
      // Mark the optimistic message as failed for retry UX
      setOptimisticMessages(prev => prev.map(m => {
        if (m.isOptimistic && m.conversationId === variables.conversationId) {
          return { ...m, isOptimistic: false, failed: true };
        }
        return m;
      }));
      // Keep scroll pinned
      setTimeout(scheduleScrollToBottom, 50);
    },
  });

  const chatWithVAMutation = useMutation({
    mutationFn: async ({ conversationId, vaId, message }) => {
      return await interceptAPI.directMessageVA(vaId, { 
        message, 
        conversationId, 
        includeContext: true 
      });
    },
    onSuccess: () => {
      setSuccessMessage('Direct message sent to VA successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries(['intercepted-conversations']);
    },
    onError: () => {
      alert('Failed to send message to VA. Please try again.');
    },
  });

  const noteMutation = useMutation({
    mutationFn: async ({ conversationId, notes }) => {
      return await interceptAPI.updateInterceptNotes(conversationId, { notes });
    },
    onSuccess: () => {
      setAdminNote('');
      setSuccessMessage('Admin note added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries(['intercepted-conversations']);
    },
    onError: () => {
      alert('Failed to add note. Please try again.');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await interceptAPI.updateConversationStatus(conversationId, { status: 'resolved' });
    },
    onSuccess: () => {
      setSuccessMessage('Conversation moved to archive');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries(['intercepted-conversations']);
      // If we're on archive tab, stay there, otherwise go to unread
      if (activeTab === 'archive') {
        setSelectedConversation(null);
      }
    },
    onError: () => {
      alert('Failed to resolve conversation. Please try again.');
    },
  });
  // Archive conversation (preferred over generic status update; sets archivedAt server-side)
  const archiveMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await interceptAPI.archiveConversation(conversationId);
    },
    onSuccess: (response, conversationId) => {
      const updated = response?.data?.data;
      // Update selected item
      if (updated && selectedConversation?._id === conversationId) {
        setSelectedConversation(updated);
      }
      // Optimistic cache update across tabs
      queryClient.setQueryData(['intercepted-conversations', 'all'], (old) => {
        if (!old?.data?.conversations) return old;
        return {
          ...old,
          data: {
            ...old.data,
            conversations: old.data.conversations.map(c => c._id === conversationId ? (updated || { ...c, status: 'resolved', archivedAt: new Date().toISOString() }) : c)
          }
        };
      });
      queryClient.setQueryData(['intercepted-conversations', 'unread'], (old) => {
        if (!old?.data?.conversations) return old;
        return {
          ...old,
          data: {
            ...old.data,
            conversations: old.data.conversations.filter(c => c._id !== conversationId)
          }
        };
      });
      queryClient.setQueryData(['intercepted-conversations', 'archive'], (old) => {
        if (!old?.data?.conversations) return old;
        const exists = old.data.conversations.some(c => c._id === conversationId);
        if (exists) return old;
        const toAdd = updated || (selectedConversation?._id === conversationId ? { ...selectedConversation, status: 'resolved', archivedAt: new Date().toISOString() } : null);
        if (!toAdd) return old;
        return {
          ...old,
          data: {
            ...old.data,
            conversations: [toAdd, ...old.data.conversations]
          }
        };
      });
      // Invalidate to ensure consistency
      queryClient.invalidateQueries(['intercepted-conversations']);
      setSuccessMessage('Conversation archived');
      setTimeout(() => setSuccessMessage(''), 3000);
      // If not on archive tab, remove selection so it disappears from active view
      if (activeTab !== 'archive') {
        setSelectedConversation(null);
      }
    },
    onError: () => {
      alert('Failed to archive conversation. Please try again.');
    }
  });
  // Unarchive conversation
  const unarchiveMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await interceptAPI.unarchiveConversation(conversationId);
    },
    onSuccess: (response, conversationId) => {
      const updated = response?.data?.data;
      if (updated && selectedConversation?._id === conversationId) {
        setSelectedConversation(updated);
      }
      // Update caches
      queryClient.setQueryData(['intercepted-conversations', 'archive'], (old) => {
        if (!old?.data?.conversations) return old;
        return {
          ...old,
          data: {
            ...old.data,
            conversations: old.data.conversations.filter(c => c._id !== conversationId)
          }
        };
      });
      queryClient.setQueryData(['intercepted-conversations', 'all'], (old) => {
        if (!old?.data?.conversations) return old;
        const exists = old.data.conversations.some(c => c._id === conversationId);
        const toAdd = updated || (selectedConversation?._id === conversationId ? { ...selectedConversation, status: 'pending' } : null);
        if (!toAdd) return old;
        return exists
          ? {
              ...old,
              data: {
                ...old.data,
                conversations: old.data.conversations.map(c => c._id === conversationId ? toAdd : c)
              }
            }
          : {
              ...old,
              data: {
                ...old.data,
                conversations: [toAdd, ...old.data.conversations]
              }
            };
      });
      queryClient.setQueryData(['intercepted-conversations', 'unread'], (old) => old); // leave unread untouched
      queryClient.invalidateQueries(['intercepted-conversations']);
      setSuccessMessage('Conversation unarchived');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: () => {
      alert('Failed to unarchive conversation. Please try again.');
    }
  });

  const sendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && attachments.length === 0)) return;

    const conversationId = selectedConversation._id;
    // Build payload to include attachments the backend expects
    const payload = {
      message: newMessage.trim(),
      attachments: attachments.length
        ? attachments.map(a => ({
            url: a.url,
            name: a.name,
            size: a.size,
            mime: a.type || a.mime || 'application/octet-stream',
            storage: a.storage,
            key: a.key
          }))
        : []
    };

    // Optimistic UI for text only (attachments will be reconciled from server response)
    const optimisticId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg = {
      _id: optimisticId,
      sender: 'admin',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isOptimistic: true,
      delivered: false,
      read: false,
      attachments: attachments.length ? payload.attachments : undefined
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    // clear staged attachments in composer
    setAttachments([]);
    scheduleScrollToBottom();

    try {
      const res = await interceptAPI.replyToBusiness(conversationId, payload);
      const updatedConv = res?.data?.data;
      if (updatedConv) {
        // Remove optimistic message and set updated conversation from server
        setOptimisticMessages(prev => prev.filter(m => m._id !== optimisticId));
        setSelectedConversation(updatedConv);
        // Keep lists in sync
        queryClient.invalidateQueries(['intercepted-conversations']);
        setTimeout(scheduleScrollToBottom, 50);
      } else {
        // Mark optimistic as delivered to avoid spinner if server didn't return data
        setOptimisticMessages(prev => prev.map(m => m._id === optimisticId ? ({ ...m, isOptimistic: false, delivered: true }) : m));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setOptimisticMessages(prev => prev.map(m => m._id === optimisticId ? ({ ...m, failed: true, isOptimistic: false }) : m));
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Emit typing status to other users via WebSocket
    if (socketRef.current && selectedConversation) {
      socketRef.current.emit('typing_start', {
        conversationId: selectedConversation._id,
        userId: user?.id
      });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing_stop', {
          conversationId: selectedConversation._id,
          userId: user?.id
        });
      }, 1000);
    }
  };

  const addAdminNote = async () => {
    if (!adminNote.trim() || !selectedConversation) return;

    noteMutation.mutate({
      conversationId: selectedConversation._id,
      notes: adminNote
    });
  };

  const chatWithVA = async () => {
    if (!selectedConversation) return;

    chatWithVAMutation.mutate({
      conversationId: selectedConversation._id,
      vaId: selectedConversation.vaId,
      message: 'Admin requesting assistance with this conversation'
    });
  };

  const markAsResolved = async () => {
    if (!selectedConversation) return;
    archiveMutation.mutate(selectedConversation._id);
  };
  const unarchive = async () => {
    if (!selectedConversation) return;
    unarchiveMutation.mutate(selectedConversation._id);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !selectedConversation) return;
    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        if (!isAllowedType(file.type)) {
          console.error(`Unsupported file type: ${file.type} (${file.name})`);
          alert(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          console.error(`File too large: ${file.name}`);
          alert(`File too large: ${file.name} (max 5MB)`);
          continue;
        }
        try {
          const res = await interceptAPI.uploadAttachment(selectedConversation._id, file);
          const meta = res?.data || {};
          if (!meta.url) {
            console.warn('Upload response missing url for', file.name);
            continue;
          }
          uploaded.push({
            id: meta.key || meta.url,
            name: meta.name || file.name,
            size: meta.size ?? file.size,
            type: meta.mime || file.type || 'application/octet-stream',
            url: meta.url,
            storage: meta.storage,
            key: meta.key
          });
        } catch (err) {
          console.error('Upload failed', err?.response?.data || err.message);
          alert(`Upload failed: ${file.name}`);
        }
      }
      if (uploaded.length) {
        // Stage attachments in composer; sendMessage should include them in payload
        setAttachments((prev) => [...prev, ...uploaded]);
        scheduleScrollToBottom();
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef?.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  // Throttled scroll-to-bottom to avoid ResizeObserver loops
  const scheduleScrollToBottom = () => {
    try {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = requestAnimationFrame(() => {
        try {
          scrollToBottom();
        } catch { /* no-op */ }
      });
    } catch { /* no-op */ }
  };

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  // Filter noisy ResizeObserver loop errors (completed/limit exceeded) to avoid dev overlay
  useEffect(() => {
    const onError = (e) => {
      const msg = e?.message || '';
      if (typeof msg === 'string' && (msg.includes('ResizeObserver loop completed') || msg.includes('ResizeObserver loop limit exceeded'))) {
        e.preventDefault?.();
        e.stopImmediatePropagation?.();
      }
    };
    const onRejection = (e) => {
      const msg = e?.reason?.message || '';
      if (typeof msg === 'string' && (msg.includes('ResizeObserver loop completed') || msg.includes('ResizeObserver loop limit exceeded'))) {
        e.preventDefault?.();
      }
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Auto-scroll when message/attachment counts change
  useEffect(() => {
    scheduleScrollToBottom();
  }, [selectedConversation?.messages?.length, optimisticMessages.length, attachments.length, scheduleScrollToBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      conv.businessName?.toLowerCase().includes(searchLower) ||
      conv.vaName?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower)
    );

    // Apply tab filtering
    if (activeTab === 'unread') {
      return matchesSearch && (conv.status === 'pending' || conv.unreadCount > 0);
    } else if (activeTab === 'archive') {
      return matchesSearch && conv.status === 'resolved';
    } else {
      // Exclude archived/resolved from the active "All" list
      return matchesSearch && conv.status !== 'resolved';
    }
  });

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getParticipantInfo = (conversation) => {
    // For intercepted conversations, we have businessName and vaName
    return {
      businessName: conversation.businessName || 'Unknown Business',
      vaName: conversation.vaName || 'Unknown VA',
      avatar: conversation.businessAvatar || conversation.vaAvatar,
      isOnline: onlineUsers.has(conversation.businessId || conversation.vaId)
    };
  };
  
  const getConversationMessages = (conversation) => {
    // Intercepted conversations have messages array
    const realMessages = conversation?.messages || [];
    
    // Apply message filtering
    let filteredMessages = realMessages;
    if (filterAdminMessages) {
      filteredMessages = realMessages.filter(msg => msg.sender === 'admin');
    } else if (messageFilter === 'admin') {
      filteredMessages = realMessages.filter(msg => msg.sender === 'admin');
    } else if (messageFilter === 'participants') {
      filteredMessages = realMessages.filter(msg => msg.sender !== 'admin');
    }
    
    // Combine filtered messages with optimistic messages for immediate display
    const pendingForThisConversation = optimisticMessages.filter(m => m.conversationId === conversation._id);
    return [...filteredMessages, ...pendingForThisConversation];
  };

  const getTabCounts = () => {
    const unreadCount = conversations.filter(conv => 
      conv.status === 'pending' || conv.unreadCount > 0
    ).length;
    
    const allCount = conversations.filter(conv => 
      conv.status !== 'resolved'
    ).length;
    
    const archiveCount = conversations.filter(conv => 
      conv.status === 'resolved'
    ).length;
    
    return { unreadCount, allCount, archiveCount };
  };

  const { unreadCount, allCount, archiveCount } = getTabCounts();

  const retrySend = (tempMessage) => {
    if (!selectedConversation || !tempMessage?.content) return;
    // Re-mark as optimistic pending
    setOptimisticMessages(prev => prev.map(m => m._id === tempMessage._id ? { ...m, isOptimistic: true, failed: false, timestamp: new Date().toISOString() } : m));
    setTimeout(scheduleScrollToBottom, 50);
    replyMutation.mutate({
      conversationId: selectedConversation._id,
      message: tempMessage.content,
      attachments: tempMessage.attachments || []
    });
  };

  const retryUpload = async (tempMessage) => {
    // Assumes tempMessage.attachments[0] has a File? We only stored objectURL; cannot re-upload without original File
    // For simplicity, prompt to reselect the file
    alert('Please reselect the file to retry upload.');
    openFilePicker();
  };

  // Helpers for attachment validation and preview
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const allowedMime = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'audio/mpeg',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  const isImageType = (t) => typeof t === 'string' && t.startsWith('image/');
  const isAllowedType = (t) => allowedMime.has(t);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Never render whole message objects; extract text safely
  const getMessageText = (m) => {
    if (m == null) return '';
    if (typeof m === 'string') return m;
    return m.content || m.text || '';
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2" />
              Messenger
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Admin
            </span>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'unread'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                All ({allCount})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'archive'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                Archive ({archiveCount})
              </div>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <ArchiveBoxIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'unread' ? 'No unread conversations' :
                 activeTab === 'archive' ? 'No archived conversations' :
                 'No conversations found'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const participant = getParticipantInfo(conversation);
              const isSelected = selectedConversation?._id === conversation._id;
              const hasUnread = conversation.status === 'pending' || conversation.unreadCount > 0;
              const isArchived = conversation.status === 'resolved';
              
              return (
                <div
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                  data-test="conversation-item"
                  className={`flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="relative mr-3">
                    {participant.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={participant.businessName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 text-gray-400" />
                    )}
                    {participant.isOnline && !isArchived && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {participant.businessName}
                        </p>
                        {isArchived && (
                          <ArchiveBoxIcon className="w-4 h-4 ml-2 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.createdAt ? formatTime(conversation.createdAt) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      VA: {participant.vaName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {hasUnread && !isArchived && (
                    <div className="ml-2">
                      <span data-test="conversation-unread" className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {conversation.unreadCount || '!'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="mr-4 lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <UserCircleIcon className="w-10 h-10 text-gray-400 mr-3" />
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    {selectedConversation.businessName || 'Unknown Business'}
                    {selectedConversation?.status === 'pending' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full animate-pulse">
                        NEEDS ATTENTION
                      </span>
                    )}
                    {selectedConversation?.status === 'resolved' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        ARCHIVED
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Conversation with VA: {selectedConversation.vaName || 'Unknown VA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <InformationCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button 
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`p-2 rounded-lg transition-all ${showAdminPanel ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                  title="Toggle Admin Controls"
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {/* Message Filter Bar */}
              {showAdminPanel && (
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Messages:</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setMessageFilter('all')}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            messageFilter === 'all'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          All Messages
                        </button>
                        <button
                          onClick={() => setMessageFilter('admin')}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            messageFilter === 'admin'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          Admin Only
                        </button>
                        <button
                          onClick={() => setMessageFilter('participants')}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            messageFilter === 'participants'
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          Participants Only
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setFilterAdminMessages(!filterAdminMessages)}
                      className={`flex items-center px-3 py-1 text-xs rounded-full transition-colors ${
                        filterAdminMessages
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {filterAdminMessages ? <EyeSlashIcon className="w-3 h-3 mr-1" /> : <EyeIcon className="w-3 h-3 mr-1" />}
                      {filterAdminMessages ? 'Admin Only' : 'Show All'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {getConversationMessages(selectedConversation).map((message, index) => {
                  const messages = getConversationMessages(selectedConversation);
                  const isFromBusiness = message.sender === 'business';
                  const isFromVA = message.sender === 'va';
                  const isFromAdmin = message.sender === 'admin';
                  const showAvatar = index === 0 || messages[index - 1]?.sender !== message.sender;
                  
                  // iPhone Messages-style alignment: Admin ("You") = LEFT with blue, Business/VA = RIGHT with gray
                  const isIncomingMessage = isFromBusiness || isFromVA;
                  const isOutgoingMessage = isFromAdmin;
                  
                  return (
                    <div key={message._id || index} className="mb-1" data-test="chat-message">
                      {/* Internal Notes Display - Special handling */}
                      {isFromAdmin && message.isInternalNote ? (
                        <div className="flex justify-center mb-4">
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-2 max-w-xs">
                            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center justify-center">
                              <DocumentTextIcon className="w-4 h-4 mr-2" />
                              <span className="font-semibold">Internal Note:</span>
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 text-center">
                              {message.content || message.text || message}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-end mb-1 ${
                          isOutgoingMessage ? 'justify-start' : 'justify-end'
                        } ${!showAvatar ? (isOutgoingMessage ? 'ml-10' : 'mr-10') : ''}`}>
                          
                          {/* Avatar for outgoing messages (left side) */}
                          {isOutgoingMessage && showAvatar && (
                            <div className="flex-shrink-0 mb-1 mr-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#3496ff] to-[#2563eb] rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-sm font-semibold">A</span>
                              </div>
                            </div>
                          )}
                          
                          <div className={`max-w-[280px] lg:max-w-[320px] flex flex-col ${
                            isOutgoingMessage ? 'items-start' : 'items-end'
                          }`}>
                            
                            {/* Sender label - iPhone style */}
                            {showAvatar && (
                              <div className={`text-[11px] font-medium mb-1 px-2 ${
                                isFromBusiness ? 'text-gray-500 dark:text-gray-400' :
                                isFromVA ? 'text-gray-500 dark:text-gray-400' :
                                'text-gray-500 dark:text-gray-400'
                              } ${isOutgoingMessage ? 'text-left' : 'text-right'}`}>
                                {isFromBusiness ? selectedConversation.businessName :
                                 isFromVA ? selectedConversation.vaName :
                                 'You'}
                              </div>
                            )}
                            
                            {/* Message Bubble Container */}
                            <div className={`relative flex flex-col ${
                              isOutgoingMessage ? 'items-start' : 'items-end'
                            }`}>
                              
                              {/* Message Bubble - Authentic iPhone styling */}
                              <div
                                className={`px-4 py-2 max-w-full break-words transition-all duration-200 ${
                                  isOutgoingMessage
                                    ? 'bg-[#3496ff] text-white rounded-[18px] rounded-tl-[4px] shadow-sm'
                                    : 'bg-[#4b5563] text-white rounded-[18px] rounded-tr-[4px] shadow-sm'
                                }`}
                                style={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                  fontSize: '16px',
                                  lineHeight: '21px',
                                  fontWeight: '400',
                                  letterSpacing: '-0.24px'
                                }}
                              >
                                {message.attachments?.length && !getMessageText(message) ? '' : getMessageText(message)}
                              </div>
                              
                              {/* Attachments */}
                              {message.attachments?.length > 0 && (
                                <div className={`mt-1 space-y-1 ${isOutgoingMessage ? 'self-start' : 'self-end'}`}>
                                  {message.attachments.map((attachment, idx) => {
                                    const img = isImageType(attachment.type);
                                    return (
                                      <div
                                        key={attachment.id || idx}
                                        className={`p-2 rounded-lg shadow-sm ${
                                          isOutgoingMessage
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : 'bg-gray-100 dark:bg-gray-600'
                                        }`}
                                      >
                                        {img ? (
                                          <a href={attachment.url} target="_blank" rel="noreferrer" data-test="chat-attachment-image">
                                            <img
                                              src={attachment.url}
                                              alt={attachment.name}
                                              className="rounded-md"
                                              style={{ maxWidth: 220, maxHeight: 180, objectFit: 'cover' }}
                                            />
                                          </a>
                                        ) : (
                                          <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            download={attachment.name}
                                            className="flex items-center"
                                            data-test="chat-attachment-link"
                                          >
                                            <PaperClipIcon className="w-4 h-4 text-gray-500 mr-2" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 break-all">
                                              {attachment.name}
                                            </span>
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Timestamp and Status - iPhone style positioning */}
                              <div className={`mt-1 flex items-center space-x-1 ${
                                isOutgoingMessage ? 'self-start' : 'self-end'
                              }`}>
                                <span
                                  className="text-gray-500 dark:text-gray-400"
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '400',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                  }}
                                >
                                  {formatTime(message.timestamp || message.createdAt || new Date())}
                                </span>
                                
                                {/* Message Status Indicators - iPhone style */}
                                {isOutgoingMessage && (
                                  <div className="flex items-center">
                                    {message.isOptimistic ? (
                                      <>
                                        {message.isUploading ? (
                                          <div className="flex space-x-0.5 ml-1" title="Uploading...">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        ) : (
                                          <div className="flex space-x-0.5 ml-1">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        )}
                                        <span data-test="chat-message-status" className="sr-only">pending</span>
                                      </>
                                    ) : message.failed ? (
                                      <>
                                        <XCircleIcon className="w-4 h-4 text-red-500 ml-1" />
                                        <button
                                          onClick={() => (message.isUploading ? retryUpload(message) : retrySend(message))}
                                          className="text-[11px] text-red-600 ml-1 underline"
                                        >
                                          Retry
                                        </button>
                                        <span data-test="chat-message-status" className="sr-only">failed</span>
                                      </>
                                    ) : message.read ? (
                                      <>
                                        <span className="text-[11px] text-blue-500 ml-1 font-medium">Read</span>
                                        <span data-test="chat-message-status" className="sr-only">sent</span>
                                      </>
                                    ) : message.delivered ? (
                                      <>
                                        <span className="text-[11px] text-gray-500 ml-1">Delivered</span>
                                        <span data-test="chat-message-status" className="sr-only">sent</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[11px] text-gray-500 ml-1">Sent</span>
                                        <span data-test="chat-message-status" className="sr-only">sent</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Message sending animation */}
                              {message.isOptimistic && (
                                <div className="absolute inset-0 bg-white bg-opacity-10 rounded-[18px] animate-pulse" />
                              )}
                            </div>
                          </div>
                          
                          {/* Avatar for incoming messages (right side) */}
                          {isIncomingMessage && showAvatar && (
                            <div className="flex-shrink-0 mb-1 ml-2">
                              <UserCircleIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Typing Indicator - Only show when OTHER users are typing */}
                {otherUserTyping && (
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <UserCircleIcon className="w-8 h-8" />
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                    <span className="text-xs">Someone is typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview */}
              {replyTo && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArrowUturnLeftIcon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Replying to message</span>
                    </div>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Attachments ({attachments.length})
                    </span>
                    <button
                      onClick={() => setAttachments([])}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <PaperClipIcon className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{attachment.name}</span>
                        </div>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
                {/* Success Message */}
                {successMessage && (
                  <div className="mb-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-pulse">
                    <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      {successMessage}
                    </p>
                  </div>
                )}
                
                {/* Admin Mode Indicator */}
                {showAdminPanel && (
                  <div className="mb-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center">
                      <ChatBubbleOvalLeftEllipsisIcon className="w-3 h-3 mr-1" />
                      Chat with Business Mode - Replying as the VA
                    </p>
                  </div>
                )}
                
                <div className="flex items-end space-x-2">
                  {/* Attach button and hidden input */}
                  <button
                    type="button"
                    onClick={openFilePicker}
                    title="Attach files"
                    data-test="chat-attach-button"
                    className="p-2 mr-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    disabled={!selectedConversation || isUploading}
                  >
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    data-test="chat-attach-input"
                    className="hidden"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,audio/mpeg,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                  />
                  
                  <div className="flex-1 flex items-end space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={showAdminPanel ? "Chat with business... (Press Enter to send)" : "Type a message... (Press Enter to send)"}
                      data-test="chat-input"
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                      rows="1"
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && attachments.length === 0}
                      data-test="chat-send"
                      className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Panel - Enhanced */}
            {showAdminPanel && (
              <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                {/* Header with Toggle */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 mr-2 text-blue-500" />
                      Admin Controls
                    </h3>
                    <button
                      onClick={() => setShowAdminPanel(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Status Badge */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Conversation Status</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full flex items-center ${
                        selectedConversation?.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : selectedConversation?.status === 'resolved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {selectedConversation?.status === 'pending' && <FireIcon className="w-3 h-3 mr-1" />}
                        {selectedConversation?.status === 'resolved' && <ArchiveBoxIcon className="w-3 h-3 mr-1" />}
                        {selectedConversation?.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Message Filter Toggle */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Message Filtering
                    </h4>
                    <button
                      onClick={() => setFilterAdminMessages(!filterAdminMessages)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <FunnelIcon className="w-4 h-4 mr-2" />
                        Filter Admin Messages
                      </span>
                      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        filterAdminMessages ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          filterAdminMessages ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </div>
                    </button>
                  </div>

                  {/* Primary Actions Group */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Primary Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (newMessage.trim()) {
                            sendMessage();
                          } else {
                            alert('Please type a message first');
                          }
                        }}
                        disabled={!newMessage.trim() && attachments.length === 0}
                        className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                      >
                        <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Chat with Business</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm('Send a direct message to the VA about this conversation?')) {
                            chatWithVA();
                          }
                        }}
                        className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <ChatBubbleLeftRightIcon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Chat with VA</span>
                      </button>
                      
                      {selectedConversation?.status !== 'resolved' ? (
                        <button
                          onClick={() => {
                            if (window.confirm('Move this conversation to the archive?')) {
                              markAsResolved();
                            }
                          }}
                          data-test="conversation-archive-button"
                          className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md"
                        >
                          <ArchiveBoxIcon className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">Archive</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm('Unarchive this conversation?')) {
                              unarchive();
                            }
                          }}
                          data-test="conversation-unarchive-button"
                          className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-sm hover:shadow-md"
                        >
                          <ArchiveBoxIcon className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">Unarchive</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          if (window.confirm('Mark this conversation as spam?')) {
                            // Add spam marking logic
                          }
                        }}
                        className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <ExclamationTriangleIcon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Mark Spam</span>
                      </button>
                    </div>
                  </div>

                  {/* Internal Notes Section - Fixed to prevent duplication */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Internal Notes
                    </h4>
                    
                    <div className="space-y-2">
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add internal notes about this conversation..."
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                        rows="3"
                      />
                      <button
                        onClick={addAdminNote}
                        disabled={!adminNote.trim()}
                        className="w-full px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Conversation Details */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Conversation Details
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Business:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedConversation?.businessName || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">VA:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedConversation?.vaName || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Messages:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getConversationMessages(selectedConversation).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Started:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedConversation?.createdAt 
                            ? new Date(selectedConversation.createdAt).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                      {selectedConversation?.interceptedAt && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Intercepted:</span>
                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                              {new Date(selectedConversation.interceptedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Settings */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Quick Settings
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setNotifications(!notifications)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          {notifications ? (
                            <BellIcon className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <BellSlashIcon className="w-4 h-4 mr-2 text-gray-400" />
                          )}
                          Notifications
                        </span>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Help Text */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      💡 Admin actions are logged and tracked
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="relative inline-block">
              {activeTab === 'unread' ? (
                <ClockIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
              ) : activeTab === 'archive' ? (
                <ArchiveBoxIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
              ) : (
                <ChatBubbleLeftRightIcon className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
              )}
              <SparklesIcon className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === 'unread' ? 'Select an unread conversation' :
               activeTab === 'archive' ? 'Select an archived conversation' :
               'Select a conversation'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'unread' ? 'Choose an unread conversation from the list to start messaging' :
               activeTab === 'archive' ? 'Browse archived conversations to review past interactions' :
               'Choose a conversation from the list to start messaging'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessengerChat;