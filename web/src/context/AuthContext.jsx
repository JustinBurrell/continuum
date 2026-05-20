import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import queryClient from '@/lib/queryClient';
import { posthog } from '@/lib/posthog';

const AuthContext = createContext(null);

// All socket events and which React Query keys they invalidate.
// getActiveConversation() returns the conversationId the user is currently viewing,
// used to suppress unread badge increments and bell updates for the active chat.
// Calls socket.off() before socket.on() so re-registering on re-renders or token
// refresh never stacks duplicate listeners.
function registerSocketEvents(socket, getActiveConversation) {
  // Direct messages — write directly into cache for instant display, then sync sidebar
  socket.off('new_message');
  socket.on('new_message', ({ conversationId, message }) => {
    const isActive = getActiveConversation() === conversationId;

    // Append to any open message query for this conversation (skip active search results).
    // Dedup by _id so re-registration or StrictMode double-invoke never inserts twice.
    const queries = queryClient.getQueriesData({ queryKey: ['messages', conversationId] });
    queries.forEach(([key, data]) => {
      const searchTerm = key[2];
      if (!searchTerm && data) {
        queryClient.setQueryData(key, old => {
          if (!old) return old;
          if (old.messages?.some(m => m._id === message._id)) return old;
          return { ...old, messages: [...(old.messages || []), message] };
        });
      }
    });

    // Update conversations sidebar: bump lastMessage preview, only increment unread
    // when the user is NOT already reading this conversation.
    queryClient.setQueryData(['conversations'], old => {
      if (!old) return old;
      const updated = (old.conversations || []).map(conv =>
        conv._id === conversationId
          ? {
              ...conv,
              lastMessage: {
                senderId: message.senderId?._id ?? message.senderId,
                content: message.content,
                sentAt: message.createdAt,
              },
              unreadCount: isActive ? 0 : (conv.unreadCount || 0) + 1,
            }
          : conv
      );
      updated.sort(
        (a, b) => new Date(b.lastMessage?.sentAt || 0) - new Date(a.lastMessage?.sentAt || 0)
      );
      return { ...old, conversations: updated };
    });
  });

  // Friend requests / accepted — invalidate all three friend query keys
  socket.off('friend_request');
  socket.on('friend_request', () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
  });
  socket.off('friend_accepted');
  socket.on('friend_accepted', () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
  });

  // Task mutations — existing and new Phase 2 events
  socket.off('task_updated');
  socket.on('task_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  });
  socket.off('task_created');
  socket.on('task_created', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  });
  socket.off('task_deleted');
  socket.on('task_deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  });

  // Note updates, shares, and deletions
  socket.off('note_updated');
  socket.on('note_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });
  socket.off('note_shared');
  socket.on('note_shared', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });
  socket.off('note_deleted');
  socket.on('note_deleted', ({ noteId }) => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.removeQueries({ queryKey: ['note', noteId] });
  });

  // New comment on something you own
  socket.off('comment_added');
  socket.on('comment_added', ({ targetType, targetId }) => {
    if (targetType === 'note') queryClient.invalidateQueries({ queryKey: ['note', targetId] });
    if (targetType === 'flashcardSet') queryClient.invalidateQueries({ queryKey: ['flashcard-set', targetId] });
    if (targetType === 'task') queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  });

  // Someone liked your comment
  socket.off('like_added');
  socket.on('like_added', () => {
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  });

  // Flashcard set shared with or deleted for you
  socket.off('flashcard_shared');
  socket.on('flashcard_shared', () => {
    queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
  });
  socket.off('flashcard_set_deleted');
  socket.on('flashcard_set_deleted', ({ setId }) => {
    queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
    queryClient.removeQueries({ queryKey: ['flashcard-set', setId] });
  });

  // Activity feed — someone's action just appeared in your feed
  socket.off('activity_updated');
  socket.on('activity_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  });

  // Study session completed — refresh streak and history in any open tab
  socket.off('study:session-complete');
  socket.on('study:session-complete', () => {
    queryClient.invalidateQueries({ queryKey: ['study-streak'] });
    queryClient.invalidateQueries({ queryKey: ['study-sessions-all'] });
  });

  // New notification — refresh bell, but skip if it's a message for the active conversation
  // (user is already reading that chat so no need to ring the bell).
  socket.off('new_notification');
  socket.on('new_notification', ({ type, targetId } = {}) => {
    if (type === 'new_message' && targetId && getActiveConversation() === targetId) return;
    queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-feed'] });
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forceOnboardingOpen, setForceOnboardingOpen] = useState(false);
  const activeConversationRef = useRef(null);
  const setActiveConversation = useCallback((id) => { activeConversationRef.current = id; }, []);

  // Hydrate user from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data.user || res.data.data;
        setUser(u);
        if (u.isDemo || u.isSeedUser) {
          posthog.opt_out_capturing();
        } else {
          posthog.identify(u._id, {
            email: u.email,
            username: u.username,
            name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username,
            created_at: u.createdAt,
            onboardingGoal: u.onboardingGoal ?? null,
            tourCompleted: u.tourCompleted ?? false,
          });
        }
        // Reconnect socket on page refresh if already logged in
        const socket = connectSocket(token);
        registerSocketEvents(socket, () => activeConversationRef.current);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    setUser(u);
    if (u.isDemo || u.isSeedUser) {
      posthog.opt_out_capturing();
    } else {
      posthog.identify(u._id, {
        email: u.email,
        username: u.username,
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username,
        created_at: u.createdAt,
      });
      posthog.capture('user_logged_in', { platform: 'web', method: 'email' });
    }
    const socket = connectSocket(token);
    registerSocketEvents(socket);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    setUser(u);
    if (u.isDemo || u.isSeedUser) {
      posthog.opt_out_capturing();
    } else {
      posthog.identify(u._id, {
        email: u.email,
        username: u.username,
        name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username,
        created_at: u.createdAt,
      });
      posthog.capture('user_registered', { platform: 'web', method: 'email' });
    }
    const socket = connectSocket(token);
    registerSocketEvents(socket);
    return u;
  }, []);

  const logout = useCallback(() => {
    if (!posthog.has_opted_out_capturing()) {
      posthog.capture('user_logged_out', { platform: 'web' });
    }
    posthog.opt_in_capturing();
    posthog.reset();
    api.post('/auth/logout').catch(() => {});
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    setUser(null);
  }, []);

  const googleLogin = useCallback(() => {
    window.location.href =
      (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/auth/google';
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, googleLogin, updateUser, forceOnboardingOpen, setForceOnboardingOpen, setActiveConversation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
