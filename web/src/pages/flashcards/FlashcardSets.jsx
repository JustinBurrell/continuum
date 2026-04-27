import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Trash2, Play, Edit3, Search } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FlashcardSetsSkeleton from '@/components/skeletons/FlashcardSetsSkeleton';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function FlashcardSets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(null); // set._id to delete
  const [showCreate, setShowCreate] = useState(false);
  const [newSet, setNewSet] = useState({ title: '', description: '', subject: '' });
  const [sharedTab, setSharedTab] = useState(false);
  const [search, setSearch] = useState('');

  const {
    data: ownData,
    isLoading: ownLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['flashcard-sets', search],
    queryFn: ({ pageParam }) =>
      api.get('/flashcard-sets', {
        params: { ...(search && { search }), page: pageParam, limit: 20 },
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      return p && p.page < p.pages ? p.page + 1 : undefined;
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
    enabled: !sharedTab,
  });

  const { data: sharedData, isLoading: sharedLoading } = useQuery({
    queryKey: ['flashcard-sets-shared', search],
    queryFn: () =>
      api.get('/flashcard-sets/shared', { params: search ? { search } : {} }).then(r => r.data),
    staleTime: 120_000,
    placeholderData: (prev) => prev,
    enabled: sharedTab,
  });

  const isLoading = sharedTab ? sharedLoading : ownLoading;

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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['flashcard-sets', search] });
      const prev = queryClient.getQueryData(['flashcard-sets', search]);
      queryClient.setQueryData(['flashcard-sets', search], (old) => {
        if (!old?.pages) return old;
        return { ...old, pages: old.pages.map(page => ({ ...page, sets: page.sets.filter(s => s._id !== id) })) };
      });
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['flashcard-sets', search], ctx.prev);
      toast({ message: err?.response?.data?.error || 'Failed to delete flashcard set.', type: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] }),
  });

  const { data: streakData } = useQuery({
    queryKey: ['study-streak'],
    queryFn: () => api.get('/study-sessions/streak').then(r => r.data),
    staleTime: 300_000,
  });

  const streak = streakData?.streak ?? 0;
  const sets = sharedTab
    ? (sharedData?.sets || [])
    : (ownData?.pages.flatMap(p => p.sets) ?? []);
  const totalSets = sharedTab
    ? sets.length
    : (ownData?.pages[0]?.pagination?.total ?? sets.length);

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', color: '#111827', fontWeight: 700, lineHeight: 1.2 }}>
            Flashcards
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: 2 }}>
            {totalSets} {totalSets === 1 ? 'set' : 'sets'}
          </p>
        </div>
        {!user?.isDemo && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: '#6b21a8',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Plus size={15} /> New set
          </button>
        )}
      </div>

      {/* Streak banner — always visible */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 14,
        padding: '12px 18px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.375rem' }}>{streak >= 7 ? '🔥' : streak >= 1 ? '⚡' : '📖'}</span>
          <div>
            <p style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', margin: 0 }}>
              {streak >= 1 ? `${streak} day${streak !== 1 ? 's' : ''} in a row!` : 'Start your streak today'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '2px 0 0' }}>
              {streak >= 7 ? "You're on fire. Keep going!" : streak >= 1 ? 'Study today to keep your streak alive.' : 'Complete a study session to begin.'}
            </p>
          </div>
        </div>
        <Link to="/flashcards/history" style={{ fontSize: '0.8125rem', color: '#6b21a8', fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}>
          History
        </Link>
      </div>

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
          placeholder="Search flashcard sets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'My sets', value: false },
          { label: 'Shared with me', value: true },
        ].map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setSharedTab(value)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: sharedTab === value ? '#6b21a8' : 'transparent',
              color: sharedTab === value ? 'white' : '#6B7280',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <FlashcardSetsSkeleton />
      ) : sets.length === 0 ? (
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
            <BookOpen size={28} style={{ color: '#6b21a8' }} />
          </div>
          <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: 6 }}>
            {sharedTab ? 'No shared sets' : 'No flashcard sets'}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: 20 }}>
            {sharedTab
              ? 'No flashcard sets have been shared with you yet.'
              : 'Create your first set to start studying.'}
          </p>
          {!sharedTab && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: '#6b21a8',
                color: 'white',
                padding: '9px 20px',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Create a set
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map(set => (
              <FlashcardSetCard
                key={set._id}
                set={set}
                onDelete={sharedTab || user?.isDemo ? null : () => setDeleteConfirm(set._id)}
              />
            ))}
          </div>
          {!sharedTab && hasNextPage && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  color: '#6b21a8',
                  padding: '9px 24px',
                  borderRadius: 12,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
                  opacity: isFetchingNextPage ? 0.6 : 1,
                }}
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New flashcard set">
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Title <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '9px 14px',
                fontSize: '0.875rem',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. Biology Chapter 5"
              value={newSet.title}
              onChange={e => setNewSet(s => ({ ...s, title: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Subject
            </label>
            <input
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '9px 14px',
                fontSize: '0.875rem',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g. Biology"
              value={newSet.subject}
              onChange={e => setNewSet(s => ({ ...s, subject: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                padding: '9px 14px',
                fontSize: '0.875rem',
                color: '#111827',
                outline: 'none',
                minHeight: 80,
                resize: 'none',
                boxSizing: 'border-box',
              }}
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

      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete flashcard set"
        message="Are you sure you want to delete this set? All flashcards inside will be permanently removed."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => { deleteMutation.mutate(deleteConfirm); setDeleteConfirm(null); }}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function FlashcardSetCard({ set, onDelete }) {
  return (
    <div
      className="group"
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#6b21a8';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'rgba(107,33,168,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <BookOpen size={18} style={{ color: '#6b21a8' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, opacity: 0 }} className="group-hover:opacity-100">
          <Link to="/flashcards/view" state={{ id: set._id }}>
            <button
              style={{
                padding: 5,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: '#9CA3AF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,33,168,0.08)'; e.currentTarget.style.color = '#6b21a8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <Edit3 size={13} />
            </button>
          </Link>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: 5,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: '#9CA3AF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Title + subject */}
      <Link to="/flashcards/view" state={{ id: set._id }} style={{ flex: 1, textDecoration: 'none' }}>
        <h3 style={{
          fontWeight: 600,
          color: '#111827',
          fontSize: '0.9375rem',
          marginBottom: 4,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
        onMouseLeave={e => e.currentTarget.style.color = '#111827'}
        >
          {set.title}
        </h3>
        {set.subject && (
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: 8 }}>{set.subject}</p>
        )}
        <span style={{
          display: 'inline-block',
          background: 'rgba(107,33,168,0.08)',
          color: '#6b21a8',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '3px 10px',
          borderRadius: 20,
        }}>
          {set.totalCards ?? 0} cards
        </span>
      </Link>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{formatRelative(set.updatedAt)}</span>
        <Link to="/flashcards/study" state={{ id: set._id }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid #6b21a8',
              background: 'white',
              color: '#6b21a8',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#6b21a8'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b21a8'; }}
          >
            <Play size={12} /> Study
          </button>
        </Link>
      </div>
    </div>
  );
}
