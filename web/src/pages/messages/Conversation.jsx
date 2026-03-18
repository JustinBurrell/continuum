import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';

// Verified backend shape:
// GET /conversations/:id/messages -> { messages[], hasMore }
// Each message: { _id, conversationId, senderId: { _id, username, firstName, lastName }, content, createdAt }
// GET /conversations -> { conversations[] }
// Each participant: { _id, username, firstName, lastName } (no avatarUrl in populate)

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || '';
}

export default function Conversation({ conversationId }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const bottomRef = useRef(null);
  const markedReadRef = useRef(new Set());

  const { data: convData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then(r => r.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get(`/conversations/${conversationId}/messages`).then(r => r.data),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) =>
      api.post(`/conversations/${conversationId}/messages`, { content }),
    onSuccess: () => {
      setMessage('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]);

  useEffect(() => {
    if (!user || !data) return;
    const messages = data?.messages || [];
    messages.forEach(msg => {
      const senderId = msg.senderId?._id ?? msg.senderId;
      const isOwn = senderId === user._id;
      if (!isOwn && !markedReadRef.current.has(msg._id)) {
        markedReadRef.current.add(msg._id);
        api.put(`/messages/${msg._id}/read`).catch(() => {});
      }
    });
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #ede9fe', background: '#fff', flexShrink: 0 }}>
        <Link to="/messages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#a087b0', textDecoration: 'none', flexShrink: 0, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
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
            <Avatar name={fullName(other)} src={other?.avatarUrl || null} size="sm" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                {fullName(other)}
              </p>
              <p style={{ fontSize: 11, color: '#a087b0', margin: 0 }}>@{other.username}</p>
            </div>
          </Link>
        ) : (
          <div style={{ flex: 1, height: 32 }} />
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', background: '#fef7ff' }}>
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
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Send size={20} style={{ color: '#a087b0' }} />
              </div>
              <p style={{ fontSize: 13, color: '#a087b0' }}>No messages yet. Say hello!</p>
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
                    <Avatar name={senderName} src={null} size="sm" />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '68%' }}>
                  {!isOwn && isFirstInGroup && (
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#a087b0', marginBottom: 4, marginLeft: 4 }}>
                      {senderName}
                    </p>
                  )}

                  <div style={{
                    padding: '9px 14px',
                    fontSize: 14,
                    lineHeight: 1.5,
                    background: isOwn ? '#6b21a8' : '#fff',
                    color: isOwn ? '#fff' : '#111827',
                    border: isOwn ? 'none' : '1px solid #ede9fe',
                    borderRadius: isOwn
                      ? `${isFirstInGroup ? 18 : 10}px ${isLastInGroup ? 4 : 18}px 18px 18px`
                      : `${isFirstInGroup ? 18 : 10}px 18px 18px ${isLastInGroup ? 4 : 18}px`,
                    wordBreak: 'break-word',
                    boxShadow: isOwn ? 'none' : '0 1px 4px rgba(107,33,168,0.06)',
                  }}>
                    {msg.content}
                  </div>

                  {isLastInGroup && (
                    <p style={{ fontSize: 10, color: '#c4b5d4', marginTop: 4, marginLeft: isOwn ? 0 : 4, marginRight: isOwn ? 4 : 0 }}>
                      {formatRelative(msg.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid #ede9fe', background: '#fff', alignItems: 'center' }}>
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
            border: '1px solid #ede9fe',
            background: '#fef7ff',
            fontSize: 14,
            color: '#111827',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#6b21a8'}
          onBlur={e => e.target.style.borderColor = '#ede9fe'}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: message.trim() ? '#6b21a8' : '#f5f0ff',
            border: 'none',
            cursor: message.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <Send size={16} style={{ color: message.trim() ? '#fff' : '#a087b0' }} />
        </button>
      </div>
    </div>
  );
}
