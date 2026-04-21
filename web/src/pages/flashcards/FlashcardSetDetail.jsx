import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Sparkles, Play, Trash2, Pencil, Share2, Copy, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import CommentThread from '@/components/comments/CommentThread';
import api from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ShareModal from '@/components/ui/ShareModal';
import { useAuth } from '@/context/AuthContext';

export default function FlashcardSetDetail() {
  const { state } = useLocation();
  const id = state?.id;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'history'
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });
  // Edit card state
  const [editingCard, setEditingCard] = useState(null); // { _id, front, back }
  const [editCard, setEditCard] = useState({ front: '', back: '' });
  // Inline title edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  // Duplicate state
  const [duplicateMsg, setDuplicateMsg] = useState('');
  const [duplicatedId, setDuplicatedId] = useState(null);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  // Delete set state
  const [showDeleteSet, setShowDeleteSet] = useState(false);

  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn: () => api.get(`/flashcard-sets/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['study-sessions', id],
    queryFn: () => api.get(`/study-sessions/set/${id}`).then(r => r.data),
    enabled: activeTab === 'history' && !!id,
    staleTime: 60_000,
  });

  const addCardMutation = useMutation({
    mutationFn: (card) => api.post(`/flashcard-sets/${id}/cards`, card),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      setShowAddCard(false);
      setNewCard({ front: '', back: '' });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => api.delete(`/flashcard-sets/${id}/cards/${cardId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] }),
  });

  const editCardMutation = useMutation({
    mutationFn: ({ cardId, front, back }) =>
      api.put(`/flashcard-sets/${id}/cards/${cardId}`, { front, back }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      setEditingCard(null);
    },
  });

  const shareMutation = useMutation({
    mutationFn: (payload) => api.patch(`/flashcard-sets/${id}/share`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setShowShareModal(false);
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: () => api.delete(`/flashcard-sets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      navigate('/flashcards');
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: (updates) => api.patch(`/flashcard-sets/${id}`, updates),
    onSuccess: (res) => {
      const updatedSet = res.data?.set || res.data?.data;
      if (updatedSet) {
        // Instantly update the detail cache
        queryClient.setQueryData(['flashcard-set', id], (old) =>
          old ? { ...old, set: { ...(old.set || {}), ...updatedSet } } : old
        );
        // Instantly patch all paginated flashcard-sets list caches
        queryClient.setQueriesData({ queryKey: ['flashcard-sets'] }, (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              sets: (page.sets || []).map(s => s._id === id ? { ...s, ...updatedSet } : s),
            })),
          };
        });
      }
      // Background invalidation for eventual consistency
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      setEditingTitle(false);
    },
  });

  const submitTitleEdit = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === set?.title) { setEditingTitle(false); return; }
    updateSetMutation.mutate({ title: trimmed });
  };

  const duplicateMutation = useMutation({
    mutationFn: () => api.post(`/flashcard-sets/${id}/duplicate`),
    onSuccess: (res) => {
      const newId = res.data?.set?._id;
      setDuplicatedId(newId);
      setDuplicateMsg('Saved a copy to your sets!');
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
    },
    onError: () => setDuplicateMsg('Failed to save a copy.'),
  });

  const openEditCard = (card) => {
    setEditingCard(card);
    setEditCard({ front: card.front, back: card.back });
  };

  const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

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
  const creatorId = set.userId?._id ?? set.userId;
  const isOwner = String(creatorId) === String(user?._id);
  const creator = set.userId?._id ? set.userId : null; // populated object when not owner

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
          {isOwner && editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={submitTitleEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); submitTitleEdit(); }
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.2,
                border: 'none',
                borderBottom: '2px solid #6b21a8',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                padding: 0,
              }}
            />
          ) : (
            <h1
              style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {set.title}
              {isOwner && !user?.isDemo && (
                <button
                  onClick={() => { setTitleDraft(set.title); setEditingTitle(true); }}
                  style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#a087b0', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#6b21a8'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
                >
                  <Pencil size={14} />
                </button>
              )}
            </h1>
          )}
          {set.subject && (
            <p style={{ fontSize: '0.875rem', color: '#a087b0', marginTop: 2 }}>{set.subject}</p>
          )}
        </div>

        {/* Action buttons */}
        {!isOwner && (
          <button
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending || !!duplicatedId}
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
              cursor: duplicateMutation.isPending || duplicatedId ? 'not-allowed' : 'pointer',
              opacity: duplicateMutation.isPending ? 0.6 : 1,
            }}
          >
            <Copy size={14} />
            {duplicateMutation.isPending ? 'Saving...' : duplicatedId ? 'Saved' : 'Save a copy'}
          </button>
        )}
        {isOwner && !user?.isDemo && (
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
        )}

        {isOwner && !user?.isDemo && (
          <button
            onClick={() => setShowDeleteSet(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 10,
              border: '1px solid #ede9fe',
              background: 'white',
              color: '#a087b0',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#a087b0'; e.currentTarget.style.borderColor = '#ede9fe'; }}
            title="Delete set"
          >
            <Trash2 size={15} />
          </button>
        )}

        {isOwner && !user?.isDemo && (
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
        )}

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

      <div style={{ marginLeft: 42, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: '0.8125rem', color: '#a087b0' }}>
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </p>
        {!isOwner && creator && (
          <p style={{ fontSize: '0.8125rem', color: '#a087b0' }}>
            Created by{' '}
            <Link
              to="/users/view"
              state={{ id: creator._id }}
              style={{ color: '#6b21a8', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {fullName(creator)}
            </Link>
          </p>
        )}
        {duplicateMsg && (
          <p style={{ fontSize: '0.75rem', color: duplicateMsg.includes('Failed') ? '#ef4444' : '#16a34a' }}>
            {duplicateMsg}
            {duplicatedId && (
              <Link to="/flashcards" style={{ marginLeft: 8, color: '#6b21a8', fontWeight: 500, textDecoration: 'none' }}>
                View sets
              </Link>
            )}
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['cards', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? '#6b21a8' : '#f5f0ff',
              color: activeTab === tab ? 'white' : '#6b21a8',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards tab */}
      {activeTab === 'cards' && (
        cardCount === 0 ? (
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
              No cards yet. Add your first card to get started.
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
                {/* Actions — owner only */}
                {isOwner && !user?.isDemo && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, opacity: 0.4 }} className="group-hover:opacity-100">
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
                )}

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
        )
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {historyLoading && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}
          {!historyLoading && !historyData?.sessions?.length && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#a087b0', fontSize: '0.875rem' }}>
                No study sessions yet. Hit Study to start!
              </p>
            </div>
          )}
          {historyData?.sessions?.map(session => (
            <SessionRow key={session._id} session={session} />
          ))}
        </div>
      )}

      {/* Comments section */}
      <div style={{
        background: 'white',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '24px 28px',
        marginTop: 24,
      }}>
        <CommentThread targetType="flashcardSet" targetId={id} user={user} isDemo={user?.isDemo} />
      </div>

      {/* Add card modal */}
      <Modal open={showAddCard} onClose={() => setShowAddCard(false)} title="Add flashcard">
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: 6 }}>
              Front <span style={{ color: '#dc2626' }}>*</span>
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
              Back <span style={{ color: '#dc2626' }}>*</span>
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

      {/* Delete set confirm modal */}
      <Modal open={showDeleteSet} onClose={() => setShowDeleteSet(false)} title="Delete flashcard set">
        <div className="space-y-4">
          <p style={{ fontSize: '0.875rem', color: '#374151' }}>
            Delete <strong>{set?.title}</strong>? This will also delete all {cardCount} {cardCount === 1 ? 'card' : 'cards'} inside it. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteSet(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => deleteSetMutation.mutate()}
              loading={deleteSetMutation.isPending}
              style={{ background: '#ef4444', flex: 1 }}
            >
              Delete set
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
              Front <span style={{ color: '#dc2626' }}>*</span>
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
              Back <span style={{ color: '#dc2626' }}>*</span>
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

function SessionRow({ session }) {
  const [expanded, setExpanded] = useState(false);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['study-session-detail', session._id],
    queryFn: () => api.get(`/study-sessions/${session._id}`).then(r => r.data),
    enabled: expanded,
    staleTime: Infinity,
  });

  const scoreColor = session.score >= 70 ? '#16a34a' : session.score >= 40 ? '#d97706' : '#dc2626';
  const scoreBg = session.score >= 70 ? '#f0fdf4' : session.score >= 40 ? '#fffbeb' : '#fef2f2';
  const mins = Math.floor(session.durationSeconds / 60);
  const secs = session.durationSeconds % 60;
  const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${expanded ? '#6b21a8' : '#ede9fe'}`,
      borderRadius: 14,
      boxShadow: '0 1px 4px rgba(107,33,168,0.04)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: 12,
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', margin: 0 }}>
            {session.correctCount}/{session.totalCards} correct
          </p>
          <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: '3px 0 0' }}>
            {formatRelative(session.completedAt)} &middot; {duration}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: scoreColor,
            background: scoreBg,
            padding: '4px 12px',
            borderRadius: 20,
            border: `1px solid ${scoreColor}22`,
          }}>
            {session.score}%
          </span>
          <span style={{ color: '#a087b0', display: 'flex', alignItems: 'center' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #ede9fe', padding: '12px 18px 16px', background: '#faf8ff' }}>
          {detailLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : detailData?.session?.cardResults?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailData.session.cardResults.map((result, i) => {
                const card = result.cardId;
                const front = card?.front || `Card ${i + 1}`;
                const back = card?.back;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: result.correct ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${result.correct ? '#bbf7d0' : '#fecaca'}`,
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: 1 }}>
                      {result.correct
                        ? <CheckCircle size={16} style={{ color: '#16a34a' }} />
                        : <XCircle size={16} style={{ color: '#dc2626' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: '0.8125rem', color: '#111827', margin: 0 }}>{front}</p>
                      {back && (
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0' }}>{back}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: '#a087b0', margin: 0 }}>No card detail available for this session.</p>
          )}
        </div>
      )}
    </div>
  );
}
