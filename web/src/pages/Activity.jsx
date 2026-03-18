import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative } from '@/lib/utils';

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Someone';
}

function getActivitySentence(item, name) {
  const m = item.metadata || {};
  switch (item.type) {
    case 'note_shared':
      return m.noteTitle
        ? <><span style={{ fontWeight: 700 }}>{name}</span> shared their note <span style={{ color: '#a087b0' }}>"{m.noteTitle}"</span></>
        : <><span style={{ fontWeight: 700 }}>{name}</span> shared a note</>;
    case 'flashcard_shared':
      return m.setTitle
        ? <><span style={{ fontWeight: 700 }}>{name}</span> shared a flashcard set <span style={{ color: '#a087b0' }}>"{m.setTitle}"</span></>
        : <><span style={{ fontWeight: 700 }}>{name}</span> shared a flashcard set</>;
    case 'task_created':
      return m.taskTitle
        ? <><span style={{ fontWeight: 700 }}>{name}</span> created a new task <span style={{ color: '#a087b0' }}>"{m.taskTitle}"</span></>
        : <><span style={{ fontWeight: 700 }}>{name}</span> created a new task</>;
    case 'comment_added':
      return m.commentPreview
        ? <><span style={{ fontWeight: 700 }}>{name}</span> commented: <span style={{ color: '#a087b0' }}>"{m.commentPreview}"</span></>
        : <><span style={{ fontWeight: 700 }}>{name}</span> left a comment</>;
    case 'like_added':
      return m.commentPreview
        ? <><span style={{ fontWeight: 700 }}>{name}</span> liked a comment: <span style={{ color: '#a087b0' }}>"{m.commentPreview}"</span></>
        : <><span style={{ fontWeight: 700 }}>{name}</span> liked a comment</>;
    default:
      return <><span style={{ fontWeight: 700 }}>{name}</span> did something</>;
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
          {getActivitySentence(item, name)}
        </p>
        <p style={{ fontSize: 11, color: '#c4b5d4', marginTop: 4 }}>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function Activity() {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ['activity', { limit }],
    queryFn: () => api.get('/activity', { params: { limit } }).then(r => r.data),
  });

  const activities = data?.feed || [];
  const hasMore = activities.length >= limit;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Activity
        </h1>
        <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>Track what's happening</p>
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
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #ede9fe' }}>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
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
            <>
              {activities.map(item => <ActivityItem key={item._id} item={item} />)}
              {hasMore && (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <Button
                    variant="outline"
                    onClick={() => setLimit(prev => prev + PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
