import { useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Custom hook for managing real-time message counts
 * Provides counts for inbox, archived, and total unread messages
 */
export function useMessageCounts(options = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['message-counts', user?.id],
    queryFn: async ({ signal }) => {
      if (!user) {
        return { 
          inboxCount: 0, 
          archivedCount: 0, 
          totalUnread: 0, 
          lastUpdated: null,
          gated: false 
        };
      }

      const response = await api.get('/conversations/counts', { signal });
      return response.data.data;
    },
    enabled: !!user,
    staleTime: options.staleTime ?? 5000, // 5 seconds stale time
    refetchInterval: options.refetchInterval ?? 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    refetchOnReconnect: options.refetchOnReconnect ?? true,
    refetchOnMount: options.refetchOnMount ?? 'always',
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
    onError: (error) => {
      console.error('Failed to fetch message counts:', error);
    }
  });

  const data = query.data ?? { 
    inboxCount: 0, 
    archivedCount: 0, 
    totalUnread: 0, 
    lastUpdated: null,
    gated: false 
  };

  // Optimistic update functions
  const updateCounts = useMemo(() => ({
    // Increment inbox count (when new conversation is created)
    incrementInbox: () => {
      queryClient.setQueryData(['message-counts', user?.id], (old) => {
        if (!old) return data;
        return {
          ...old,
          inboxCount: old.inboxCount + 1,
          totalUnread: old.totalUnread + 1,
          lastUpdated: new Date().toISOString()
        };
      });
    },

    // Decrement inbox and increment archived (when conversation is archived)
    moveToArchived: () => {
      queryClient.setQueryData(['message-counts', user?.id], (old) => {
        if (!old) return data;
        return {
          ...old,
          inboxCount: Math.max(0, old.inboxCount - 1),
          archivedCount: old.archivedCount + 1,
          lastUpdated: new Date().toISOString()
        };
      });
    },

    // Decrement archived and increment inbox (when conversation is unarchived)
    moveToInbox: () => {
      queryClient.setQueryData(['message-counts', user?.id], (old) => {
        if (!old) return data;
        return {
          ...old,
          inboxCount: old.inboxCount + 1,
          archivedCount: Math.max(0, old.archivedCount - 1),
          lastUpdated: new Date().toISOString()
        };
      });
    },

    // Update unread count
    updateUnread: (delta) => {
      queryClient.setQueryData(['message-counts', user?.id], (old) => {
        if (!old) return data;
        return {
          ...old,
          totalUnread: Math.max(0, old.totalUnread + delta),
          lastUpdated: new Date().toISOString()
        };
      });
    },

    // Force refresh from server
    refresh: () => {
      queryClient.invalidateQueries(['message-counts', user?.id]);
    }
  }), [queryClient, user?.id, data]);

  return useMemo(() => ({
    inboxCount: data.inboxCount,
    archivedCount: data.archivedCount,
    totalUnread: data.totalUnread,
    lastUpdated: data.lastUpdated,
    gated: data.gated,
    isLoading: query.isLoading,
    error: query.error ?? null,
    ...updateCounts
  }), [
    data.inboxCount,
    data.archivedCount,
    data.totalUnread,
    data.lastUpdated,
    data.gated,
    query.isLoading,
    query.error,
    updateCounts
  ]);
}

export default useMessageCounts;