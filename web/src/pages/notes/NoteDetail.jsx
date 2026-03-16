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
  const [shareVisibility, setShareVisibility] = useState('friends');
  const [shareMsg, setShareMsg] = useState('');

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
      setShareMsg('Visibility updated!');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', id] });
    },
    onError: (err) => {
      setShareMsg(err.response?.data?.error || 'Failed to share note.');
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary">Note not found.</p>
        <Link to="/notes" className="text-primary hover:underline text-sm mt-2 block">
          Back to notes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/notes">
          <button className="p-2 rounded-lg hover:bg-accent text-secondary hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setShowShareModal(true); setShareMsg(''); }}
        >
          <Share2 size={14} /> Share
        </Button>
        <Link to="/notes/edit" state={{ id }}>
          <Button variant="outline" size="sm">
            <Edit3 size={14} /> Edit
          </Button>
        </Link>
        {note.pdfUrl && (
          <Button variant="outline" size="sm" onClick={handlePdfDownload} loading={pdfDownloading}>
            <Download size={14} /> PDF
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={() => { if (window.confirm('Delete this note?')) deleteMutation.mutate(); }}
          loading={deleteMutation.isPending}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Note content */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{note.title}</h1>
            <div className="flex items-center gap-3 text-xs text-secondary">
              <Badge variant="primary" className="capitalize">{note.type || 'note'}</Badge>
              <span className="flex items-center gap-1">
                <Clock size={11} /> {formatDate(note.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs text-secondary bg-accent px-2 py-0.5 rounded-full">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </Card>

      {/* AI Summary */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> AI Summary
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateFlashcardsMutation.mutate()}
              loading={generateFlashcardsMutation.isPending}
            >
              <BookOpen size={14} /> Generate Flashcards
            </Button>
            <Button size="sm" variant="ghost" onClick={handleAiSummary} loading={aiLoading}>
              Generate
            </Button>
          </div>
        </div>
        {flashcardMsg && (
          <p className={`text-xs mb-3 ${flashcardMsg.includes('created') ? 'text-green-600' : 'text-red-500'}`}>
            {flashcardMsg}
            {flashcardSetId && (
              <Link to="/flashcards" className="ml-2 text-primary hover:underline font-medium">
                View flashcards
              </Link>
            )}
          </p>
        )}
        {aiError && <p className="text-xs text-red-500 mb-2">{aiError}</p>}
        {(() => {
          const displaySummary = aiSummary
            || note?.summary?.quickSummary
            || note?.summary?.detailedSummary;
          return displaySummary ? (
            <p className="text-sm text-foreground/80 leading-relaxed">{displaySummary}</p>
          ) : (
            <p className="text-sm text-secondary">
              Click "Generate" to get an AI-powered summary of this note.
            </p>
          );
        })()}
      </Card>

      {/* Comments */}
      <Card>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" /> Comments ({comments.length})
        </h3>

        <div className="space-y-4 mb-5">
          {comments.length === 0 ? (
            <p className="text-sm text-secondary">No comments yet. Be the first to comment.</p>
          ) : (
            comments.map(c => {
              const author = getCommentAuthor(c);
              const isOwn = c.userId === user?._id || c.userId?._id === user?._id;
              const isLiked = c.likes?.includes(user?._id);
              const likeCount = c.likes?.length || 0;
              return (
                <div key={c._id} className="flex gap-3 group">
                  <Link to="/users/view" state={{ id: c.userId?._id ?? c.userId }} className="flex-shrink-0">
                    <Avatar name={fullName(author)} src={author.avatarUrl} size="sm" className="hover:opacity-80 transition-opacity" />
                  </Link>
                  <div className="flex-1 bg-accent rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to="/users/view" state={{ id: c.userId?._id ?? c.userId }} className="text-xs font-semibold text-foreground hover:text-primary transition-colors">
                        {fullName(author)}
                      </Link>
                      <span className="text-xs text-secondary">{formatRelative(c.createdAt)}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <button
                          onClick={() => likeCommentMutation.mutate(c._id)}
                          className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md transition-colors ${
                            isLiked
                              ? 'text-red-500 bg-red-50'
                              : 'text-secondary hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart size={12} className={isLiked ? 'fill-current' : ''} />
                          {likeCount > 0 && <span>{likeCount}</span>}
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(c._id)}
                            className="p-1 rounded-md text-secondary hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{c.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment input */}
        <div className="flex gap-3">
          <Avatar name={user?.name || user?.username} src={user?.avatar} size="sm" />
          <div className="flex-1 flex gap-2">
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
              className="input-field flex-1"
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
      </Card>

      {/* Share modal */}
      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="Share note">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Who can see this note?
            </label>
            <select
              className="input-field"
              value={shareVisibility}
              onChange={e => { setShareVisibility(e.target.value); setShareMsg(''); }}
            >
              <option value="private">Private — only you</option>
              <option value="friends">Friends — all your friends</option>
            </select>
          </div>
          {shareMsg && (
            <p className={`text-xs ${shareMsg.includes('updated') ? 'text-green-600' : 'text-red-500'}`}>
              {shareMsg}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowShareModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => shareNoteMutation.mutate({ visibility: shareVisibility })}
              loading={shareNoteMutation.isPending}
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
