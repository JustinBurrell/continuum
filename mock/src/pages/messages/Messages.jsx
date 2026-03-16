import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageCircle, Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative, truncate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then(r => r.data),
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

  const conversations = data?.conversations || data?.data || [];
  const friends = friendsData?.friends || friendsData?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="text-secondary text-sm mt-0.5">{conversations.length} conversations</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> New message
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle size={40} className="mx-auto mb-3 text-secondary/40" />
          <h3 className="font-semibold text-foreground mb-1">No conversations yet</h3>
          <p className="text-secondary text-sm mb-4">Start a conversation with a friend.</p>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus size={14} /> New message
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const other = conv.participants?.find(p =>
              (p._id ?? p._id?.toString()) !== (user?._id ?? user?._id?.toString())
            );
            const otherName = [other?.firstName, other?.lastName].filter(Boolean).join(' ') || other?.username || 'Unknown';
            const lastMsg = conv.lastMessage;
            return (
              <Link key={conv._id} to={`/messages/${conv._id}`}>
                <Card className="flex items-center gap-4 p-4 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <Link
                    to="/users/view"
                    state={{ id: other?._id }}
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0"
                  >
                    <Avatar name={otherName} src={other?.avatarUrl} size="md" className="hover:opacity-80 transition-opacity" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-foreground text-sm">{otherName}</p>
                      {lastMsg && (
                        <span className="text-xs text-secondary">
                          {formatRelative(lastMsg.sentAt || lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg ? (
                      <p className="text-xs text-secondary truncate">
                        {lastMsg.senderId === user?._id ? 'You: ' : ''}
                        {truncate(lastMsg.content, 60)}
                      </p>
                    ) : (
                      <p className="text-xs text-secondary italic">No messages yet</p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-medium">{conv.unreadCount}</span>
                    </div>
                  )}
                </Card>
              </Link>
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
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => newConvMutation.mutate(friend?._id)}
                  >
                    <Avatar name={friend?.name || friend?.username} src={friend?.avatar} size="sm" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{friend?.name}</p>
                      <p className="text-xs text-secondary">@{friend?.username}</p>
                    </div>
                  </div>
                );
              })}
            {friends.length === 0 && (
              <p className="text-sm text-secondary text-center py-4">
                No friends yet.{' '}
                <Link to="/friends" className="text-primary hover:underline" onClick={() => setShowNew(false)}>
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
