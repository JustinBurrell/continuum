import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/ui/Avatar';
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
  const [showNew, setShowNew] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);

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

  return (
    <div className="flex h-[calc(100vh-0px)] -mt-8 -mx-8">
      {/* Left panel — conversation list */}
      <div
        className="flex flex-col flex-shrink-0 border-r"
        style={{ width: 280, background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>Messages</h2>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 28, height: 28 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-16 px-6 text-center">
              <MessageCircle size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No conversations yet</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-3 text-sm font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Start one
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.participants?.find(p => p._id !== user?._id);
              const lastMsg = conv.lastMessage;
              const isLastMine = lastMsg?.senderId === user?._id;
              const isActive = activeConversationId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversationId(conv._id)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer border-b ${
                    isActive ? 'bg-primary-bg' : 'hover:bg-[var(--bg-hover)]'
                  }`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Avatar name={getName(other)} src={other?.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {getName(other)}
                      </p>
                      {lastMsg?.sentAt && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, marginLeft: 8 }}>
                          {formatRelative(lastMsg.sentAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg ? (
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {isLastMine ? 'You: ' : ''}
                        {truncate(lastMsg.content, 50)}
                      </p>
                    ) : (
                      <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No messages yet</p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)' }}
                    >
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>{conv.unreadCount}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — conversation thread or empty */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
        {activeConversationId ? (
          <Conversation conversationId={activeConversationId} />
        ) : (
          <MessagesEmpty />
        )}
      </div>

      {/* New message modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setFriendSearch(''); }} title="New message">
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              className="input-field pl-9"
              placeholder="Search friends..."
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredFriends.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                {friendships.length === 0 ? 'Add friends first to message them.' : 'No friends found.'}
              </p>
            ) : (
              filteredFriends.map(f => {
                const friend = f.user1?._id === user?._id ? f.user2 : f.user1;
                return (
                  <button
                    key={f._id}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left"
                    onClick={() => newConvMutation.mutate(friend?._id)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar name={getName(friend)} src={friend?.avatarUrl} size="sm" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{getName(friend)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>@{friend?.username}</p>
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
    <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-tertiary)' }}>
      <MessageCircle size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Select a conversation</p>
      <p className="text-xs mt-1">or start a new one</p>
    </div>
  );
}
