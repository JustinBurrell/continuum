import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, ArrowLeft, FileText, BookOpen, CheckSquare, Search, X, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { posthog } from '@/lib/posthog';
import AppAvatar from '@/components/ui/AppAvatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

// Verified backend shape:
// GET /conversations/:id/messages -> { messages[], hasMore }
// Each message: { _id, conversationId, senderId: { _id, username, firstName, lastName, avatarUrl }, content, createdAt }
// GET /conversations -> { conversations[] }
// Each participant: { _id, username, firstName, lastName, avatarUrl }

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || '';
}

// Parse share messages: [shared:contentType:contentId] display text
function parseShareMessage(content) {
  const match = content.match(/^\[shared:(\w+):([a-f0-9]+)\]\s*(.*)$/i);
  if (!match) return null;
  const [, contentType, contentId, displayText] = match;
  let link, icon, label;
  if (contentType === 'note') {
    link = '/notes/view';
    icon = FileText;
    label = 'View note';
  } else if (contentType === 'flashcardSet') {
    link = '/flashcards/view';
    icon = BookOpen;
    label = 'View flashcards';
  } else if (contentType === 'task') {
    link = '/tasks';
    icon = CheckSquare;
    label = 'View tasks';
  } else {
    return null;
  }
  return { contentType, contentId, displayText, link, icon, label };
}

export default function Conversation({ conversationId }) {
  const { user, setActiveConversation } = useAuth();

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteConvConfirm, setShowDeleteConvConfirm] = useState(false);
  const bottomRef = useRef(null);
  const searchInputRef = useRef(null);
  const markedReadRef = useRef(new Set());

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then(r => r.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['messages', conversationId, msgSearch],
    queryFn: () =>
      api.get(`/conversations/${conversationId}/messages`, { params: msgSearch ? { search: msgSearch } : {} }).then(r => r.data),
    refetchInterval: false,
  });

  const msgQueryKey = ['messages', conversationId, msgSearch];

  // Feed-forward prefetch: when the user is reading a conversation, silently
  // prefetch the next one in the inbox so clicking it is instant.
  useEffect(() => {
    const conversations = convData?.conversations || [];
    const idx = conversations.findIndex(c => c._id === conversationId);
    const next = conversations[idx + 1];
    if (!next) return;
    const nextKey = ['messages', next._id, ''];
    queryClient.prefetchQuery({
      queryKey: nextKey,
      queryFn: () => api.get(`/conversations/${next._id}/messages`).then(r => r.data),
    });
  }, [conversationId, convData]);

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => api.delete(`/messages/${messageId}`),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: msgQueryKey });
      const prev = queryClient.getQueryData(msgQueryKey);
      queryClient.setQueryData(msgQueryKey, (old) => {
        if (!old) return old;
        return { ...old, messages: old.messages.filter(m => m._id !== messageId) };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(msgQueryKey, ctx.prev);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: () => api.delete(`/conversations/${conversationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate('/messages');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content) =>
      api.post(`/conversations/${conversationId}/messages`, { content }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: msgQueryKey });
      const prev = queryClient.getQueryData(msgQueryKey);
      const tempMsg = {
        _id: `temp-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        senderId: user,
        _temp: true,
      };
      queryClient.setQueryData(msgQueryKey, (old) => {
        if (!old) return old;
        return { ...old, messages: [...(old.messages || []), tempMsg] };
      });
      // Instantly move this conversation to the top of the sidebar with the new preview
      queryClient.setQueryData(['conversations'], old => {
        if (!old) return old;
        const updated = (old.conversations || []).map(conv =>
          conv._id === conversationId
            ? { ...conv, lastMessage: { senderId: user?._id, content: content.substring(0, 200), sentAt: tempMsg.createdAt } }
            : conv
        );
        updated.sort((a, b) => new Date(b.lastMessage?.sentAt || 0) - new Date(a.lastMessage?.sentAt || 0));
        return { ...old, conversations: updated };
      });
      return { prev };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(msgQueryKey, ctx.prev);
    },
    onSuccess: (res) => {
      posthog.capture('message_sent', { platform: 'web' });
      setMessage('');
      // Swap the temp placeholder with the real server message — no extra network request needed
      const realMsg = res.data?.message;
      if (realMsg) {
        queryClient.setQueryData(msgQueryKey, old => {
          if (!old) return old;
          return { ...old, messages: old.messages.map(m => m._temp ? realMsg : m) };
        });
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]);

  useEffect(() => {
    if (!user || !data) return;
    const messages = data?.messages || [];
    let markedAny = false;
    messages.forEach(msg => {
      const senderId = msg.senderId?._id ?? msg.senderId;
      const isOwn = senderId === user._id;
      if (!isOwn && !markedReadRef.current.has(msg._id)) {
        markedReadRef.current.add(msg._id);
        api.put(`/messages/${msg._id}/read`).catch(() => {});
        markedAny = true;
      }
    });
    // Sync sidebar unread count after marking messages read
    if (markedAny) {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [data, user]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  }, [message, sendMutation]);

  const conversations = convData?.conversations || [];
  const conv = conversations.find(c => c._id === conversationId);
  const other = conv?.participants?.find(p => p._id !== user?._id);
  // Backend returns newest-first; reverse so oldest is at top, newest at bottom
  const messages = (data?.messages || []).slice().reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px' }}>
          <Link to="/messages" aria-label="Back to messages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#9CA3AF', textDecoration: 'none', flexShrink: 0, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={18} />
          </Link>

          {other ? (
            <Link
              to="/users/view"
              state={{ id: other._id }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1 }}
              className="hover:opacity-80 transition-opacity"
            >
              <AppAvatar name={fullName(other)} src={other?.avatarUrl || null} size="sm" />
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: 1.2 }}>
                  {fullName(other)}<VerifiedBadge roles={other?.roles} />
                </span>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>@{other.username}</p>
              </div>
            </Link>
          ) : (
            <div style={{ flex: 1, height: 32 }} />
          )}

          <button
            aria-label="Search messages"
            onClick={() => {
              setShowSearch(s => !s);
              setMsgSearch('');
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: showSearch ? 'rgba(107,33,168,0.08)' : 'transparent',
              color: showSearch ? '#6b21a8' : '#9CA3AF',
              cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            <Search size={16} />
          </button>

          <button
            aria-label="Delete conversation"
            onClick={() => setShowDeleteConvConfirm(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: showDeleteConvConfirm ? '#fef2f2' : 'transparent',
              color: showDeleteConvConfirm ? '#dc2626' : '#9CA3AF',
              cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (!showDeleteConvConfirm) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; } }}
            onMouseLeave={e => { if (!showDeleteConvConfirm) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}
          >
            <Trash2 size={15} />
          </button>
        </div>

        {showDeleteConvConfirm && (
          <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#374151', flex: 1, margin: 0 }}>
              Delete this conversation for you? The other person won't be notified.
            </p>
            <button
              onClick={() => deleteConversationMutation.mutate()}
              disabled={deleteConversationMutation.isPending}
              style={{
                padding: '5px 14px', borderRadius: 8,
                background: 'transparent', border: '1px solid #E5E7EB', color: '#dc2626', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              {deleteConversationMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConvConfirm(false)}
              style={{
                padding: '5px 10px', borderRadius: 8, border: '1px solid #E5E7EB',
                background: 'transparent', color: '#9CA3AF', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {showSearch && (
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                value={msgSearch}
                onChange={e => setMsgSearch(e.target.value)}
                placeholder="Search messages..."
                style={{
                  width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                  borderRadius: 10, border: '1px solid #E5E7EB', background: '#F8F9FA',
                  fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#6b21a8'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
            {msgSearch && (
              <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                {messages.length} result{messages.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              aria-label="Close search"
              onClick={() => { setShowSearch(false); setMsgSearch(''); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', background: '#F8F9FA' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <Skeleton className="h-9 w-44 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Send size={20} style={{ color: '#9CA3AF' }} />
              </div>
              <p style={{ fontSize: 13, color: '#6B7280' }}>No messages yet. Say hello!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = msg.senderId?._id ?? msg.senderId;
            const isOwn = senderId === user?._id;

            const prevMsg = messages[idx - 1];
            const prevSenderId = prevMsg ? (prevMsg.senderId?._id ?? prevMsg.senderId) : null;
            const isFirstInGroup = senderId !== prevSenderId;

            const nextMsg = messages[idx + 1];
            const nextSenderId = nextMsg ? (nextMsg.senderId?._id ?? nextMsg.senderId) : null;
            const isLastInGroup = senderId !== nextSenderId;

            const senderName = fullName(msg.senderId) || fullName(other);

            return (
              <div
                key={msg._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 8,
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  marginTop: isFirstInGroup ? 16 : 3,
                }}
              >
                {/* Avatar slot */}
                <div style={{ width: 28, flexShrink: 0 }}>
                  {!isOwn && isLastInGroup && (
                    <AppAvatar name={senderName} src={msg.senderId?.avatarUrl || null} size="sm" />
                  )}
                </div>

                <div className="group" style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '68%' }}>
                  {!isOwn && isFirstInGroup && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginBottom: 4, marginLeft: 4 }}>
                      <Link
                        to="/users/view"
                        state={{ id: msg.senderId?._id ?? msg.senderId }}
                        style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
                      >
                        {senderName}
                      </Link>
                    </span>
                  )}

                  {(() => {
                    const shareData = parseShareMessage(msg.content);
                    const bubbleRadius = isOwn
                      ? `${isFirstInGroup ? 18 : 10}px ${isLastInGroup ? 4 : 18}px 18px 18px`
                      : `${isFirstInGroup ? 18 : 10}px 18px 18px ${isLastInGroup ? 4 : 18}px`;

                    if (shareData) {
                      const Icon = shareData.icon;
                      return (
                        <div style={{
                          padding: '12px 14px',
                          fontSize: 14,
                          lineHeight: 1.5,
                          background: isOwn ? '#6b21a8' : '#fff',
                          color: isOwn ? '#fff' : '#111827',
                          border: isOwn ? 'none' : '1px solid #E5E7EB',
                          borderRadius: bubbleRadius,
                          wordBreak: 'break-word',
                          boxShadow: isOwn ? 'none' : '0 1px 4px rgba(107,33,168,0.06)',
                        }}>
                          <p style={{ margin: '0 0 8px 0' }}>{shareData.displayText}</p>
                          <Link
                            to={shareData.link}
                            state={shareData.contentType !== 'task' ? { id: shareData.contentId } : { openTaskId: shareData.contentId }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(107,33,168,0.08)',
                              color: isOwn ? '#fff' : '#6b21a8',
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: 'none',
                              transition: 'opacity 0.12s',
                            }}
                          >
                            <Icon size={13} /> {shareData.label}
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <div style={{
                        padding: '9px 14px',
                        fontSize: 14,
                        lineHeight: 1.5,
                        background: isOwn ? '#6b21a8' : '#fff',
                        color: isOwn ? '#fff' : '#111827',
                        border: isOwn ? 'none' : '1px solid #E5E7EB',
                        borderRadius: bubbleRadius,
                        wordBreak: 'break-word',
                        boxShadow: isOwn ? 'none' : '0 1px 4px rgba(107,33,168,0.06)',
                      }}>
                        {msg.content}
                      </div>
                    );
                  })()}

                  {isLastInGroup && (
                    <p style={{ fontSize: 10, color: '#D1D5DB', marginTop: 4, marginLeft: isOwn ? 0 : 4, marginRight: isOwn ? 4 : 0 }}>
                      {formatRelative(msg.createdAt)}
                    </p>
                  )}

                  {!msg._temp && (
                    <button
                      aria-label="Delete message"
                      onClick={() => deleteMessageMutation.mutate(msg._id)}
                      className="opacity-0 group-hover:opacity-100"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 22, height: 22, borderRadius: 6, border: 'none',
                        background: 'transparent', color: '#D1D5DB', cursor: 'pointer',
                        marginTop: 2, transition: 'color 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {user?.isDemo ? (
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid #E5E7EB', background: '#F8F9FA', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Messaging is view-only in the demo account.</p>
        </div>
      ) : (
        <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid #E5E7EB', background: '#fff', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: 24,
              border: '1px solid #E5E7EB',
              background: '#F8F9FA',
              fontSize: 14,
              color: '#111827',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#6b21a8'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: message.trim() ? '#6b21a8' : 'rgba(107,33,168,0.08)',
              border: 'none',
              cursor: message.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <Send size={16} style={{ color: message.trim() ? '#fff' : '#9CA3AF' }} />
          </button>
        </div>
      )}
    </div>
  );
}
