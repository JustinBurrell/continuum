import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, X } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const NOTE_TYPES = ['general', 'lecture', 'research', 'todo', 'journal'];

export default function NoteEditor() {
  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'general',
    tags: '',
    isPublic: false,
  });

  const { data } = useQuery({
    queryKey: ['note', id],
    queryFn: () => api.get(`/notes/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    const note = data?.note || data?.data;
    if (note) {
      setForm({
        title: note.title || '',
        content: note.content || '',
        type: note.type || 'general',
        tags: note.tags?.join(', ') || '',
        isPublic: note.isPublic || false,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? api.put(`/notes/${id}`, payload)
        : api.post('/notes', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      const noteId = res.data?.note?._id || res.data?.data?._id || id;
      navigate(noteId ? '/notes/view' : '/notes', noteId ? { state: { id: noteId } } : undefined);
    },
  });

  const handleSave = () => {
    const payload = {
      title: form.title.trim(),
      content: form.content,
      type: form.type,
      tags: form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      isPublic: form.isPublic,
    };
    if (!payload.title) return;
    saveMutation.mutate(payload);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={isEdit ? '/notes/view' : '/notes'} state={isEdit ? { id } : undefined}>
          <button className="p-2 rounded-lg hover:bg-accent text-secondary hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="font-bold text-xl text-foreground flex-1">
          {isEdit ? 'Edit note' : 'New note'}
        </h1>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <X size={14} /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} loading={saveMutation.isPending} disabled={!form.title.trim()}>
          <Save size={14} /> Save
        </Button>
      </div>

      <Card className="space-y-5">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Note title..."
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-secondary/50 pb-2 border-b border-border"
          />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
              className="input-field py-1.5 text-xs w-auto pr-8"
            >
              {NOTE_TYPES.map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-secondary mb-1">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="math, calculus, midterm..."
              value={form.tags}
              onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              className="input-field py-1.5 text-xs"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                className="accent-primary"
              />
              Public note
            </label>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">Content</label>
          <textarea
            placeholder="Start writing your note..."
            value={form.content}
            onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
            className="input-field min-h-[400px] resize-y font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-secondary mt-1">
            HTML is supported. For a rich editor, the backend stores HTML content.
          </p>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-red-500">
            {saveMutation.error?.response?.data?.error || 'Failed to save note.'}
          </p>
        )}
      </Card>
    </div>
  );
}
