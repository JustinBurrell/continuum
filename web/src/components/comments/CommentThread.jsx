import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageCircle, Heart, Trash, Send } from 'lucide-react';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const getAuthor = (c) => c.userSnapshot || {};
const fullName = (u) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

export default function CommentThread({ targetType, targetId, user, isDemo }) {
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { commentId, username } | null
  const [expandedReplies, setExpandedReplies] = useState({}); // { [commentId]: bool }
  const inputRef = useRef(null);

  const { data, refetch } = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => api.get(`/comments/${targetType}/${targetId}`).then(r => r.data),
    enabled: !!targetId,
  });

  const allComments = data?.comments || [];
  const commentMap = new Map(allComments.map(c => [c._id, c]));
  const topLevel = allComments.filter(c => !c.parentId);
  const repliesByParent = allComments.reduce((acc, c) => {
    if (c.parentId) {
      (acc[c.parentId] ??= []).push(c);
    }
    return acc;
  }, {});
  const orphaned = allComments.filter(c => c.parentId && !commentMap.has(c.parentId));

  // Group orphaned replies by their (missing) parentId
  const orphanedByParent = orphaned.reduce((acc, c) => {
    (acc[c.parentId] ??= []).push(c);
    return acc;
  }, {});
  const orphanedParentIds = Object.keys(orphanedByParent);

  const addMutation = useMutation({
    mutationFn: ({ content, parentId }) =>
      api.post('/comments', {
        targetType,
        targetId,
        content,
        ...(parentId ? { parentId } : {}),
      }),
    onSuccess: () => {
      setCommentText('');
      setReplyTo(null);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => refetch(),
  });

  const likeMutation = useMutation({
    mutationFn: (commentId) => api.post(`/comments/${commentId}/like`),
    onSuccess: () => refetch(),
  });

  const handleSubmit = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addMutation.mutate({ content: trimmed, parentId: replyTo?.commentId });
  };

  const handleReplyClick = (comment) => {
    const username = comment.userSnapshot?.username || 'user';
    setReplyTo({ commentId: comment._id, username });
    setCommentText(`@${username} `);
    inputRef.current?.focus();
  };

  const renderCommentRow = (c, isReply = false) => {
    const author = getAuthor(c);
    const isOwn = c.userId === user?._id || c.userId?._id === user?._id;
    const isLiked = c.likes?.includes(user?._id);
    const likeCount = c.likes?.length || 0;

    return (
      <div key={c._id} className="group" style={{ display: 'flex', gap: 12 }}>
        <Link
          to="/users/view"
          state={{ id: c.userId?._id ?? c.userId }}
          style={{ flexShrink: 0 }}
        >
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Link
                to="/users/view"
                state={{ id: c.userId?._id ?? c.userId }}
                style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#6b21a8'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#111827'; }}
              >
                {fullName(author)}
              </Link>
              <VerifiedBadge roles={c.userSnapshot?.roles} />
            </span>
            <span style={{ fontSize: '0.75rem', color: '#a087b0' }}>{formatRelative(c.createdAt)}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => likeMutation.mutate(c._id)}
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
              {!isReply && !isDemo && (
                <button
                  onClick={() => handleReplyClick(c)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#a087b0',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6b21a8'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#a087b0'; }}
                >
                  Reply
                </button>
              )}
              {isOwn && !isDemo && (
                <button
                  onClick={() => deleteMutation.mutate(c._id)}
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
  };

  const renderReplies = (parentId) => {
    const replies = repliesByParent[parentId] || [];
    if (replies.length === 0) return null;
    const isExpanded = expandedReplies[parentId];
    const collapsed = replies.length >= 3 && !isExpanded;

    return (
      <div style={{ marginLeft: 44, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {collapsed && (
          <button
            onClick={() => setExpandedReplies(p => ({ ...p, [parentId]: true }))}
            style={{
              fontSize: '0.8125rem',
              color: '#6b21a8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              fontWeight: 500,
            }}
          >
            View {replies.length} replies
          </button>
        )}
        {!collapsed && replies.map(reply => (
          <div key={reply._id} style={{ borderLeft: '2px solid #ede9fe', paddingLeft: 12 }}>
            {renderCommentRow(reply, true)}
          </div>
        ))}
        {isExpanded && replies.length >= 3 && (
          <button
            onClick={() => setExpandedReplies(p => ({ ...p, [parentId]: false }))}
            style={{
              fontSize: '0.8125rem',
              color: '#a087b0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
            }}
          >
            Hide replies
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 style={{
        fontWeight: 600,
        color: '#111827',
        fontSize: '0.9375rem',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
      }}>
        <MessageCircle size={16} style={{ color: '#6b21a8' }} />
        Comments ({allComments.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {topLevel.length === 0 && orphanedParentIds.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#a087b0' }}>
            No comments yet. Be the first to comment.
          </p>
        ) : (
          <>
            {topLevel.map(c => (
              <div key={c._id}>
                {renderCommentRow(c, false)}
                {renderReplies(c._id)}
              </div>
            ))}

            {/* Orphaned replies — parent was soft-deleted */}
            {orphanedParentIds.map(parentId => (
              <div key={`orphan-${parentId}`}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 28, flexShrink: 0 }} />
                  <div style={{
                    flex: 1,
                    background: '#fafafa',
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: '1px solid #ede9fe',
                  }}>
                    <p style={{ fontSize: '0.8125rem', color: '#a087b0', fontStyle: 'italic' }}>
                      [Comment deleted]
                    </p>
                  </div>
                </div>
                <div style={{ marginLeft: 44, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {orphanedByParent[parentId].map(reply => (
                    <div key={reply._id} style={{ borderLeft: '2px solid #ede9fe', paddingLeft: 12 }}>
                      {renderCommentRow(reply, true)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {!isDemo && (
        <div>
          {replyTo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8125rem',
              color: '#6b21a8',
              background: '#f5f0ff',
              borderRadius: 8,
              padding: '6px 12px',
              marginBottom: 8,
            }}>
              <span>Replying to @{replyTo.username}</span>
              <button
                onClick={() => { setReplyTo(null); setCommentText(''); }}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a087b0',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                x
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar name={fullName(user)} src={user?.avatarUrl} size="sm" />
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Write a comment...'}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                    e.preventDefault();
                    handleSubmit();
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
                onClick={handleSubmit}
                loading={addMutation.isPending}
                disabled={!commentText.trim()}
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
