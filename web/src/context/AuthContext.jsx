import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import queryClient from '@/lib/queryClient';

const AuthContext = createContext(null);

// All socket events and which React Query keys they invalidate
function registerSocketEvents(socket) {
  // Direct messages — invalidate the conversation and inbox
  socket.on('new_message', ({ conversationId }) => {
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  });

  // Friend requests / accepted
  socket.on('friend_request', () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
  });
  socket.on('friend_accepted', () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
  });

  // Task mutations — existing and new Phase 2 events
  socket.on('task_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  });
  socket.on('task_created', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  });
  socket.on('task_deleted', () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  });

  // Note updates and shares
  socket.on('note_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });
  socket.on('note_shared', () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });

  // New comment on something you own
  socket.on('comment_added', ({ targetType, targetId }) => {
    if (targetType === 'note') queryClient.invalidateQueries({ queryKey: ['note', targetId] });
    if (targetType === 'flashcardSet') queryClient.invalidateQueries({ queryKey: ['flashcard-set', targetId] });
    if (targetType === 'task') queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  });

  // Flashcard set shared with you
  socket.on('flashcard_shared', () => {
    queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
  });

  // Activity feed — someone's action just appeared in your feed
  socket.on('activity_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  });

  // Study session completed — refresh streak and history in any open tab
  socket.on('study:session-complete', () => {
    queryClient.invalidateQueries({ queryKey: ['study-streak'] });
    queryClient.invalidateQueries({ queryKey: ['study-sessions-all'] });
  });

}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        // Reconnect socket on page refresh if already logged in
        const socket = connectSocket(token);
        registerSocketEvents(socket);
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
    const socket = connectSocket(token);
    registerSocketEvents(socket);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: u } = res.data;
    localStorage.setItem('token', token);
    setUser(u);
    const socket = connectSocket(token);
    registerSocketEvents(socket);
    return u;
  }, []);

  const logout = useCallback(() => {
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
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, googleLogin, updateUser }}>
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
