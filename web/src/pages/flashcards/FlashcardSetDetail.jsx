import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Sparkles, Play, Trash2, Pencil, Share2, Copy, MessageCircle, Send, Heart, Trash } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import ShareModal from '@/components/ui/ShareModal';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';

export default function FlashcardSetDetail() {
  const { state } = useLocation();
  const id = state?.id;
  const { user } = useAuth();
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });
  // Edit card state
  const [editingCard, setEditingCard] = useState(null); // { _id, front, back }
  const [editCard, setEditCard] = useState({ front: '', back: '' });
  // Inline title edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  // Comment state
  const [comment, setComment] = useState('');
  // Duplicate state
  const [duplicateMsg, setDuplicateMsg] = useState('');
  const [duplicatedId, setDuplicatedId] = useState(null);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  // Delete set state
  const [showDeleteSet, setShowDeleteSet] = useState(false);

  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn: () => api.get(`/flashcard-sets/${id}`).then(r => r.data),
    enabled: !!id,
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

  const shareMutation = useMutation({
    mutationFn: (payload) => api.patch(`/flashcard-sets/${id}/share`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      refetch();
      setShowShareModal(false);
    },
  });

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['flashcard-set-comments', id],
    queryFn: () => api.get(`/comments/flashcardSet/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: (content) => api.post('/comments', { targetType: 'flashcardSet', targetId: id, content }),
    onSuccess: () => {
      setComment('');
      refetchComments();
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => refetchComments(),
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId) => api.post(`/comments/${commentId}/like`),
    onSuccess: () => refetchComments(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
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

  const getCommentAuthor = (c) => c.userSnapshot || {};
  const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

  const set = data?.set || data?.data;
  const comments = commentsData?.comments || commentsData?.data || [];

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
              {isOwner && (
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
        {isOwner && (
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

        {isOwner && (
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

        {isOwner && (
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
              {isOwner && (
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
        <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <MessageCircle size={16} style={{ color: '#6b21a8' }} /> Comments ({comments.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {comments.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#a087b0' }}>No comments yet. Be the first to comment.</p>
          ) : (
            comments.map(c => {
              const author = getCommentAuthor(c);
              const isOwn = c.userId === user?._id || c.userId?._id === user?._id;
              const isLiked = c.likes?.includes(user?._id);
              const likeCount = c.likes?.length || 0;
              return (
                <div key={c._id} className="group" style={{ display: 'flex', gap: 12 }}>
                  <Link to="/users/view" state={{ id: c.userId?._id ?? c.userId }} style={{ flexShrink: 0 }}>
                    <Avatar name={fullName(author)} src={author.avatarUrl} size="sm" />
                  </Link>
                  <div style={{
                    flex: 1,
                    background: '#fef7ff',
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: '1px solid #ede9fe',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Link
                        to="/users/view"
                        state={{ id: c.userId?._id ?? c.userId }}
                        style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
                        onMouseLeave={e => e.currentTarget.style.color = '#111827'}
                      >
                        {fullName(author)}
                      </Link>
                      <span style={{ fontSize: '0.75rem', color: '#a087b0' }}>{formatRelative(c.createdAt)}</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => likeCommentMutation.mutate(c._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: isLiked ? '#fef2f2' : 'transparent',
                            color: isLiked ? '#ef4444' : '#a087b0',
                            transition: 'all 0.12s',
                          }}
                        >
                          <Heart size={12} style={{ fill: isLiked ? '#ef4444' : 'none' }} />
                          {likeCount > 0 && <span>{likeCount}</span>}
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(c._id)}
                            className="opacity-0 group-hover:opacity-100"
                            style={{
                              padding: '3px',
                              borderRadius: 6,
                              border: 'none',
                              background: 'transparent',
                              color: '#a087b0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
                          >
                            <Trash size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment input */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar name={user?.name || user?.username} src={user?.avatarUrl} size="sm" />
          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                  e.preventDefault();
                  commentMutation.mutate(comment.trim());
                }
              }}
              style={{
                flex: 1,
                background: 'white',
                border: '1px solid #ede9fe',
                borderRadius: 12,
                padding: '9px 14px',
                fontSize: '0.875rem',
                color: '#111827',
                outline: 'none',
              }}
            />
            <Button
              size="sm"
              onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
              loading={commentMutation.isPending}
              disabled={!comment.trim()}
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
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
