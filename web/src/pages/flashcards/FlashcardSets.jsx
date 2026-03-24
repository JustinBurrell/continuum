import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, BookOpen, Trash2, Play, Edit3, Search } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FlashcardSetsSkeleton from '@/components/skeletons/FlashcardSetsSkeleton';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { formatRelative } from '@/lib/utils';

export default function FlashcardSets() {
  const [deleteConfirm, setDeleteConfirm] = useState(null); // set._id to delete
  const [showCreate, setShowCreate] = useState(false);
  const [newSet, setNewSet] = useState({ title: '', description: '', subject: '' });
  const [sharedTab, setSharedTab] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: sharedTab ? ['flashcard-sets-shared', search] : ['flashcard-sets', search],
    queryFn: () =>
      sharedTab
        ? api.get('/flashcard-sets/shared', { params: search ? { search } : {} }).then(r => r.data)
        : api.get('/flashcard-sets', { params: search ? { search } : {} }).then(r => r.data),
    staleTime: 120_000,
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
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#111827', fontWeight: 700, lineHeight: 1.2 }}>
            Flashcards
          </h1>
          <p style={{ color: '#a087b0', fontSize: '0.8125rem', marginTop: 2 }}>
            {sets.length} {sets.length === 1 ? 'set' : 'sets'}
          </p>
        </div>
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
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
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
              background: sharedTab === value ? '#6b21a8' : '#f5f0ff',
              color: sharedTab === value ? 'white' : '#6b21a8',
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
            background: '#f5f0ff',
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
          <p style={{ color: '#a087b0', fontSize: '0.875rem', marginBottom: 20 }}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map(set => (
            <FlashcardSetCard
              key={set._id}
              set={set}
              onDelete={sharedTab ? null : () => setDeleteConfirm(set._id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New flashcard set">
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Title *
            </label>
            <input
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid #ede9fe',
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
                border: '1px solid #ede9fe',
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
                border: '1px solid #ede9fe',
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
        border: '1px solid #ede9fe',
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
        e.currentTarget.style.borderColor = '#ede9fe';
        e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: '#f5f0ff',
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
                color: '#a087b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#6b21a8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
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
                color: '#a087b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
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
          <p style={{ fontSize: '0.8125rem', color: '#a087b0', marginBottom: 8 }}>{set.subject}</p>
        )}
        <span style={{
          display: 'inline-block',
          background: '#f5f0ff',
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
        <span style={{ fontSize: '0.75rem', color: '#a087b0' }}>{formatRelative(set.updatedAt)}</span>
        <Link to="/flashcards/study" state={{ id: set._id }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              borderRadius: 10,
              border: '1px solid #ede9fe',
              background: 'white',
              color: '#374151',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b21a8'; e.currentTarget.style.color = '#6b21a8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9fe'; e.currentTarget.style.color = '#374151'; }}
          >
            <Play size={12} /> Study
          </button>
        </Link>
      </div>
    </div>
  );
}
