import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Heart, Trash, Send } from 'lucide-react';
import api from '@/lib/api';
import AppAvatar from '@/components/ui/AppAvatar';
import Button from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const getAuthor = (c) => c.userSnapshot || {};
const fullName = (u) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

export default function CommentThread({ targetType, targetId, user, isDemo, scrollToCommentId }) {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { commentId, username } | null
  const [expandedReplies, setExpandedReplies] = useState({}); // { [commentId]: bool }
  const [mentionQuery, setMentionQuery] = useState(null); // null = no active @mention
  const [mentionStart, setMentionStart] = useState(0);   // char index where @ began
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => api.get(`/comments/${targetType}/${targetId}`).then(r => r.data),
    enabled: !!targetId,
  });

  const allComments = data?.comments || [];
  const commentMap = new Map(allComments.map(c => [c._id, c]));
  const topLevel = allComments.filter(c => !c.parentId);

  useEffect(() => {
    if (!scrollToCommentId || !data) return;
    const el = document.getElementById(`comment-${scrollToCommentId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'background 0.3s';
    el.style.background = 'rgba(107,33,168,0.08)';
    setTimeout(() => { el.style.background = 'transparent'; }, 1800);
  }, [scrollToCommentId, data]);
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

  const invalidateComments = () =>
    queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });

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
      invalidateComments();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => invalidateComments(),
  });

  const likeMutation = useMutation({
    mutationFn: (commentId) => api.post(`/comments/${commentId}/like`),
    onSuccess: () => invalidateComments(),
  });

  const { data: mentionData } = useQuery({
    queryKey: ['mention-search', mentionQuery],
    queryFn: () => {
      const params = { friendsOnly: 'true' };
      if (mentionQuery) params.q = mentionQuery;
      return api.get('/users/search', { params }).then(r => r.data);
    },
    enabled: mentionQuery !== null, // show immediately on @, no minimum
    staleTime: 10000,
  });
  const mentionSuggestions = mentionData?.users || [];

  const handleSubmit = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addMutation.mutate({ content: trimmed, parentId: replyTo?.commentId });
  };

  const handleReplyClick = (comment) => {
    const username = comment.userSnapshot?.username || 'user';
    setReplyTo({ commentId: comment._id, username });
    setCommentText(`@${username} `);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleMentionInputChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const m = before.match(/@([a-zA-Z0-9_]*)$/);
    if (m) {
      setMentionQuery(m[1]);
      setMentionStart(m.index);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (user) => {
    const cursor = inputRef.current?.selectionStart ?? commentText.length;
    const before = commentText.slice(0, mentionStart);
    const after = commentText.slice(cursor);
    const inserted = `@${user.username} `;
    setCommentText(`${before}${inserted}${after}`);
    setMentionQuery(null);
    setTimeout(() => {
      const pos = mentionStart + inserted.length;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const renderContent = (content) => {
    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
    if (parts.length === 1) return content;
    return parts.map((part, i) => {
      if (/^@[a-zA-Z0-9_]+$/.test(part)) {
        const username = part.slice(1);
        return (
          <span
            key={i}
            onClick={async e => {
              e.stopPropagation();
              try {
                const { data } = await api.get('/users/search', { params: { exactUsername: username } });
                const match = data.users?.[0];
                if (match) navigate('/users/view', { state: { id: match._id } });
              } catch (_) {}
            }}
            style={{ color: '#6b21a8', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderCommentRow = (c, isReply = false) => {
    const author = getAuthor(c);
    const isOwn = c.userId === user?._id || c.userId?._id === user?._id;
    const isLiked = c.likes?.includes(user?._id);
    const likeCount = c.likes?.length || 0;

    return (
      <div key={c._id} id={`comment-${c._id}`} className="group" style={{ display: 'flex', gap: 12, borderRadius: 8, padding: '4px 0', transition: 'background 0.3s' }}>
        <Link
          to="/users/view"
          state={{ id: c.userId?._id ?? c.userId }}
          style={{ flexShrink: 0 }}
        >
          <AppAvatar name={fullName(author)} src={author.avatarUrl} size="sm" />
        </Link>
        <div style={{
          flex: 1,
          background: '#F8F9FA',
          borderRadius: 12,
          padding: '10px 14px',
          border: '1px solid #E5E7EB',
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
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{formatRelative(c.createdAt)}</span>
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
                  color: isLiked ? '#ef4444' : '#9CA3AF',
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
                    color: '#9CA3AF',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6b21a8'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; }}
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
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  <Trash size={12} />
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: 1.5 }}>{renderContent(c.content)}</p>
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
          <div key={reply._id} style={{ borderLeft: '2px solid #E5E7EB', paddingLeft: 12 }}>
            {renderCommentRow(reply, true)}
          </div>
        ))}
        {isExpanded && replies.length >= 3 && (
          <button
            onClick={() => setExpandedReplies(p => ({ ...p, [parentId]: false }))}
            style={{
              fontSize: '0.8125rem',
              color: '#9CA3AF',
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
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
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
                    border: '1px solid #E5E7EB',
                  }}>
                    <p style={{ fontSize: '0.8125rem', color: '#6B7280', fontStyle: 'italic' }}>
                      [Comment deleted]
                    </p>
                  </div>
                </div>
                <div style={{ marginLeft: 44, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {orphanedByParent[parentId].map(reply => (
                    <div key={reply._id} style={{ borderLeft: '2px solid #E5E7EB', paddingLeft: 12 }}>
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
              background: 'rgba(107,33,168,0.08)',
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
                  color: '#9CA3AF',
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
            <AppAvatar name={fullName(user)} src={user?.avatarUrl} size="sm" />
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                {mentionSuggestions.length > 0 && mentionQuery !== null && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 200,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {mentionSuggestions.map(u => (
                      <div
                        key={u._id}
                        onMouseDown={e => { e.preventDefault(); handleSelectMention(u); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F9F5FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <AppAvatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
                            {u.firstName} {u.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>@{u.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Write a comment...'}
                  value={commentText}
                  onChange={handleMentionInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { setMentionQuery(null); return; }
                    if (e.key === 'Enter' && !e.shiftKey && commentText.trim() && !mentionQuery) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
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
                />
              </div>
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
