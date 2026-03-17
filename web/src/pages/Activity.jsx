import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
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
        ? <><span className="font-semibold">{name}</span> shared their note <span className="text-secondary">"{m.noteTitle}"</span></>
        : <><span className="font-semibold">{name}</span> shared a note</>;
    case 'flashcard_shared':
      return m.setTitle
        ? <><span className="font-semibold">{name}</span> shared a flashcard set <span className="text-secondary">"{m.setTitle}"</span></>
        : <><span className="font-semibold">{name}</span> shared a flashcard set</>;
    case 'task_created':
      return m.taskTitle
        ? <><span className="font-semibold">{name}</span> created a new task <span className="text-secondary">"{m.taskTitle}"</span></>
        : <><span className="font-semibold">{name}</span> created a new task</>;
    case 'comment_added':
      return m.commentPreview
        ? <><span className="font-semibold">{name}</span> commented: <span className="text-secondary">"{m.commentPreview}"</span></>
        : <><span className="font-semibold">{name}</span> left a comment</>;
    case 'like_added':
      return m.commentPreview
        ? <><span className="font-semibold">{name}</span> liked a comment: <span className="text-secondary">"{m.commentPreview}"</span></>
        : <><span className="font-semibold">{name}</span> liked a comment</>;
    default:
      return <><span className="font-semibold">{name}</span> did something</>;
  }
}

function ActivityItem({ item }) {
  const actor = item.userId;
  const name = fullName(actor);

  const actorId = actor?._id;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Link to="/users/view" state={{ id: actorId }} className="flex-shrink-0 mt-0.5">
        <Avatar name={name} src={actor?.avatarUrl} size="sm" className="hover:opacity-80 transition-opacity" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{getActivitySentence(item, name)}</p>
        <p className="text-xs text-secondary mt-0.5">{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

export default function Activity() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/activity').then(r => r.data),
  });

  const activities = data?.feed || data?.activities || data?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity</h1>
          <p className="text-secondary text-sm mt-0.5">Track what's happening</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-border px-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3">
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon size={36} className="mx-auto mb-3 text-secondary/40" />
              <p className="text-secondary text-sm">
                No activity yet. Start creating notes, tasks, and more.
              </p>
            </div>
          ) : (
            activities.map(item => <ActivityItem key={item._id} item={item} />)
          )}
        </div>
      </Card>
    </div>
  );
}
