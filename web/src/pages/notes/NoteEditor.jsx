import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';
import { ArrowLeft, Save, X } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import NoteToolbar from './NoteToolbar';

const NOTE_TYPES = ['general', 'lecture', 'research', 'todo', 'journal'];

export default function NoteEditor() {
  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    type: 'general',
    tags: '',
    isPublic: false,
  });

  const [editorTick, setEditorTick] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: () => setEditorTick(t => t + 1),
    onSelectionUpdate: () => setEditorTick(t => t + 1),
    editorProps: {
      attributes: {
        style: 'min-height:400px; padding:14px 16px; outline:none; font-size:0.9rem; line-height:1.7; color:#111827; font-family:inherit;',
      },
    },
  });

  const { data } = useQuery({
    queryKey: ['note', id],
    queryFn: () => api.get(`/notes/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    const note = data?.note || data?.data;
    if (note && editor) {
      setForm({
        title: note.title || '',
        type: note.type || 'general',
        tags: note.tags?.join(', ') || '',
        isPublic: note.isPublic || false,
      });

      let htmlContent = note.content || '';
      if (note.contentType !== 'html' && htmlContent) {
        htmlContent = marked.parse(htmlContent);
      }
      editor.commands.setContent(htmlContent);
    }
  }, [data, editor]);

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
    if (!form.title.trim() || !editor) return;
    const payload = {
      title: form.title.trim(),
      content: editor.getHTML(),
      contentType: 'html',
      type: form.type,
      tags: form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      isPublic: form.isPublic,
    };
    saveMutation.mutate(payload);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Link to={isEdit ? '/notes/view' : '/notes'} state={isEdit ? { id } : undefined}>
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
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#111827', flex: 1 }}>
          {isEdit ? 'Edit note' : 'New note'}
        </h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: '1px solid #ede9fe',
            background: 'white',
            color: '#374151',
            padding: '7px 14px',
            borderRadius: 12,
            fontSize: '0.8125rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <X size={14} /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!form.title.trim() || saveMutation.isPending}
          style={{
            background: '#6b21a8',
            color: 'white',
            padding: '7px 16px',
            borderRadius: 12,
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: !form.title.trim() || saveMutation.isPending ? 'not-allowed' : 'pointer',
            opacity: !form.title.trim() || saveMutation.isPending ? 0.6 : 1,
            border: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Editor card */}
      <div style={{
        background: 'white',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '28px 32px',
      }}>
        {/* Title input */}
        <div style={{ marginBottom: 24, borderBottom: '1px solid #ede9fe', paddingBottom: 20 }}>
          <input
            type="text"
            placeholder="Note title..."
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            style={{
              width: '100%',
              fontSize: '1.5rem',
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#111827',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          {/* Type select */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#a087b0', marginBottom: 6 }}>
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
              style={{
                background: 'white',
                border: '1px solid #ede9fe',
                borderRadius: 10,
                padding: '7px 28px 7px 12px',
                fontSize: '0.8125rem',
                color: '#111827',
                outline: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {NOTE_TYPES.map(t => (
                <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#a087b0', marginBottom: 6 }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="math, calculus, midterm..."
              value={form.tags}
              onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid #ede9fe',
                borderRadius: 10,
                padding: '7px 12px',
                fontSize: '0.8125rem',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Public toggle */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8125rem', color: '#374151' }}>
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                style={{ accentColor: '#6b21a8', width: 15, height: 15 }}
              />
              Public note
            </label>
          </div>
        </div>

        {/* Rich text editor */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#a087b0', marginBottom: 8 }}>
            Content
          </label>
          <div
            style={{
              border: '1px solid #ede9fe',
              borderRadius: 12,
              background: '#fef7ff',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#6b21a8'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#ede9fe'}
          >
            <NoteToolbar editor={editor} editorTick={editorTick} />
            <EditorContent editor={editor} />
          </div>
        </div>

        {saveMutation.isError && (
          <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: 12 }}>
            {saveMutation.error?.response?.data?.error || 'Failed to save note.'}
          </p>
        )}
      </div>
    </div>
  );
}
