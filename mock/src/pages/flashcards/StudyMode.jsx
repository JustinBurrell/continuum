import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function StudyMode() {
  const { state } = useLocation();
  const id = state?.id;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [done, setDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['flashcard-set', id],
    queryFn: () => api.get(`/flashcard-sets/${id}`).then(r => r.data),
  });

  const set = data?.set || data?.data;
  const cards = set?.flashcards || [];

  const trackProgress = useCallback((cardId, correct) => {
    api.put(`/flashcard-sets/${id}/cards/${cardId}/progress`, { correct }).catch(() => {});
  }, [id]);

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
    setKnown(prev => new Set([...prev, currentIndex]));
    if (card?._id) trackProgress(card._id, true);
    goNext();
  };

  const markUnknown = () => {
    const card = cards[currentIndex];
    if (card?._id) trackProgress(card._id, false);
    goNext();
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown(new Set());
    setDone(false);
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
      <div className="flex flex-col items-center gap-6 pt-12">
        <Skeleton className="w-full max-w-lg h-64" />
      </div>
    );
  }

  if (!set || cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary mb-3">No cards in this set.</p>
        <Link to="/flashcards/view" state={{ id }}>
          <Button size="sm" variant="outline">Back to set</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Set complete!</h2>
        <p className="text-secondary mb-1">
          You knew {known.size} of {cards.length} cards
        </p>
        <p className="text-secondary text-sm mb-8">
          {Math.round((known.size / cards.length) * 100)}% mastered
        </p>
        <div className="flex gap-3">
          <Button onClick={restart} variant="outline">
            <RotateCcw size={15} /> Restart
          </Button>
          <Link to="/flashcards/view" state={{ id }}>
            <Button>Back to set</Button>
          </Link>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Nav header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/flashcards/view" state={{ id }}>
          <button className="p-2 rounded-lg hover:bg-accent text-secondary transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg text-foreground">{set.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-secondary whitespace-nowrap">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ perspective: '1000px', height: '280px' }}
        onClick={() => setIsFlipped(f => !f)}
      >
        <div className={`flashcard-inner absolute inset-0 ${isFlipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-front absolute inset-0 bg-card rounded-2xl border border-border shadow-card-hover flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs font-medium text-secondary uppercase tracking-wider mb-4">Question</p>
            <p className="text-xl font-semibold text-foreground">{card.front}</p>
            <p className="text-xs text-secondary mt-6">Press Space or click to flip</p>
          </div>
          {/* Back */}
          <div className="flashcard-back absolute inset-0 bg-primary/5 border-2 border-primary/30 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-4">Answer</p>
            <p className="text-xl font-semibold text-foreground">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft size={16} /> Prev
        </Button>

        {isFlipped ? (
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={markUnknown}>
              Still learning
            </Button>
            <Button size="sm" onClick={markKnown} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 size={14} /> Got it!
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsFlipped(true)}>
            Reveal answer
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={goNext}>
          Next <ChevronRight size={16} />
        </Button>
      </div>

      <p className="text-center text-xs text-secondary mt-6">
        {known.size} known · {cards.length - currentIndex - 1} remaining
      </p>
    </div>
  );
}
