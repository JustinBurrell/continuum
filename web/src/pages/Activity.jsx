import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Activity as ActivityIcon, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ActivitySkeleton from '@/components/skeletons/ActivitySkeleton';
import { formatRelative } from '@/lib/utils';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Someone';
}

const nameLink = (u) => (
  <span key={u._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    <Link
      to="/users/view"
      state={{ id: u._id }}
      style={{ color: '#6b21a8', fontWeight: 600, textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
    >
      {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Someone'}
    </Link>
    <VerifiedBadge roles={u.roles} />
  </span>
);

function renderNames(names) {
  if (!names || names.length === 0) return null;
  if (names.length === 1) return nameLink(names[0]);
  if (names.length === 2) return <>{nameLink(names[0])} and {nameLink(names[1])}</>;
  return <>{nameLink(names[0])}, {nameLink(names[1])}, and {names.length - 2} other{names.length - 2 !== 1 ? 's' : ''}</>;
}

function shareSuffix(m) {
  if (m.isRecipient) return <> with you</>;
  if (m.sharedWithAll) return <> with friends</>;
  if (m.sharedWithNames?.length > 0) return <> with {renderNames(m.sharedWithNames)}</>;
  return null;
}

function getActivitySentence(item, actor) {
  const m = item.metadata || {};
  const name = fullName(actor);
  const bold = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <Link to="/users/view" state={{ id: actor?._id }} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
        {name}
      </Link>
      <VerifiedBadge roles={actor?.roles} />
    </span>
  );
  const suffix = shareSuffix(m);

  switch (item.type) {
    case 'note_shared':
      return <>{bold} shared their note {m.noteTitle && <span style={{ color: '#a087b0' }}>"{m.noteTitle}"</span>}{suffix}</>;
    case 'flashcard_shared':
      return <>{bold} shared a flashcard set {m.setTitle && <span style={{ color: '#a087b0' }}>"{m.setTitle}"</span>}{suffix}</>;
    case 'task_created':
      return <>{bold} shared a task {m.taskTitle && <span style={{ color: '#a087b0' }}>"{m.taskTitle}"</span>}{suffix}</>;
    case 'comment_added':
      return m.commentPreview
        ? <>{bold} commented: <span style={{ color: '#a087b0' }}>"{m.commentPreview}"</span></>
        : <>{bold} left a comment</>;
    case 'like_added':
      return m.commentPreview
        ? <>{bold} liked a comment: <span style={{ color: '#a087b0' }}>"{m.commentPreview}"</span></>
        : <>{bold} liked a comment</>;
    default:
      return <>{bold} did something</>;
  }
}

const TYPE_COLORS = {
  note_shared: '#6b21a8',
  flashcard_shared: '#7c3aed',
  task_created: '#2563eb',
  comment_added: '#16a34a',
  like_added: '#dc2626',
};

function ActivityItem({ item }) {
  const actor = item.userId;
  const name = fullName(actor);
  const actorId = actor?._id;
  const dotColor = TYPE_COLORS[item.type] || '#a087b0';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid #ede9fe',
      position: 'relative',
    }}>
      {/* Activity type dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Link to="/users/view" state={{ id: actorId }} style={{ display: 'block' }}>
          <Avatar name={name} src={actor?.avatarUrl} size="sm" className="hover:opacity-80 transition-opacity" />
        </Link>
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: dotColor,
          border: '2px solid #fff',
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>
          {getActivitySentence(item, actor)}
        </p>
        <p style={{ fontSize: 11, color: '#c4b5d4', marginTop: 4 }}>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function Activity() {
  const [actSearch, setActSearch] = useState('');
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  // Mark activities as seen — persists server-side so count resets on any device
  useEffect(() => {
    api.put('/activity/mark-seen').then(() => {
      const now = new Date().toISOString();
      updateUser({ lastViewedActivityAt: now });
      // Invalidate Dashboard's activity query so it refetches with count = 0
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }).catch(() => {});
  }, []);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['activity', { actSearch }],
    queryFn: ({ pageParam }) =>
      api.get('/activity', {
        params: {
          limit: PAGE_SIZE,
          ...(pageParam ? { cursor: pageParam } : {}),
          ...(actSearch ? { search: actSearch } : {}),
        },
      }).then(r => r.data),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
  });

  const activities = data?.pages.flatMap(p => p.feed) ?? [];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Activity
        </h1>
        <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>
          {activities.length > 0 ? `${activities.length} item${activities.length === 1 ? '' : 's'} loaded` : 'Track what\'s happening'}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a087b0', pointerEvents: 'none' }} />
        <input
          style={{
            width: '100%',
            paddingLeft: 36,
            paddingRight: 14,
            paddingTop: 9,
            paddingBottom: 9,
            background: 'white',
            border: '1px solid #ede9fe',
            borderRadius: 12,
            fontSize: '0.875rem',
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder="Search activity by name or content..."
          value={actSearch}
          onChange={e => setActSearch(e.target.value)}
        />
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0 20px' }}>
          {isLoading ? (
            <ActivitySkeleton />
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#f5f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <ActivityIcon size={24} style={{ color: '#a087b0' }} />
              </div>
              <p style={{ fontSize: 14, color: '#a087b0', margin: 0 }}>
                No activity yet. Start creating notes, tasks, and more.
              </p>
            </div>
          ) : (
            activities.map(item => <ActivityItem key={item._id} item={item} />)
          )}
        </div>

        {/* Load more */}
        {hasNextPage && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #ede9fe', textAlign: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
