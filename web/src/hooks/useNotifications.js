import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { posthog } from '@/lib/posthog';

// ============================================================
// NOTIFICATIONS HOOKS
// Splits into two query keys:
//   ['notifications-bell']  - first page only (limit 10), drives the bell badge
//   ['notifications-feed']  - infinite cursor pages, drives the /notifications page
// ============================================================

// Fetches the first page with a small limit for the bell dropdown
export function useNotificationsBell() {
    return useQuery({
        queryKey: ['notifications-bell'],
        queryFn: () =>
            api.get('/notifications', { params: { limit: 10 } }).then(r => r.data),
        staleTime: 30_000,
    });
}

// Cursor-based infinite query for the full /notifications history page
export function useNotificationsFeed() {
    return useInfiniteQuery({
        queryKey: ['notifications-feed'],
        queryFn: ({ pageParam }) =>
            api.get('/notifications', {
                params: pageParam ? { cursor: pageParam, limit: 20 } : { limit: 20 },
            }).then(r => r.data),
        initialPageParam: null,
        getNextPageParam: (last) => last?.nextCursor ?? null,
        staleTime: 30_000,
    });
}

// Mark all unread notifications as read
export function useMarkAllRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ source }) => {
            posthog.capture('notification_all_marked_read', { source, count: source });
            return api.patch('/notifications/read');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-feed'] });
        },
    });
}

// Mark a single notification as read (optimistic update on both caches)
export function useMarkOneRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.patch(`/notifications/${id}/read`),
        onMutate: async (id) => {
            // Optimistically mark read in bell cache
            queryClient.setQueryData(['notifications-bell'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    notifications: (old.notifications || []).map(n =>
                        n._id === id ? { ...n, read: true } : n
                    ),
                    unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
                };
            });
            // Optimistically mark read in feed cache
            queryClient.setQueriesData({ queryKey: ['notifications-feed'] }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        notifications: (page.notifications || []).map(n =>
                            n._id === id ? { ...n, read: true } : n
                        ),
                    })),
                };
            });
        },
    });
}

// Delete a notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, type }) => {
            posthog.capture('notification_dismissed', { type });
            return api.delete(`/notifications/${id}`);
        },
        onSuccess: (_, { id }) => {
            queryClient.setQueryData(['notifications-bell'], (old) => {
                if (!old) return old;
                const removed = (old.notifications || []).find(n => n._id === id);
                return {
                    ...old,
                    notifications: (old.notifications || []).filter(n => n._id !== id),
                    unreadCount: removed && !removed.read
                        ? Math.max(0, (old.unreadCount || 0) - 1)
                        : (old.unreadCount || 0),
                };
            });
            queryClient.setQueriesData({ queryKey: ['notifications-feed'] }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        notifications: (page.notifications || []).filter(n => n._id !== id),
                    })),
                };
            });
        },
    });
}
