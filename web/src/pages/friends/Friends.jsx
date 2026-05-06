import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserPlus, Search, Users, Check, X, UserMinus, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';
import Button from '@/components/ui/Button';
import AppAvatar from '@/components/ui/AppAvatar';
import Skeleton from '@/components/ui/Skeleton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FriendsSkeleton from '@/components/skeletons/FriendsSkeleton';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { useToast } from '@/components/ui/Toast';

export default function Friends() {
  const [tab, setTab] = useState('friends');
  const [searchQ, setSearchQ] = useState('');
  const [friendsSearch, setFriendsSearch] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(null); // { id, name }
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends', friendsSearch],
    queryFn: () => api.get('/friends', { params: friendsSearch ? { search: friendsSearch } : {} }).then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => api.get('/friends?status=pending').then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: () => api.get('/friends?status=sent').then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: searchData } = useQuery({
    queryKey: ['user-search', searchQ],
    queryFn: () => api.get('/users/search', { params: { q: searchQ } }).then(r => r.data),
    enabled: searchQ.length >= 2,
    placeholderData: (prev) => prev,
  });

  const invalidateFriends = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
  };

  const sendRequestMutation = useMutation({
    mutationFn: (recipientId) => api.post('/friends/request', { recipientId }),
    onSuccess: () => {
      posthog.capture('friend_request_sent', { platform: 'web' });
      invalidateFriends();
    },
    onError: (err) => toast({ message: err?.response?.data?.error || 'Could not send friend request.', type: 'error' }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.put(`/friends/request/${id}`, { action: 'accept' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['friend-requests'] });
      const prev = queryClient.getQueryData(['friend-requests']);
      queryClient.setQueryData(['friend-requests'], (old) => old
        ? { ...old, friends: (old.friends || []).filter(f => f._id !== id) }
        : old
      );
      return { prev };
    },
    onSuccess: () => {
      if (!user?.onboardingChecklist?.friendConnected) {
        api.patch('/auth/me/onboarding/checklist', { friendConnected: true })
          .then(r => updateUser({ onboardingChecklist: r.data.user?.onboardingChecklist }))
          .catch(() => {});
      }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['friend-requests'], ctx.prev);
      toast({ message: err?.response?.data?.error || 'Could not accept request.', type: 'error' });
    },
    onSettled: invalidateFriends,
  });

  const declineMutation = useMutation({
    mutationFn: (id) => api.put(`/friends/request/${id}`, { action: 'reject' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['friend-requests'] });
      const prev = queryClient.getQueryData(['friend-requests']);
      queryClient.setQueryData(['friend-requests'], (old) => old
        ? { ...old, friends: (old.friends || []).filter(f => f._id !== id) }
        : old
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['friend-requests'], ctx.prev);
      toast({ message: err?.response?.data?.error || 'Could not decline request.', type: 'error' });
    },
    onSettled: invalidateFriends,
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.delete(`/friends/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['friends', friendsSearch] });
      const prev = queryClient.getQueryData(['friends', friendsSearch]);
      queryClient.setQueryData(['friends', friendsSearch], (old) => old
        ? { ...old, friends: (old.friends || []).filter(f => f._id !== id) }
        : old
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['friends', friendsSearch], ctx.prev);
      toast({ message: err?.response?.data?.error || 'Could not remove friend.', type: 'error' });
    },
    onSettled: invalidateFriends,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete('/friends/request/' + id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['friend-requests-sent'] });
      const prev = queryClient.getQueryData(['friend-requests-sent']);
      queryClient.setQueryData(['friend-requests-sent'], (old) => old
        ? { ...old, friends: (old.friends || []).filter(f => f._id !== id) }
        : old
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['friend-requests-sent'], ctx.prev);
      toast({ message: err?.response?.data?.error || 'Could not cancel request.', type: 'error' });
    },
    onSettled: invalidateFriends,
  });

  const startDMMutation = useMutation({
    mutationFn: (friendId) => api.post('/conversations', { participantId: friendId }),
    onSuccess: (res) => {
      const convId = res.data?.conversation?._id || res.data?.data?._id;
      navigate('/messages', { state: { conversationId: convId ?? null } });
    },
  });

  const friendships = friendsData?.friends || [];
  const requests = requestsData?.friends || [];
  const sentRequests = sentData?.friends || [];
  const searchResults = searchData?.users || searchData?.data || [];

  // Backend populates user1 and user2 with { username, firstName, lastName }
  // No requester/recipient fields -- determine other user by comparing _id to current user
  const getOtherUser = (f) => {
    return f.user1?._id?.toString() === user?._id?.toString() ? f.user2 : f.user1;
  };

  const fullName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

  const tabs = [
    { key: 'friends', label: 'Friends', count: friendships.length },
    { key: 'requests', label: 'Requests', count: requests.length },
    { key: 'sent', label: 'Sent', count: sentRequests.length },
    { key: 'find', label: 'Find people', count: null },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Friends
        </h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Manage your connections</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active ? '#6b21a8' : 'transparent',
                color: active ? '#fff' : '#6b7280',
              }}
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: active ? 'rgba(255,255,255,0.25)' : 'rgba(107,33,168,0.15)',
                  color: active ? '#fff' : '#6b21a8',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
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
              placeholder="Search friends..."
              value={friendsSearch}
              onChange={e => setFriendsSearch(e.target.value)}
            />
          </div>
          {friendsLoading ? (
            <FriendsSkeleton />
          ) : friendships.length === 0 ? (
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
                <Users size={28} style={{ color: '#6b21a8' }} />
              </div>
              <h3 style={{ fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>No friends yet</h3>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Find people to connect with.</p>
              <Button size="sm" onClick={() => setTab('find')}>Find people</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {friendships
                .map(f => {
                const friendUser = getOtherUser(f);
                if (!friendUser) return null;
                return (
                  <div
                    key={f._id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: 16,
                      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <Link to="/users/view" state={{ id: friendUser._id }} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <AppAvatar name={fullName(friendUser)} src={friendUser.avatarUrl} size="md" />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700, color: '#111827', fontSize: 14 }}>
                          {fullName(friendUser)}<VerifiedBadge roles={friendUser.roles} />
                        </span>
                        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>@{friendUser.username}</p>
                      </div>
                    </Link>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startDMMutation.mutate(friendUser._id)}
                        loading={startDMMutation.isPending}
                      >
                        <MessageCircle size={13} /> Message
                      </Button>
                      <button
                        onClick={() => setRemoveConfirm({ id: f._id, name: [f.firstName, f.lastName].filter(Boolean).join(' ') || f.username })}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #E5E7EB',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 14 }}>
              No pending friend requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map(req => {
                const requester = getOtherUser(req);
                return (
                  <div
                    key={req._id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: 16,
                      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <Link to="/users/view" state={{ id: requester?._id }} style={{ flexShrink: 0 }}>
                      <AppAvatar name={fullName(requester)} src={requester?.avatarUrl} className="hover:opacity-80 transition-opacity" />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to="/users/view" state={{ id: requester?._id }} style={{ textDecoration: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700, color: '#111827', fontSize: 14 }}>
                          {fullName(requester)}<VerifiedBadge roles={requester?.roles} />
                        </span>
                      </Link>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>@{requester?.username} wants to connect</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
                  </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : sentRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 14 }}>
              No pending outgoing requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sentRequests.map(req => {
                const recipient = getOtherUser(req);
                return (
                  <div
                    key={req._id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: 16,
                      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <Link to="/users/view" state={{ id: recipient?._id }} style={{ flexShrink: 0 }}>
                      <AppAvatar name={fullName(recipient)} src={recipient?.avatarUrl} className="hover:opacity-80 transition-opacity" />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to="/users/view" state={{ id: recipient?._id }} style={{ textDecoration: 'none' }}>
                        <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>{fullName(recipient)}</p>
                      </Link>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>@{recipient?.username} · Request pending</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelMutation.mutate(req._id)}
                      loading={cancelMutation.isPending}
                    >
                      <X size={13} /> Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Find people */}
      {tab === 'find' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              className="input-field"
              style={{ paddingLeft: 36 }}
              placeholder="Search users by name or username..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>

          {searchQ.length >= 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>No users found.</p>
              ) : (
                searchResults.map(u => (
                  <div
                    key={u._id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: 14,
                      boxShadow: '0 1px 6px rgba(107,33,168,0.05)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Link to="/users/view" state={{ id: u._id }} style={{ flexShrink: 0 }}>
                      <AppAvatar name={fullName(u)} src={u.avatarUrl} size="sm" className="hover:opacity-80 transition-opacity" />
                    </Link>
                    <div style={{ flex: 1 }}>
                      <Link to="/users/view" state={{ id: u._id }} style={{ textDecoration: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600, fontSize: 13, color: '#111827' }}>
                          {fullName(u)}<VerifiedBadge roles={u.roles} />
                        </span>
                      </Link>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>@{u.username}</p>
                    </div>
                    {!user?.isDemo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendRequestMutation.mutate(u._id)}
                        loading={sendRequestMutation.isPending}
                      >
                        <UserPlus size={12} /> Add
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {sendRequestMutation.isSuccess && (
            <p style={{ fontSize: 12, color: '#059669' }}>Friend request sent!</p>
          )}
          {sendRequestMutation.isError && (
            <p style={{ fontSize: 12, color: '#dc2626' }}>
              {sendRequestMutation.error?.response?.data?.error || 'Failed to send request'}
            </p>
          )}
        </div>
      )}
      <ConfirmModal
        open={!!removeConfirm}
        title="Remove friend"
        message={`Are you sure you want to remove ${removeConfirm?.name} as a friend?`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
        onConfirm={() => { removeMutation.mutate(removeConfirm.id); setRemoveConfirm(null); }}
        onClose={() => setRemoveConfirm(null)}
      />
    </div>
  );
}
