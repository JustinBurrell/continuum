import { useEffect, useState } from 'react';
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
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import SocialLinks from '@/components/ui/SocialLinks';
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

const ACTIVITY_COLORS = {
  note_shared: '#6b21a8',
  flashcard_shared: '#7c3aed',
  task_created: '#2563eb',
  comment_added: '#16a34a',
  like_added: '#dc2626',
};

export default function UserProfile() {
  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isSelf = !!(id && currentUser?._id && id.toString() === currentUser._id.toString());
  const [removeConfirm, setRemoveConfirm] = useState(false);

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
    staleTime: 120_000,
  });

  // Friendship status -- fetch all three states in parallel
  // queryKey ['friends', ''] matches the Sidebar prefetch so this is a cache hit on normal navigation
  const { data: friendsData } = useQuery({
    queryKey: ['friends', ''],
    queryFn: () => api.get('/friends').then(r => r.data),
    staleTime: 120_000,
    enabled: !!id,
  });
  const { data: pendingData } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => api.get('/friends?status=pending').then(r => r.data),
    staleTime: 60_000,
    enabled: !!id,
  });
  const { data: sentData } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: () => api.get('/friends?status=sent').then(r => r.data),
    staleTime: 60_000,
    enabled: !!id,
  });

  const profile = profileData?.user;

  const friendships = friendsData?.friends || [];
  const pendingRequests = pendingData?.friends || [];
  const sentRequests = sentData?.friends || [];

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

  // Study streak (public)
  const { data: streakData } = useQuery({
    queryKey: ['user-streak', id],
    queryFn: () => api.get(`/users/${id}/streak`).then(r => r.data),
    enabled: !!id,
    staleTime: 300_000,
  });
  const streak = streakData?.streak ?? 0;

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

  // Shared tasks (friend only)
  const { data: sharedTasksData } = useQuery({
    queryKey: ['shared-tasks'],
    queryFn: () => api.get('/tasks/shared').then(r => r.data),
    enabled: isFriend,
  });
  const allSharedTasks = sharedTasksData?.tasks || [];
  const sharedTasks = allSharedTasks.filter(t => t.userId?.toString() === id?.toString());

  // Shared flashcard sets (friend only)
  const { data: sharedSetsData } = useQuery({
    queryKey: ['shared-flashcard-sets'],
    queryFn: () => api.get('/flashcard-sets/shared').then(r => r.data),
    enabled: isFriend,
  });
  const allSharedSets = sharedSetsData?.sets || [];
  const sharedSets = allSharedSets.filter(s => {
    const setUserId = s.userId?._id?.toString() ?? s.userId?.toString();
    return setUserId === id?.toString();
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
  const invalidateFriends = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
  };

  const sendRequestMutation = useMutation({
    mutationFn: () => api.post('/friends/request', { recipientId: id }),
    onSuccess: invalidateFriends,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.delete('/friends/request/' + sentEntry?._id),
    onSuccess: invalidateFriends,
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.put(`/friends/request/${pendingEntry?._id}`, { action: 'accept' }),
    onSuccess: invalidateFriends,
  });

  const removeMutation = useMutation({
    mutationFn: () => api.delete('/friends/' + isFriendEntry?._id),
    onSuccess: invalidateFriends,
  });

  const startDMMutation = useMutation({
    mutationFn: () => api.post('/conversations', { participantId: id }),
    onSuccess: (res) => {
      const convId = res.data?.conversation?._id || res.data?.data?._id;
      navigate('/messages', { state: { conversationId: convId } });
    },
  });

  // Loading state
  if (profileLoading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 8 }}>
        <Skeleton className="h-4 w-20 mb-4" />
        <div style={{
          background: '#fff',
          border: '1px solid #ede9fe',
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
          padding: '24px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-16 w-full mt-5" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: '#a087b0', marginBottom: 8 }}>User not found.</p>
        <button onClick={() => navigate(-1)} style={{ color: '#6b21a8', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Go back
        </button>
      </div>
    );
  }

  const name = fullName(profile);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: '#a087b0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: 20,
          transition: 'color 0.12s',
          padding: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
        onMouseLeave={e => e.currentTarget.style.color = '#a087b0'}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Profile header */}
      <div style={{
        background: '#fff',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '24px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <Avatar name={name} src={profile.avatarUrl} size="lg" style={{ flexShrink: 0, marginTop: 2 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                    {name}
                  </h1>
                  <VerifiedBadge roles={profile.roles} expanded />
                </span>
                <p style={{ fontSize: 13, color: '#a087b0', display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0 0' }}>
                  <AtSign size={12} />{profile.username}
                </p>
                {profile.createdAt && (
                  <p style={{ fontSize: 11, color: '#c4b5d4', display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0 0' }}>
                    <Calendar size={11} /> Joined {formatDate(profile.createdAt)}
                  </p>
                )}
              </div>

              {isFriend && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                }}>
                  <UserCheck size={12} /> Friends
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {isFriend ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => startDMMutation.mutate()}
                    loading={startDMMutation.isPending}
                  >
                    <MessageCircle size={13} /> Message
                  </Button>
                  <button
                    onClick={() => setRemoveConfirm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #ede9fe',
                      background: 'transparent',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#a087b0',
                      cursor: 'pointer',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#a087b0'; e.currentTarget.style.borderColor = '#ede9fe'; }}
                  >
                    <UserMinus size={13} /> Remove
                  </button>
                </>
              ) : pendingEntry ? (
                <Button size="sm" onClick={() => acceptMutation.mutate()} loading={acceptMutation.isPending}>
                  <UserPlus size={13} /> Accept request
                </Button>
              ) : sentEntry ? (
                <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}>
                  <Clock size={13} /> Request sent - Revoke
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
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginTop: 20, paddingTop: 20, borderTop: '1px solid #ede9fe' }}>
            {profile.bio}
          </p>
        )}
        <SocialLinks user={profile} style={{ marginTop: 12 }} />

        {/* Streak widget */}
        {streak >= 1 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: streak >= 7 ? '#fef9c3' : '#f5f0ff',
            border: `1px solid ${streak >= 7 ? '#fde047' : '#ede9fe'}`,
            borderRadius: 24,
            padding: '7px 16px',
            marginTop: 14,
          }}>
            <span style={{ fontSize: '1rem' }}>{streak >= 7 ? '🔥' : '⚡'}</span>
            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#111827' }}>
              {streak} day study streak
            </span>
          </div>
        )}
      </div>

      {/* Friend-only content */}
      {isFriend && (
        <>
          {/* Shared notes */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 2 }}>
              <FileText size={13} style={{ color: '#a087b0' }} />
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', margin: 0 }}>
                Shared Notes
              </h2>
            </div>

            {sharedNotes.length === 0 ? (
              <div style={{
                background: '#fff',
                border: '1px solid #ede9fe',
                borderRadius: 16,
                padding: '32px 0',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, color: '#a087b0', margin: 0 }}>{name} hasn't shared any notes with you yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {sharedNotes.map(note => (
                  <Link
                    key={note._id}
                    to="/notes/view"
                    state={{ id: note._id }}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: '#fff',
                      border: '1px solid #ede9fe',
                      borderRadius: 16,
                      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      height: '100%',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(107,33,168,0.3)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,33,168,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9fe'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.4, margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {note.title || 'Untitled'}
                        </p>
                        {note.type && (
                          <Badge variant={NOTE_TYPE_VARIANTS[note.type] || 'neutral'} className="text-xs capitalize" style={{ flexShrink: 0 }}>
                            {note.type}
                          </Badge>
                        )}
                      </div>
                      {note.createdAt && (
                        <p style={{ fontSize: 11, color: '#c4b5d4', margin: 0 }}>{formatDate(note.createdAt)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Shared tasks */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 2 }}>
              <CheckSquare size={13} style={{ color: '#a087b0' }} />
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', margin: 0 }}>
                Shared Tasks
              </h2>
            </div>

            {sharedTasks.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: '32px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#a087b0', margin: 0 }}>{name} hasn't shared any tasks with you yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {sharedTasks.map(task => (
                  <Link key={task._id} to="/tasks" state={{ openTaskId: task._id }} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: '#fff', border: '1px solid #ede9fe', borderRadius: 16,
                        boxShadow: '0 1px 8px rgba(107,33,168,0.06)', padding: '16px 18px',
                        cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', height: '100%',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(107,33,168,0.3)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,33,168,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9fe'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.4, margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.title || 'Untitled'}
                        </p>
                        {task.status && (
                          <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'primary' : 'neutral'} className="text-xs capitalize" style={{ flexShrink: 0 }}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      {task.dueDate && (
                        <p style={{ fontSize: 11, color: '#c4b5d4', margin: 0 }}>Due {formatDate(task.dueDate)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Shared flashcard sets */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 2 }}>
              <Layers size={13} style={{ color: '#a087b0' }} />
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', margin: 0 }}>
                Shared Flashcard Sets
              </h2>
            </div>

            {sharedSets.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: '32px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#a087b0', margin: 0 }}>{name} hasn't shared any flashcard sets with you yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {sharedSets.map(set => (
                  <Link key={set._id} to="/flashcards/view" state={{ id: set._id }} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: '#fff', border: '1px solid #ede9fe', borderRadius: 16,
                        boxShadow: '0 1px 8px rgba(107,33,168,0.06)', padding: '16px 18px',
                        cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', height: '100%',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(107,33,168,0.3)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,33,168,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9fe'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)'; }}
                    >
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.4, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {set.title || 'Untitled'}
                      </p>
                      <p style={{ fontSize: 11, color: '#c4b5d4', margin: 0 }}>
                        {set.totalCards ?? set.cardCount ?? 0} cards
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 2 }}>
              <ActivityIcon size={13} style={{ color: '#a087b0' }} />
              <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', margin: 0 }}>
                Recent Activity
              </h2>
            </div>

            {recentActivity.length === 0 ? (
              <div style={{
                background: '#fff',
                border: '1px solid #ede9fe',
                borderRadius: 16,
                padding: '32px 0',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, color: '#a087b0', margin: 0 }}>No recent activity to show.</p>
              </div>
            ) : (
              <div style={{
                background: '#fff',
                border: '1px solid #ede9fe',
                borderRadius: 16,
                boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                overflow: 'hidden',
              }}>
                {recentActivity.map((item, idx) => {
                  const Icon = ACTIVITY_ICONS[item.type] || ActivityIcon;
                  const label = ACTIVITY_LABELS[item.type] || item.type;
                  const color = ACTIVITY_COLORS[item.type] || '#a087b0';
                  return (
                    <div
                      key={item._id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '14px 20px',
                        borderBottom: idx < recentActivity.length - 1 ? '1px solid #ede9fe' : 'none',
                      }}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: `${color}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
                          <Link to="/users/view" state={{ id: profile?._id }} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>{name}</Link> {label}
                          {item.metadata?.noteTitle && (
                            <span style={{ color: '#a087b0' }}> · {item.metadata.noteTitle}</span>
                          )}
                        </p>
                        {item.createdAt && (
                          <p style={{ fontSize: 11, color: '#c4b5d4', margin: '3px 0 0' }}>
                            {formatRelative ? formatRelative(item.createdAt) : formatDate(item.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <ConfirmModal
        open={removeConfirm}
        title="Remove friend"
        message={`Are you sure you want to remove ${name} as a friend?`}
        confirmLabel="Remove"
        loading={removeMutation.isPending}
        onConfirm={() => { removeMutation.mutate(); setRemoveConfirm(false); }}
        onClose={() => setRemoveConfirm(false)}
      />
    </div>
  );
}
