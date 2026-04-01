import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, X } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function StudyMode() {
  const { state } = useLocation();
  const id = state?.id;
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [done, setDone] = useState(false);
  const [sessionStreak, setSessionStreak] = useState(null);

  // Track session start time and accumulated card results via refs
  // (refs are synchronous — no React batching issue when reading at submit time)
  const startTimeRef = useRef(Date.now());
  const cardResultsRef = useRef([]);

  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn: () => api.get(`/flashcard-sets/${id}`).then(r => r.data),
  });

  const set = data?.set || data?.data;
  const cards = set?.flashcards || [];

  const submitMutation = useMutation({
    mutationFn: (payload) => api.post('/study-sessions', payload),
    onSuccess: (res) => {
      setSessionStreak(res.data?.streak ?? null);
      queryClient.invalidateQueries({ queryKey: ['study-streak'] });
      queryClient.invalidateQueries({ queryKey: ['study-sessions', id] });
    },
  });

  // Submit session when done, but only if the user marked at least one card
  useEffect(() => {
    if (!done || cardResultsRef.current.length === 0 || !id) return;
    submitMutation.mutate({
      setId: id,
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      cardResults: cardResultsRef.current,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const goNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex === cards.length - 1) {
        setDone(true);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 150);
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex === 0) return;
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(i => i - 1), 150);
  }, [currentIndex]);

  const markKnown = () => {
    const card = cards[currentIndex];
    if (card?._id) {
      cardResultsRef.current = [...cardResultsRef.current, { cardId: card._id, correct: true }];
    }
    setKnown(prev => new Set([...prev, currentIndex]));
    goNext();
  };

  const markUnknown = () => {
    const card = cards[currentIndex];
    if (card?._id) {
      cardResultsRef.current = [...cardResultsRef.current, { cardId: card._id, correct: false }];
    }
    goNext();
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown(new Set());
    setDone(false);
    setSessionStreak(null);
    startTimeRef.current = Date.now();
    cardResultsRef.current = [];
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(f => !f);
      }
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 48 }}>
        <Skeleton style={{ width: '100%', maxWidth: 560, height: 320 }} />
      </div>
    );
  }

  if (!set || cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ color: '#a087b0', marginBottom: 12 }}>No cards in this set.</p>
        <Link to="/flashcards/view" state={{ id }}>
          <button style={{
            border: '1px solid #ede9fe',
            background: 'white',
            color: '#374151',
            padding: '8px 16px',
            borderRadius: 12,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Back to set
          </button>
        </Link>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((known.size / cards.length) * 100);
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '0 16px',
      }}>
        {/* Score ring */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: pct >= 70 ? '#f0fdf4' : '#fef7ff',
          border: `4px solid ${pct >= 70 ? '#16a34a' : '#6b21a8'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <span style={{ fontSize: '1.375rem', fontWeight: 700, color: pct >= 70 ? '#16a34a' : '#6b21a8', lineHeight: 1 }}>
            {pct}%
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#a087b0', marginTop: 2 }}>score</span>
        </div>

        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Set complete!
        </h2>
        <p style={{ color: '#374151', fontSize: '0.9375rem', marginBottom: 4 }}>
          You knew {known.size} of {cards.length} cards
        </p>
        <p style={{ color: '#a087b0', fontSize: '0.875rem', marginBottom: sessionStreak >= 2 ? 16 : 32 }}>
          {pct >= 70 ? 'Great work! Keep it up.' : 'Keep studying to improve your score.'}
        </p>

        {/* Streak badge */}
        {sessionStreak >= 2 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: sessionStreak >= 7 ? '#fef9c3' : '#f5f0ff',
            border: `1px solid ${sessionStreak >= 7 ? '#fde047' : '#ede9fe'}`,
            borderRadius: 24,
            padding: '8px 18px',
            marginBottom: 32,
          }}>
            <span style={{ fontSize: '1.125rem' }}>{sessionStreak >= 7 ? '🔥' : '⚡'}</span>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
              {sessionStreak} day streak!
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={restart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 12,
              border: '1px solid #ede9fe',
              background: 'white',
              color: '#374151',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} /> Restart
          </button>
          <Link to="/flashcards/view" state={{ id }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                background: '#6b21a8',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to set
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
      {/* Nav header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link to="/flashcards/view" state={{ id }}>
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
              flexShrink: 0,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
          >
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{set.title}</h1>
            <span style={{ fontSize: '0.8125rem', color: '#a087b0', fontWeight: 500 }}>
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: '#ede9fe', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#6b21a8',
                borderRadius: 99,
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div
        style={{ perspective: '1200px', height: 320, cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setIsFlipped(f => !f)}
      >
        <div
          className={`flashcard-inner absolute inset-0 ${isFlipped ? 'flipped' : ''}`}
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          {/* Front face */}
          <div
            className="flashcard-front"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'white',
              border: '1px solid #ede9fe',
              borderRadius: 20,
              boxShadow: '0 4px 24px rgba(107,33,168,0.10)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 48px',
              textAlign: 'center',
            }}
          >
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#a087b0',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 20,
              background: '#f5f0ff',
              padding: '4px 12px',
              borderRadius: 20,
            }}>
              Question
            </span>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', lineHeight: 1.5 }}>
              {card.front}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#a087b0', marginTop: 24 }}>
              Press Space or click to reveal
            </p>
          </div>

          {/* Back face */}
          <div
            className="flashcard-back"
            style={{
              position: 'absolute',
              inset: 0,
              background: '#f5f0ff',
              border: '2px solid #6b21a8',
              borderRadius: 20,
              boxShadow: '0 4px 24px rgba(107,33,168,0.16)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 48px',
              textAlign: 'center',
            }}
          >
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#6b21a8',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 20,
              background: 'white',
              padding: '4px 12px',
              borderRadius: 20,
              border: '1px solid #ede9fe',
            }}>
              Answer
            </span>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', lineHeight: 1.5 }}>
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 12,
            border: '1px solid #ede9fe',
            background: 'white',
            color: currentIndex === 0 ? '#c4b5d4' : '#374151',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s',
          }}
        >
          <ChevronLeft size={16} /> Prev
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          {isFlipped ? (
            <>
              <button
                onClick={markUnknown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 12,
                  border: '1px solid #ede9fe',
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#ea580c'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9fe'; e.currentTarget.style.color = '#374151'; }}
              >
                <X size={14} /> Still learning
              </button>
              <button
                onClick={markKnown}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={14} /> Got it!
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsFlipped(true)}
              style={{
                padding: '9px 20px',
                borderRadius: 12,
                border: '1px solid #6b21a8',
                background: '#f5f0ff',
                color: '#6b21a8',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6b21a8'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#6b21a8'; }}
            >
              Reveal answer
            </button>
          )}
        </div>

        <button
          onClick={goNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 12,
            border: '1px solid #ede9fe',
            background: 'white',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b21a8'; e.currentTarget.style.color = '#6b21a8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede9fe'; e.currentTarget.style.color = '#374151'; }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* Status line */}
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#a087b0', marginTop: 20 }}>
        <span style={{ color: '#16a34a', fontWeight: 500 }}>{known.size} known</span>
        {' · '}
        {cards.length - currentIndex - 1} remaining
      </p>
    </div>
  );
}
