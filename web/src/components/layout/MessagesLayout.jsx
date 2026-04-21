import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import AppAvatar from '@/components/ui/AppAvatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative, truncate } from '@/lib/utils';
import Conversation from '@/pages/messages/Conversation';

function getName(p) {
  return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.username || 'Unknown';
}

export default function MessagesLayout() {
  const { user } = useAuth();
  const { state } = useLocation();
  const [showNew, setShowNew] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [search, setSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(state?.conversationId ?? null);

  useEffect(() => {
    if (state?.conversationId) window.history.replaceState({}, '');
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then(r => r.data),
    refetchInterval: 8000,
  });

  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends').then(r => r.data),
    enabled: showNew,
  });

  const newConvMutation = useMutation({
    mutationFn: (participantId) => api.post('/conversations', { participantId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowNew(false);
      const convId = res.data?.conversation?._id || res.data?._id;
      if (convId) setActiveConversationId(convId);
    },
  });

  const conversations = data?.conversations || [];
  const friendships = friendsData?.friendships || [];

  const filteredFriends = friendships.filter(f => {
    const friend = f.user1?._id === user?._id ? f.user2 : f.user1;
    return getName(friend).toLowerCase().includes(friendSearch.toLowerCase());
  });

  const filteredConversations = conversations.filter(conv => {
    if (!search.trim()) return true;
    const other = conv.participants?.find(p => p._id !== user?._id);
    return getName(other).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh)', marginTop: -32, marginLeft: -32, marginRight: -32 }}>
      {/* Left panel */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #E5E7EB' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Messages</h2>
          <button
            onClick={() => setShowNew(true)}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={16} style={{ color: '#6b21a8' }} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 20, border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: 12, color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#6b21a8'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px 64px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <MessageCircle size={22} style={{ color: '#6b21a8' }} />
              </div>
              <p style={{ fontSize: 13, color: '#111827', fontWeight: 600, margin: '0 0 4px' }}>No conversations yet</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>Start a conversation with a friend</p>
              <button
                onClick={() => setShowNew(true)}
                style={{ fontSize: 13, fontWeight: 600, color: '#6b21a8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Start one
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = conv.participants?.find(p => p._id !== user?._id);
              const lastMsg = conv.lastMessage;
              const isLastMine = lastMsg?.senderId === user?._id;
              const isActive = activeConversationId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: 72,
                    padding: '0 16px',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(107,33,168,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid #6b21a8' : '3px solid transparent',
                    borderBottom: '1px solid #E5E7EB',
                    transition: 'background 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8F9FA'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <AppAvatar name={getName(other)} src={other?.avatarUrl} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getName(other)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        {lastMsg?.sentAt && (
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{formatRelative(lastMsg.sentAt)}</span>
                        )}
                        {conv.unreadCount > 0 && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b21a8', flexShrink: 0 }} />
                        )}
                      </div>
                    </div>
                    {lastMsg ? (
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isLastMine ? 'You: ' : ''}{truncate(lastMsg.content, 50)}
                      </p>
                    ) : (
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, fontStyle: 'italic' }}>No messages yet</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#F8F9FA' }}>
        {activeConversationId ? (
          <Conversation conversationId={activeConversationId} />
        ) : (
          <MessagesEmpty />
        )}
      </div>

      {/* New message modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setFriendSearch(''); }} title="New message">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              placeholder="Search friends..."
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#6b21a8'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          <div style={{ maxHeight: 256, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredFriends.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>
                {friendships.length === 0 ? 'Add friends first to message them.' : 'No friends found.'}
              </p>
            ) : (
              filteredFriends.map(f => {
                const friend = f.user1?._id === user?._id ? f.user2 : f.user1;
                return (
                  <button
                    key={f._id}
                    onClick={() => newConvMutation.mutate(friend?._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <AppAvatar name={getName(friend)} src={friend?.avatarUrl} size="sm" />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3 }}>{getName(friend)}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>@{friend?.username}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function MessagesEmpty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <MessageCircle size={28} style={{ color: '#6b21a8' }} />
      </div>
      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#6b21a8', margin: '0 0 6px' }}>Select a conversation</p>
      <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>or start a new one</p>
    </div>
  );
}
