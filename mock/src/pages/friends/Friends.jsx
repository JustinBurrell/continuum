import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserPlus, Search, Users, Check, X, UserMinus, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';

export default function Friends() {
  const [tab, setTab] = useState('friends');
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends').then(r => r.data),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => api.get('/friends?status=pending').then(r => r.data),
  });

  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: () => api.get('/friends?status=sent').then(r => r.data),
  });

  const { data: searchData } = useQuery({
    queryKey: ['user-search', searchQ],
    queryFn: () => api.get('/users/search', { params: { q: searchQ } }).then(r => r.data),
    enabled: searchQ.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (recipientId) => api.post('/friends/request', { recipientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.put(`/friends/request/${id}`, { action: 'accept' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id) => api.put(`/friends/request/${id}`, { action: 'reject' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.delete(`/friends/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete('/friends/request/' + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] }),
  });

  const startDMMutation = useMutation({
    mutationFn: (friendId) => api.post('/conversations', { participantId: friendId }),
    onSuccess: (res) => {
      const convId = res.data?.conversation?._id || res.data?.data?._id;
      if (convId) navigate(`/messages/${convId}`);
      else navigate('/messages');
    },
  });

  const friendships = friendsData?.friendships || friendsData?.data || [];
  const requests = requestsData?.friendships || requestsData?.data || [];
  const sentRequests = sentData?.friendships || sentData?.data || [];
  const searchResults = searchData?.users || searchData?.data || [];

  // Backend populates user1 and user2 with { username, firstName, lastName }
  // No requester/recipient fields — determine other user by comparing _id to current user
  const getOtherUser = (f) => {
    return f.user1?._id?.toString() === user?._id?.toString() ? f.user2 : f.user1;
  };

  const fullName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

  const tabs = [
    { key: 'friends', label: `Friends (${friendships.length})` },
    { key: 'requests', label: `Requests (${requests.length})` },
    { key: 'sent', label: sentRequests.length > 0 ? `Sent (${sentRequests.length})` : 'Sent' },
    { key: 'find', label: 'Find people' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Friends</h1>
          <p className="text-secondary text-sm mt-0.5">Manage your connections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-white'
                : 'bg-accent text-foreground/70 hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div>
          {friendsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : friendships.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="mx-auto mb-3 text-secondary/40" />
              <h3 className="font-semibold text-foreground mb-1">No friends yet</h3>
              <p className="text-secondary text-sm mb-4">Find people to connect with.</p>
              <Button size="sm" onClick={() => setTab('find')}>Find people</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {friendships.map(f => {
                const friendUser = getOtherUser(f);
                if (!friendUser) return null;
                return (
                  <Card key={f._id} className="flex items-center gap-4 p-4">
                    <Link to="/users/view" state={{ id: friendUser._id }} className="no-underline flex items-center gap-4 flex-1 min-w-0">
                      <Avatar name={fullName(friendUser)} src={friendUser.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm hover:text-primary transition-colors">{fullName(friendUser)}</p>
                        <p className="text-xs text-secondary">@{friendUser.username}</p>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startDMMutation.mutate(friendUser._id)}
                        loading={startDMMutation.isPending}
                      >
                        <MessageCircle size={13} /> Message
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Remove friend?')) removeMutation.mutate(f._id);
                        }}
                      >
                        <UserMinus size={13} />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div>
          {requestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-secondary text-sm">
              No pending friend requests.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                // Backend populates user1/user2; the requester is the other user
                const requester = getOtherUser(req);
                return (
                  <Card key={req._id} className="flex items-center gap-4 p-4">
                    <Avatar name={fullName(requester)} src={requester?.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{fullName(requester)}</p>
                      <p className="text-xs text-secondary">@{requester?.username} wants to connect</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(req._id)}
                        loading={acceptMutation.isPending}
                      >
                        <Check size={13} /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineMutation.mutate(req._id)}
                      >
                        <X size={13} /> Decline
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sent requests */}
      {tab === 'sent' && (
        <div>
          {sentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="text-center py-12 text-secondary text-sm">
              No pending outgoing requests.
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map(req => {
                const recipient = getOtherUser(req);
                return (
                  <Card key={req._id} className="flex items-center gap-4 p-4">
                    <Avatar name={fullName(recipient)} src={recipient?.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{fullName(recipient)}</p>
                      <p className="text-xs text-secondary">@{recipient?.username} · Request pending</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelMutation.mutate(req._id)}
                      loading={cancelMutation.isPending}
                    >
                      <X size={13} /> Revoke
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Find people */}
      {tab === 'find' && (
        <div className="space-y-5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              className="input-field pl-9"
              placeholder="Search users by name or username..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>

          {searchQ.length >= 2 && (
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-secondary text-center py-4">No users found.</p>
              ) : (
                searchResults.map(u => (
                  <Card key={u._id} className="flex items-center gap-3 p-3">
                    <Avatar name={fullName(u)} src={u.avatarUrl} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{fullName(u)}</p>
                      <p className="text-xs text-secondary">@{u.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendRequestMutation.mutate(u._id)}
                      loading={sendRequestMutation.isPending}
                    >
                      <UserPlus size={12} /> Add
                    </Button>
                  </Card>
                ))
              )}
            </div>
          )}

          {sendRequestMutation.isSuccess && (
            <p className="text-xs text-green-600">Friend request sent!</p>
          )}
          {sendRequestMutation.isError && (
            <p className="text-xs text-red-500">
              {sendRequestMutation.error?.response?.data?.error || 'Failed to send request'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
