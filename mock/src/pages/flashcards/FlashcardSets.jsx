import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, BookOpen, Trash2, Play, Edit3 } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { formatRelative } from '@/lib/utils';

export default function FlashcardSets() {
  const [showCreate, setShowCreate] = useState(false);
  const [newSet, setNewSet] = useState({ title: '', description: '', subject: '' });
  const [sharedTab, setSharedTab] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: sharedTab ? ['flashcard-sets-shared'] : ['flashcard-sets'],
    queryFn: () =>
      sharedTab
        ? api.get('/flashcard-sets/shared').then(r => r.data)
        : api.get('/flashcard-sets').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/flashcard-sets', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      setShowCreate(false);
      setNewSet({ title: '', description: '', subject: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/flashcard-sets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] }),
  });

  const sets = data?.sets || data?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="text-secondary text-sm mt-0.5">{sets.length} sets</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New set
        </Button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSharedTab(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !sharedTab
              ? 'bg-primary text-white'
              : 'bg-accent text-foreground/70 hover:text-primary'
          }`}
        >
          My sets
        </button>
        <button
          onClick={() => setSharedTab(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sharedTab
              ? 'bg-primary text-white'
              : 'bg-accent text-foreground/70 hover:text-primary'
          }`}
        >
          Shared with me
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3 text-secondary/40" />
          <h3 className="font-semibold text-foreground mb-1">
            {sharedTab ? 'No shared sets' : 'No flashcard sets'}
          </h3>
          <p className="text-secondary text-sm mb-4">
            {sharedTab
              ? 'No flashcard sets have been shared with you yet.'
              : 'Create your first set to start studying.'}
          </p>
          {!sharedTab && (
            <Button size="sm" onClick={() => setShowCreate(true)}>Create a set</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map(set => (
            <FlashcardSetCard
              key={set._id}
              set={set}
              onDelete={sharedTab ? null : () => {
                if (window.confirm('Delete this set?')) deleteMutation.mutate(set._id);
              }}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New flashcard set">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Title *</label>
            <input
              className="input-field"
              placeholder="e.g. Biology Chapter 5"
              value={newSet.title}
              onChange={e => setNewSet(s => ({ ...s, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Subject</label>
            <input
              className="input-field"
              placeholder="e.g. Biology"
              value={newSet.subject}
              onChange={e => setNewSet(s => ({ ...s, subject: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Optional description..."
              value={newSet.description}
              onChange={e => setNewSet(s => ({ ...s, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newSet)}
              loading={createMutation.isPending}
              disabled={!newSet.title.trim()}
              className="flex-1"
            >
              Create set
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FlashcardSetCard({ set, onDelete }) {
  return (
    <Card className="group relative flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BookOpen size={18} className="text-primary" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to="/flashcards/view" state={{ id: set._id }}>
            <button className="p-1.5 rounded-lg hover:bg-accent text-secondary hover:text-primary transition-colors">
              <Edit3 size={13} />
            </button>
          </Link>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <Link to="/flashcards/view" state={{ id: set._id }} className="flex-1">
        <h3 className="font-semibold text-foreground mb-1 hover:text-primary transition-colors line-clamp-2">
          {set.title}
        </h3>
        {set.subject && <p className="text-xs text-secondary mb-2">{set.subject}</p>}
        <Badge variant="neutral">{set.totalCards ?? 0} cards</Badge>
      </Link>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-secondary">{formatRelative(set.updatedAt)}</span>
        <Link to="/flashcards/study" state={{ id: set._id }}>
          <Button size="sm" variant="outline">
            <Play size={12} /> Study
          </Button>
        </Link>
      </div>
    </Card>
  );
}
