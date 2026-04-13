import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative } from '@/lib/utils';

export default function FlashcardHistory() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['study-sessions-all', page],
    queryFn: () => api.get('/study-sessions', { params: { page, limit } }).then(r => r.data),
    staleTime: 60_000,
  });

  const { data: streakData } = useQuery({
    queryKey: ['study-streak'],
    queryFn: () => api.get('/study-sessions/streak').then(r => r.data),
    staleTime: 300_000,
  });

  const sessions = historyData?.sessions || [];
  const total = historyData?.total || 0;
  const streak = streakData?.streak ?? 0;
  const totalPages = Math.ceil(total / limit);

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : null;
  const totalCards = sessions.reduce((sum, s) => sum + s.totalCards, 0);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
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
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          Study History
        </h1>
      </div>

      {/* Streak + summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {streak >= 1 && (
          <div style={{
            flex: '1 1 160px',
            background: streak >= 7 ? '#fef9c3' : '#f5f0ff',
            border: `1px solid ${streak >= 7 ? '#fde047' : '#ede9fe'}`,
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: '1.5rem' }}>{streak >= 7 ? '🔥' : '⚡'}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0, lineHeight: 1 }}>{streak}</p>
              <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: '2px 0 0' }}>day streak</p>
            </div>
          </div>
        )}
        <div style={{
          flex: '1 1 120px',
          background: 'white',
          border: '1px solid #ede9fe',
          borderRadius: 14,
          padding: '14px 18px',
        }}>
          <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0, lineHeight: 1 }}>{total}</p>
          <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: '2px 0 0' }}>total sessions</p>
        </div>
        {avgScore !== null && (
          <div style={{
            flex: '1 1 120px',
            background: 'white',
            border: '1px solid #ede9fe',
            borderRadius: 14,
            padding: '14px 18px',
          }}>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0, lineHeight: 1 }}>{avgScore}%</p>
            <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: '2px 0 0' }}>avg score</p>
          </div>
        )}
        {totalCards > 0 && (
          <div style={{
            flex: '1 1 120px',
            background: 'white',
            border: '1px solid #ede9fe',
            borderRadius: 14,
            padding: '14px 18px',
          }}>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0, lineHeight: 1 }}>{totalCards}</p>
            <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: '2px 0 0' }}>cards studied</p>
          </div>
        )}
      </div>

      {/* Session list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
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
            <BookOpen size={22} style={{ color: '#6b21a8' }} />
          </div>
          <p style={{ color: '#a087b0', fontSize: '0.875rem' }}>
            No study sessions yet. Go study a set to get started!
          </p>
          <Link to="/flashcards" style={{ color: '#6b21a8', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>
            Browse sets
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map(session => (
            <HistoryRow key={session._id} session={session} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: '1px solid #ede9fe',
              background: 'white',
              color: page === 1 ? '#c4b5d4' : '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.875rem', color: '#a087b0' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: '1px solid #ede9fe',
              background: 'white',
              color: page === totalPages ? '#c4b5d4' : '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ session }) {
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
  const setId = typeof session.setId === 'object' && session.setId?._id != null
    ? session.setId._id
    : session.setId;
  const setTitle = session.setTitle ?? session.setId?.title ?? 'Deleted set';
  const hasSetLink = !!setId && (session.setTitle != null || session.setId?.title != null);

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${expanded ? '#6b21a8' : '#ede9fe'}`,
      borderRadius: 14,
      boxShadow: '0 1px 4px rgba(107,33,168,0.04)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Summary row */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasSetLink ? (
            <Link
              to="/flashcards/view"
              state={{ id: setId }}
              onClick={e => e.stopPropagation()}
              style={{ textDecoration: 'none' }}
            >
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#6b21a8',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  maxWidth: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                {setTitle}
              </p>
            </Link>
          ) : (
            <p style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#111827',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {setTitle}
            </p>
          )}
          <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: '3px 0 0' }}>
            {session.correctCount}/{session.totalCards} correct &middot; {duration} &middot; {formatRelative(session.completedAt)}
          </p>
        </div>
        <div style={{
          flexShrink: 0,
          background: scoreBg,
          color: scoreColor,
          fontWeight: 700,
          fontSize: '0.9375rem',
          padding: '4px 12px',
          borderRadius: 20,
          border: `1px solid ${scoreColor}22`,
        }}>
          {session.score}%
        </div>
        <div style={{ flexShrink: 0, color: '#a087b0', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded card-by-card breakdown */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #ede9fe',
          padding: '12px 18px 16px',
          background: '#faf8ff',
        }}>
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
