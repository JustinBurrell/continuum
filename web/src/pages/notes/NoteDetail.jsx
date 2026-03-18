import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Edit3, Trash2, ArrowLeft, Sparkles,
  MessageCircle, Send, Tag, Clock, Share2, BookOpen, Heart, Trash, Download,
} from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import ShareModal from '@/components/ui/ShareModal';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatRelative } from '@/lib/utils';

export default function NoteDetail() {
  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);

  // Flashcard generation state
  const [flashcardMsg, setFlashcardMsg] = useState('');
  const [flashcardSetId, setFlashcardSetId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => api.get(`/notes/${id}`).then(r => r.data),
  });

  // Viewing a note updates lastViewedAt on the backend (affects list sort order).
  // Invalidate the notes list on unmount so the list refetches with the correct order.
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    };
  }, []);

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['note-comments', id],
    queryFn: () => api.get(`/comments/note/${id}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      navigate('/notes');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content) => api.post('/comments', { targetType: 'note', targetId: id, content }),
    onSuccess: () => {
      setComment('');
      refetchComments();
    },
  });

  const shareNoteMutation = useMutation({
    mutationFn: (payload) => api.put(`/notes/${id}/share`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setShowShareModal(false);
    },
  });

  const generateFlashcardsMutation = useMutation({
    mutationFn: () => api.post(`/notes/${id}/flashcards/generate`),
    onSuccess: (res) => {
      const setId = res.data?.set?._id || res.data?.data?._id || res.data?._id;
      setFlashcardSetId(setId);
      setFlashcardMsg('Flashcard set created!');
      queryClient.invalidateQueries({ queryKey: ['flashcard-sets'] });
    },
    onError: (err) => {
      setFlashcardMsg(err.response?.data?.error || 'Failed to generate flashcards.');
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

  const [aiError, setAiError] = useState('');
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const handlePdfDownload = async () => {
    setPdfDownloading(true);
    try {
      const res = await api.get(`/notes/${id}/pdf`);
      window.open(res.data.downloadUrl, '_blank');
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleAiSummary = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post(`/notes/${id}/summary`);
      // Backend returns { success, note: { summary: { quickSummary, detailedSummary, ... } }, cached }
      const summary = res.data.note?.summary;
      const text = summary?.quickSummary || summary?.detailedSummary || null;
      setAiSummary(text);
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      if (!text) {
        setAiError('Summary generated but content is empty.');
      }
    } catch (err) {
      setAiError(err.response?.data?.error || 'Failed to generate summary. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // Comments: backend stores author info in comment.userSnapshot { username, firstName, lastName, avatarUrl }
  const getCommentAuthor = (c) => c.userSnapshot || {};
  const fullName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

  const note = data?.note || data?.data;
  const comments = commentsData?.comments || commentsData?.data || [];
  const isOwner = note && String(note.userId) === String(user?._id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ color: '#a087b0', marginBottom: 8 }}>Note not found.</p>
        <Link to="/notes" style={{ color: '#6b21a8', fontSize: '0.875rem', textDecoration: 'none' }}>
          Back to notes
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Link to="/notes">
          <button style={{
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
        <div style={{ flex: 1 }} />

        {isOwner && (
          <button
            onClick={() => setShowShareModal(true)}
            style={{ border: '1px solid #ede9fe', background: 'white', color: '#374151', padding: '7px 14px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Share2 size={14} />
            {note.visibility && note.visibility !== 'private' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Shared
                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                  {note.visibility === 'friends' ? 'Friends' : `${note.sharedWith?.length || 0}`}
                </span>
              </span>
            ) : 'Share'}
          </button>
        )}
        {isOwner && (
          <Link to="/notes/edit" state={{ id }}>
            <button style={{ border: '1px solid #ede9fe', background: 'white', color: '#374151', padding: '7px 14px', borderRadius: 12, fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Edit3 size={14} /> Edit
            </button>
          </Link>
        )}
        {note.pdfUrl && (
          <Button variant="outline" size="sm" onClick={handlePdfDownload} loading={pdfDownloading}>
            <Download size={14} /> PDF
          </Button>
        )}
        {isOwner && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => { if (window.confirm('Delete this note?')) deleteMutation.mutate(); }}
            loading={deleteMutation.isPending}
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      {/* Note content card */}
      <div style={{
        background: 'white',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '28px 32px',
        marginBottom: 20,
      }}>
        {/* Title + meta */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', marginBottom: 10, lineHeight: 1.3 }}>
            {note.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block',
              background: '#f5f0ff',
              color: '#6b21a8',
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              textTransform: 'capitalize',
            }}>
              {note.type || 'note'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#a087b0' }}>
              <Clock size={11} /> {formatDate(note.updatedAt)}
            </span>
          </div>
        </div>

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {note.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: '#6b21a8',
                background: '#f5f0ff',
                padding: '3px 10px',
                borderRadius: 20,
              }}>
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-sm max-w-none"
          style={{ color: '#1f2937', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>

      {/* AI Summary card */}
      <div style={{
        background: 'white',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '24px 28px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: '#6b21a8' }} /> AI Summary
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateFlashcardsMutation.mutate()}
              loading={generateFlashcardsMutation.isPending}
            >
              <BookOpen size={14} /> Generate Flashcards
            </Button>
            <button
              onClick={handleAiSummary}
              disabled={aiLoading}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#f5f0ff',
                color: '#6b21a8',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.6 : 1,
              }}
            >
              {aiLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {flashcardMsg && (
          <p style={{ fontSize: '0.75rem', marginBottom: 12, color: flashcardMsg.includes('created') ? '#16a34a' : '#ef4444' }}>
            {flashcardMsg}
            {flashcardSetId && (
              <Link to="/flashcards" style={{ marginLeft: 8, color: '#6b21a8', fontWeight: 500, textDecoration: 'none' }}>
                View flashcards
              </Link>
            )}
          </p>
        )}
        {aiError && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: 8 }}>{aiError}</p>}
        {(() => {
          const displaySummary = aiSummary
            || note?.summary?.quickSummary
            || note?.summary?.detailedSummary;
          return displaySummary ? (
            <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7 }}>{displaySummary}</p>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#a087b0' }}>
              Click "Generate" to get an AI-powered summary of this note.
            </p>
          );
        })()}
      </div>

      {/* Comments card */}
      <div style={{
        background: 'white',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '24px 28px',
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
                      <Link to="/users/view" state={{ id: c.userId?._id ?? c.userId }}
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
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
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

      {/* Share modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        currentVisibility={note.visibility || 'private'}
        currentSharedWith={note.sharedWith || []}
        onSave={(payload) => shareNoteMutation.mutate(payload)}
        saving={shareNoteMutation.isPending}
        title="Share note"
      />
    </div>
  );
}
