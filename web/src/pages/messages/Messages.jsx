import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageCircle, Plus, Search, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Button from '@/components/ui/Button';
import AppAvatar from '@/components/ui/AppAvatar';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative, truncate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export default function Messages() {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [convSearch, setConvSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', convSearch],
    queryFn: () => api.get('/conversations', { params: convSearch ? { search: convSearch } : {} }).then(r => r.data),
  });

  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends').then(r => r.data),
  });

  const newConvMutation = useMutation({
    mutationFn: (participantId) => api.post('/conversations', { participantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowNew(false);
    },
  });

  const deleteConvMutation = useMutation({
    mutationFn: (convId) => api.delete(`/conversations/${convId}`),
    onMutate: async (convId) => {
      await queryClient.cancelQueries({ queryKey: ['conversations', convSearch] });
      const prev = queryClient.getQueryData(['conversations', convSearch]);
      queryClient.setQueryData(['conversations', convSearch], (old) => {
        if (!old) return old;
        const conversations = old.conversations || old.data || [];
        return { ...old, conversations: conversations.filter(c => c._id !== convId) };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['conversations', convSearch], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const conversations = data?.conversations || data?.data || [];
  const friends = friendsData?.friends || friendsData?.data || [];

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Messages
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{conversations.length} conversations</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> New message
        </Button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        <label htmlFor="conversation-search" className="sr-only">Search conversations</label>
        <input
          id="conversation-search"
          style={{
            width: '100%',
            paddingLeft: 36,
            paddingRight: 14,
            paddingTop: 9,
            paddingBottom: 9,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            fontSize: '0.875rem',
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder="Search conversations..."
          value={convSearch}
          onChange={e => setConvSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(107,33,168,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <MessageCircle size={28} style={{ color: '#6b21a8' }} />
          </div>
          <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>No conversations yet</p>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Start a conversation with a friend.</p>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus size={14} /> New message
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {conversations.map(conv => {
            const other = conv.participants?.find(p =>
              (p._id ?? p._id?.toString()) !== (user?._id ?? user?._id?.toString())
            );
            const otherName = [other?.firstName, other?.lastName].filter(Boolean).join(' ') || other?.username || 'Unknown';
            const lastMsg = conv.lastMessage;
            const hasUnread = conv.unreadCount > 0;

            return (
              <div key={conv._id} className="group" style={{ position: 'relative' }}>
                <Link to={`/messages/${conv._id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: hasUnread ? '#F8F9FA' : '#fff',
                    border: `1px solid ${hasUnread ? '#E5E7EB' : '#E5E7EB'}`,
                    borderRadius: 16,
                    boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Link
                    to="/users/view"
                    state={{ id: other?._id }}
                    onClick={e => e.stopPropagation()}
                    style={{ flexShrink: 0 }}
                  >
                    <AppAvatar name={otherName} src={other?.avatarUrl} size="md" className="hover:opacity-80 transition-opacity" />
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
                        <Link
                          to="/users/view"
                          state={{ id: other?._id }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontWeight: hasUnread ? 700 : 600,
                            color: '#111827',
                            fontSize: 14,
                            margin: 0,
                            textDecoration: 'none',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
                          onMouseLeave={e => e.currentTarget.style.color = '#111827'}
                        >
                          {otherName}
                        </Link>
                        <VerifiedBadge roles={other?.roles} />
                      </span>
                      {lastMsg && (
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginLeft: 8 }}>
                          {formatRelative(lastMsg.sentAt || lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg ? (
                      <p style={{
                        fontSize: 12,
                        color: hasUnread ? '#6b21a8' : '#9CA3AF',
                        fontWeight: hasUnread ? 600 : 400,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        margin: 0,
                      }}>
                        {lastMsg.senderId === user?._id ? 'You: ' : ''}
                        {truncate(lastMsg.content, 60)}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>No messages yet</p>
                    )}
                  </div>

                  {hasUnread && (
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#6b21a8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{conv.unreadCount}</span>
                    </div>
                  )}
                </div>
              </Link>
                <button
                  aria-label="Delete conversation"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteConvMutation.mutate(conv._id); }}
                  className="opacity-0 group-hover:opacity-100"
                  style={{
                    position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 8, border: 'none',
                    background: '#fff', color: '#D1D5DB', cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* New conversation modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New message">
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              className="input-field pl-9"
              placeholder="Search friends..."
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {friends
              .filter(f => {
                const friend = f.user1 || f.friend;
                const name = (friend?.name || friend?.username || '').toLowerCase();
                return name.includes(friendSearch.toLowerCase());
              })
              .map(f => {
                const friend = f.user1?._id === user?._id ? f.user2 : f.user1 || f.friend;
                return (
                  <div
                    key={f._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => newConvMutation.mutate(friend?._id)}
                  >
                    <AppAvatar name={friend?.name || friend?.username} src={friend?.avatar} size="sm" />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13, color: '#111827', margin: 0 }}>{friend?.name}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>@{friend?.username}</p>
                    </div>
                  </div>
                );
              })}
            {friends.length === 0 && (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>
                No friends yet.{' '}
                <Link to="/friends" style={{ color: '#6b21a8' }} onClick={() => setShowNew(false)}>
                  Add friends first
                </Link>
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
