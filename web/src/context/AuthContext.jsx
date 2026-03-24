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

  // Shared task mutations (status change, field update, participant change)
  socket.on('task_updated', () => {
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
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, refreshToken, user: u } = res.data;
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    const socket = connectSocket(token);
    registerSocketEvents(socket);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, refreshToken, user: u } = res.data;
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    const socket = connectSocket(token);
    registerSocketEvents(socket);
    return u;
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const googleLogin = useCallback(() => {
    window.location.href =
      (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/google';
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
