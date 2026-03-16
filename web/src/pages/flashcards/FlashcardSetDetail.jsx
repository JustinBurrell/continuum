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
  const [shareLoading, setShareLoading] = useState(false);

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

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const newSharedValue = !set.isShared;
      await api.patch(`/flashcard-sets/${id}/share`, { isShared: newSharedValue });
      queryClient.invalidateQueries({ queryKey: ['flashcard-set', id] });
      refetch();
    } finally {
      setShareLoading(false);
    }
  };

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
      <div className="text-center py-16">
        <p className="text-secondary">Set not found.</p>
        <Link to="/flashcards" className="text-primary text-sm hover:underline mt-2 block">Back to sets</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/flashcards">
          <button className="p-2 rounded-lg hover:bg-accent text-secondary transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{set.title}</h1>
          {set.subject && <p className="text-sm text-secondary mt-0.5">{set.subject}</p>}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          loading={shareLoading}
        >
          <Share2 size={14} />
          {set.isShared ? (
            <span className="flex items-center gap-1">
              Shared <Badge variant="success" className="ml-1 text-xs">On</Badge>
            </span>
          ) : (
            'Share'
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleAiGenerate} loading={aiLoading}>
          <Sparkles size={14} /> AI Generate
        </Button>
        <Button size="sm" onClick={() => setShowAddCard(true)}>
          <Plus size={14} /> Add card
        </Button>
        <Link to="/flashcards/study" state={{ id }}>
          <Button size="sm" variant="secondary">
            <Play size={14} /> Study
          </Button>
        </Link>
      </div>

      <p className="text-sm text-secondary mb-6">{set.flashcards?.length || 0} cards</p>

      {/* Cards grid */}
      {set.flashcards?.length === 0 ? (
        <div className="text-center py-12 text-secondary text-sm">
          No cards yet. Add cards manually or use AI Generate.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {set.flashcards?.map((card, i) => (
            <Card key={card._id || i} className="relative group">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => openEditCard(card)}
                  className="p-1 rounded hover:bg-accent text-secondary hover:text-primary transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => deleteCardMutation.mutate(card._id)}
                  className="p-1 rounded hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="mb-3 pb-3 border-b border-border">
                <p className="text-xs font-medium text-secondary mb-1">Front</p>
                <p className="text-sm font-medium text-foreground">{card.front}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-secondary mb-1">Back</p>
                <p className="text-sm text-foreground">{card.back}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add card modal */}
      <Modal open={showAddCard} onClose={() => setShowAddCard(false)} title="Add flashcard">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Front *</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Question or term..."
              value={newCard.front}
              onChange={e => setNewCard(c => ({ ...c, front: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Back *</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
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

      {/* Edit card modal */}
      <Modal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        title="Edit flashcard"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Front *</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Question or term..."
              value={editCard.front}
              onChange={e => setEditCard(c => ({ ...c, front: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Back *</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
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
