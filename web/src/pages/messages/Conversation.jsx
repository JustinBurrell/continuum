import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';

// Verified backend shape:
// GET /conversations/:id/messages → { messages[], hasMore }
// Each message: { _id, conversationId, senderId: { _id, username, firstName, lastName }, content, createdAt }
// GET /conversations → { conversations[] }
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
      // senderId is populated object; extract _id safely
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
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 flex-shrink-0 px-5 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        {other ? (
          <Link to="/users/view" state={{ id: other._id }} className="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity">
            <Avatar name={fullName(other)} src={null} size="sm" />
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {fullName(other)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>@{other.username}</p>
            </div>
          </Link>
        ) : (
          <div style={{ height: 32 }} />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <Skeleton className="h-9 w-44 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, idx) => {
            // senderId is populated: { _id, username, firstName, lastName }
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
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                style={{ marginTop: isFirstInGroup ? 12 : 2 }}
              >
                {/* Avatar slot — only show for other, last in group */}
                <div style={{ width: 28, flexShrink: 0 }}>
                  {!isOwn && isLastInGroup && (
                    <Avatar name={senderName} src={null} size="sm" />
                  )}
                </div>

                <div
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  style={{ maxWidth: '68%' }}
                >
                  {!isOwn && isFirstInGroup && (
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>
                      {senderName}
                    </p>
                  )}

                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 14,
                      lineHeight: 1.45,
                      background: isOwn ? 'var(--primary)' : 'var(--bg-card)',
                      color: isOwn ? '#ffffff' : 'var(--text-primary)',
                      border: isOwn ? 'none' : '1px solid var(--border)',
                      borderRadius: isOwn
                        ? `${isFirstInGroup ? 18 : 10}px ${isLastInGroup ? 4 : 18}px 18px 18px`
                        : `${isFirstInGroup ? 18 : 10}px 18px 18px ${isLastInGroup ? 4 : 18}px`,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>

                  {isLastInGroup && (
                    <p
                      className="text-xs mt-1"
                      style={{
                        color: 'var(--text-tertiary)',
                        marginLeft: isOwn ? 0 : 4,
                        marginRight: isOwn ? 4 : 0,
                      }}
                    >
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

      {/* Input */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 py-3"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <input
          type="text"
          placeholder="Message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          className="input-field flex-1"
          style={{ borderRadius: 20 }}
        />
        <Button
          onClick={handleSend}
          loading={sendMutation.isPending}
          disabled={!message.trim()}
        >
          <Send size={15} />
        </Button>
      </div>
    </div>
  );
}
