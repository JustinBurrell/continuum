import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Sparkles, Play, Trash2, Pencil, Share2 } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ShareModal from '@/components/ui/ShareModal';

export default function FlashcardSetDetail() {
  const { state } = useLocation();
  const id = state?.id;
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });
  const [aiLoading, setAiLoading] = useState(false);

  // Edit card state
  const [editingCard, setEditingCard] = useState(null); // { _id, front, back }
  const [editCard, setEditCard] = useState({ front: '', back: '' });

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn: () => api.get(`/flashcard-sets/${id}`).then(r => r.data),
  });

  const addCardMutation = useMutation({
    mutationFn: (card) => api.post(`/flashcard-sets/${id}/cards`, card),
    onSuccess: () => {
      refetch();
      setShowAddCard(false);
      setNewCard({ front: '', back: '' });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => api.delete(`/flashcard-sets/${id}/cards/${cardId}`),
    onSuccess: () => refetch(),
  });

  const editCardMutation = useMutation({
    mutationFn: ({ cardId, front, back }) =>
      api.put(`/flashcard-sets/${id}/cards/${cardId}`, { front, back }),
    onSuccess: () => {
      refetch();
      setEditingCard(null);
    },
  });

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await api.post('/flashcard-sets/generate', { setId: id });
      refetch();
    } finally {
      setAiLoading(false);
    }
  };

  const shareMutation = useMutation({
    mutationFn: (payload) => api.patch(`/flashcard-sets/${id}/share`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      refetch();
      setShowShareModal(false);
    },
  });

  const openEditCard = (card) => {
    setEditingCard(card);
    setEditCard({ front: card.front, back: card.back });
  };

  const set = data?.set || data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ color: '#a087b0', marginBottom: 8 }}>Set not found.</p>
        <Link to="/flashcards" style={{ color: '#6b21a8', fontSize: '0.875rem', textDecoration: 'none' }}>
          Back to sets
        </Link>
      </div>
    );
  }

  const cardCount = set.flashcards?.length || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Link to="/flashcards">
          <button
            style={{
              padding: 8,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: '#a087b0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
          >
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {set.title}
          </h1>
          {set.subject && (
            <p style={{ fontSize: '0.875rem', color: '#a087b0', marginTop: 2 }}>{set.subject}</p>
          )}
        </div>

        {/* Action buttons */}
        <button
          onClick={() => setShowShareModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 12,
            border: '1px solid #ede9fe',
            background: 'white',
            color: '#374151',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Share2 size={14} />
          {set.visibility && set.visibility !== 'private' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Shared
              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                {set.visibility === 'friends' ? 'Friends' : `${set.sharedWith?.length || 0}`}
              </span>
            </span>
          ) : 'Share'}
        </button>

        <button
          onClick={handleAiGenerate}
          disabled={aiLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 12,
            border: '1px solid #ede9fe',
            background: 'white',
            color: '#374151',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: aiLoading ? 'not-allowed' : 'pointer',
            opacity: aiLoading ? 0.7 : 1,
          }}
        >
          <Sparkles size={14} style={{ color: '#6b21a8' }} />
          {aiLoading ? 'Generating...' : 'AI Generate'}
        </button>

        <button
          onClick={() => setShowAddCard(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 12,
            border: '1px solid #ede9fe',
            background: 'white',
            color: '#374151',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add card
        </button>

        <Link to="/flashcards/study" state={{ id }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 12,
              border: 'none',
              background: '#6b21a8',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Play size={14} /> Study
          </button>
        </Link>
      </div>

      <p style={{ fontSize: '0.8125rem', color: '#a087b0', marginBottom: 24, marginLeft: 42 }}>
        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
      </p>

      {/* Cards grid */}
      {cardCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#f5f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Sparkles size={22} style={{ color: '#6b21a8' }} />
          </div>
          <p style={{ color: '#a087b0', fontSize: '0.875rem' }}>
            No cards yet. Add cards manually or use AI Generate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {set.flashcards?.map((card, i) => (
            <div
              key={card._id || i}
              className="group"
              style={{
                background: 'white',
                border: '1px solid #ede9fe',
                borderRadius: 16,
                boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                padding: '18px 20px',
                position: 'relative',
                transition: 'border-color 0.15s, box-shadow 0.15s',
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
              {/* Actions */}
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, opacity: 0 }} className="group-hover:opacity-100">
                <button
                  onClick={() => openEditCard(card)}
                  style={{
                    padding: 4,
                    borderRadius: 6,
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
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => deleteCardMutation.mutate(card._id)}
                  style={{
                    padding: 4,
                    borderRadius: 6,
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
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Front */}
              <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #ede9fe' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  Front
                </p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', lineHeight: 1.45 }}>{card.front}</p>
              </div>

              {/* Back */}
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#a087b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  Back
                </p>
                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>{card.back}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add card modal */}
      <Modal open={showAddCard} onClose={() => setShowAddCard(false)} title="Add flashcard">
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Front *
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
              placeholder="Question or term..."
              value={newCard.front}
              onChange={e => setNewCard(c => ({ ...c, front: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Back *
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
              placeholder="Answer or definition..."
              value={newCard.back}
              onChange={e => setNewCard(c => ({ ...c, back: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAddCard(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => addCardMutation.mutate(newCard)}
              loading={addCardMutation.isPending}
              disabled={!newCard.front.trim() || !newCard.back.trim()}
              className="flex-1"
            >
              Add card
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        currentVisibility={set.visibility || 'private'}
        currentSharedWith={set.sharedWith || []}
        onSave={(payload) => shareMutation.mutate(payload)}
        saving={shareMutation.isPending}
      />

      {/* Edit card modal */}
      <Modal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        title="Edit flashcard"
      >
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Front *
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
              placeholder="Question or term..."
              value={editCard.front}
              onChange={e => setEditCard(c => ({ ...c, front: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Back *
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
              placeholder="Answer or definition..."
              value={editCard.back}
              onChange={e => setEditCard(c => ({ ...c, back: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditingCard(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={() =>
                editCardMutation.mutate({
                  cardId: editingCard._id,
                  front: editCard.front,
                  back: editCard.back,
                })
              }
              loading={editCardMutation.isPending}
              disabled={!editCard.front.trim() || !editCard.back.trim()}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
