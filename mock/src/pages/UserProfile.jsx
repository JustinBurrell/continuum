import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Calendar, AtSign, MessageCircle, UserPlus,
  UserCheck, Clock, BookOpen, Layers, CheckSquare, Heart, UserMinus,
  FileText, Activity as ActivityIcon,
} from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate, formatRelative } from '@/lib/utils';

const fullName = (u) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

const NOTE_TYPE_VARIANTS = {
  general: 'neutral', lecture: 'primary', research: 'success',
  todo: 'warning', journal: 'danger',
};

const ACTIVITY_ICONS = {
  note_shared: BookOpen,
  flashcard_shared: Layers,
  task_created: CheckSquare,
  comment_added: MessageCircle,
  like_added: Heart,
};

const ACTIVITY_LABELS = {
  note_shared: 'shared a note',
  flashcard_shared: 'shared a flashcard set',
  task_created: 'created a task',
  comment_added: 'left a comment',
  like_added: 'liked something',
};

export default function UserProfile() {
  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isSelf = !!(id && currentUser?._id && id.toString() === currentUser._id.toString());

  // Redirect to Settings page if viewing own profile
  useEffect(() => {
    if (isSelf) navigate('/profile', { replace: true });
  }, [isSelf, navigate]);

  if (isSelf) return null;

  // Profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
    enabled: !!id,
  });

  // Friendship status — fetch all three states in parallel
  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends').then(r => r.data),
  });
  const { data: pendingData } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => api.get('/friends?status=pending').then(r => r.data),
  });
  const { data: sentData } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: () => api.get('/friends?status=sent').then(r => r.data),
  });

  const profile = profileData?.user;

  // Determine friendship status
  const friendships = friendsData?.friendships || friendsData?.data || [];
  const pendingRequests = pendingData?.friendships || pendingData?.data || [];
  const sentRequests = sentData?.friendships || sentData?.data || [];

  const isFriendEntry = friendships.find(f =>
    f.user1?._id === id || f.user2?._id === id ||
    f.user1?._id?.toString() === id || f.user2?._id?.toString() === id
  );
  const isFriend = !!isFriendEntry;

  const pendingEntry = pendingRequests.find(f =>
    f.user1?._id?.toString() === id || f.user2?._id?.toString() === id
  );
  const sentEntry = sentRequests.find(f =>
    f.user1?._id?.toString() === id || f.user2?._id?.toString() === id
  );

  // Shared notes (friend only)
  const { data: sharedNotesData } = useQuery({
    queryKey: ['shared-notes'],
    queryFn: () => api.get('/notes/shared').then(r => r.data),
    enabled: isFriend,
  });
  const allSharedNotes = sharedNotesData?.notes || [];
  const sharedNotes = allSharedNotes.filter(n => {
    const noteUserId = n.userId?._id?.toString() ?? n.userId?.toString();
    return noteUserId === id?.toString();
  });

  // Activity feed filtered to this user (friend only)
  const { data: activityData } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => api.get('/activity').then(r => r.data),
    enabled: isFriend,
  });
  const allActivity = activityData?.feed || [];
  const recentActivity = allActivity.filter(a => {
    const actorId = a.userId?._id?.toString() ?? a.userId?.toString();
    return actorId === id?.toString();
  }).slice(0, 8);

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: () => api.post('/friends/request', { recipientId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.delete('/friends/request/' + sentEntry?._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] }),
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.put(`/friends/request/${pendingEntry?._id}`, { action: 'accept' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => api.delete('/friends/' + isFriendEntry?._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });

  const startDMMutation = useMutation({
    mutationFn: () => api.post('/conversations', { participantId: id }),
    onSuccess: (res) => {
      const convId = res.data?.conversation?._id || res.data?.data?._id;
      navigate('/messages', { state: { conversationId: convId } });
    },
  });

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-2">
        <Skeleton className="h-4 w-20" />
        <Card className="p-6">
          <div className="flex items-start gap-5">
            <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1 pt-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-16 w-full mt-5" />
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary mb-2">User not found.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const name = fullName(profile);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <Card className="p-6 mb-4">
        <div className="flex items-start gap-5">
          <Avatar name={name} src={profile.avatarUrl} size="lg" className="flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">{name}</h1>
                <p className="text-sm text-secondary flex items-center gap-1 mt-0.5">
                  <AtSign size={12} />{profile.username}
                </p>
                {profile.createdAt && (
                  <p className="text-xs text-secondary/70 flex items-center gap-1 mt-1">
                    <Calendar size={11} /> Joined {formatDate(profile.createdAt)}
                  </p>
                )}
              </div>

              {/* Friendship badge */}
              {isFriend && (
                <Badge variant="success" className="text-xs px-2.5 py-1 flex items-center gap-1">
                  <UserCheck size={11} /> Friends
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {isFriend ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => startDMMutation.mutate()}
                    loading={startDMMutation.isPending}
                  >
                    <MessageCircle size={13} /> Message
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Remove ${name} as a friend?`)) removeMutation.mutate();
                    }}
                    loading={removeMutation.isPending}
                  >
                    <UserMinus size={13} /> Remove
                  </Button>
                </>
              ) : pendingEntry ? (
                // They sent me a request
                <Button size="sm" onClick={() => acceptMutation.mutate()} loading={acceptMutation.isPending}>
                  <UserPlus size={13} /> Accept request
                </Button>
              ) : sentEntry ? (
                // I sent them a request
                <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}>
                  <Clock size={13} /> Request sent · Revoke
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => sendRequestMutation.mutate()} loading={sendRequestMutation.isPending}>
                  <UserPlus size={13} /> Add friend
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground/80 leading-relaxed mt-5 pt-5 border-t border-border">
            {profile.bio}
          </p>
        )}
      </Card>

      {/* ── Friend-only content ────────────────────────────────────────────── */}
      {isFriend && (
        <>
          {/* Shared notes */}
          <section className="mb-5">
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <FileText size={13} className="text-secondary" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Shared Notes
              </h2>
            </div>

            {sharedNotes.length === 0 ? (
              <Card className="py-8 text-center">
                <p className="text-sm text-secondary">{name} hasn't shared any notes with you yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sharedNotes.map(note => (
                  <Link
                    key={note._id}
                    to="/notes/view"
                    state={{ id: note._id }}
                    className="no-underline"
                  >
                    <Card className="p-4 hover:border-primary/30 transition-colors cursor-pointer h-full">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2 flex-1">
                          {note.title || 'Untitled'}
                        </p>
                        {note.type && (
                          <Badge variant={NOTE_TYPE_VARIANTS[note.type] || 'neutral'} className="text-xs capitalize flex-shrink-0">
                            {note.type}
                          </Badge>
                        )}
                      </div>
                      {note.createdAt && (
                        <p className="text-xs text-secondary/70">{formatDate(note.createdAt)}</p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section>
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <ActivityIcon size={13} className="text-secondary" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
                Recent Activity
              </h2>
            </div>

            {recentActivity.length === 0 ? (
              <Card className="py-8 text-center">
                <p className="text-sm text-secondary">No recent activity to show.</p>
              </Card>
            ) : (
              <Card className="divide-y divide-border">
                {recentActivity.map(item => {
                  const Icon = ACTIVITY_ICONS[item.type] || ActivityIcon;
                  const label = ACTIVITY_LABELS[item.type] || item.type;
                  return (
                    <div key={item._id} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={13} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{name}</span> {label}
                          {item.metadata?.noteTitle && (
                            <span className="text-secondary"> · {item.metadata.noteTitle}</span>
                          )}
                        </p>
                        {item.createdAt && (
                          <p className="text-xs text-secondary/70 mt-0.5">
                            {formatRelative ? formatRelative(item.createdAt) : formatDate(item.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
