import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Tag, Trash2, Edit3, FileText, Upload, ExternalLink, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { formatRelative, truncate, stripHtml } from '@/lib/utils';

const NOTE_TYPES = ['all', 'general', 'lecture', 'research', 'todo', 'journal'];

export default function NotesList() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sharedTab, setSharedTab] = useState(false);

  // Import modal state — Google Drive file picker OR local PDF upload
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState('drive'); // 'drive' | 'upload'
  const [importError, setImportError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);  // { id, name, webViewLink }
  const [driveSearch, setDriveSearch] = useState('');
  // Local upload state
  const [uploadFile, setUploadFile] = useState(null);     // File object
  const [uploadTitle, setUploadTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: sharedTab ? ['notes-shared'] : ['notes', { search, type }],
    queryFn: () => {
      if (sharedTab) {
        return api.get('/notes/shared').then(r => r.data);
      }
      return api
        .get('/notes', {
          params: {
            ...(search && { search }),
            ...(type !== 'all' && { type }),
          },
        })
        .then(r => r.data);
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const { data: driveData, isLoading: driveLoading } = useQuery({
    queryKey: ['google-drive-files'],
    queryFn: () => api.get('/google/files').then(r => r.data),
    enabled: showImport && !!user?.googleId,
  });

  const importMutation = useMutation({
    mutationFn: (payload) => api.post('/notes/import', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setShowImport(false);
      setSelectedFile(null);
      setDriveSearch('');
      setImportError('');
    },
    onError: (err) => {
      setImportError(err.response?.data?.error || 'Import failed.');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, title }) => {
      const form = new FormData();
      form.append('file', file);
      if (title) form.append('title', title);
      return api.post('/notes/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setShowImport(false);
      setUploadFile(null);
      setUploadTitle('');
      setImportError('');
    },
    onError: (err) => {
      setImportError(err.response?.data?.error || 'Upload failed.');
    },
  });

  const notes = data?.notes || data?.data || [];
  const driveFiles = (driveData?.files || driveData?.data || []).filter(f =>
    f.name?.toLowerCase().includes(driveSearch.toLowerCase())
  );

  const handleImport = () => {
    if (!selectedFile) return;
    importMutation.mutate({
      googleDocId: selectedFile.id,
      googleDocUrl: selectedFile.webViewLink,
      title: selectedFile.name,
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="text-secondary text-sm mt-0.5">{data?.pagination?.total ?? notes.length} notes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setShowImport(true); setImportError(''); }}>
            <Upload size={16} /> Import
          </Button>
          <Link to="/notes/new">
            <Button>
              <Plus size={16} /> New note
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            disabled={sharedTab}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Shared with me toggle */}
          <button
            onClick={() => setSharedTab(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sharedTab
                ? 'bg-primary text-white'
                : 'bg-accent text-foreground/70 hover:text-primary'
            }`}
          >
            Shared with me
          </button>

          {!sharedTab && NOTE_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                type === t
                  ? 'bg-primary text-white'
                  : 'bg-accent text-foreground/70 hover:text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto mb-3 text-secondary/40" />
          <h3 className="font-semibold text-foreground mb-1">No notes found</h3>
          <p className="text-secondary text-sm mb-4">
            {sharedTab
              ? 'No notes have been shared with you yet.'
              : search || type !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Start capturing your thoughts and ideas.'}
          </p>
          {!sharedTab && !search && type === 'all' && (
            <Link to="/notes/new">
              <Button size="sm">Create your first note</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <NoteCard
              key={note._id}
              note={note}
              onDelete={sharedTab ? null : () => {
                if (window.confirm('Delete this note?')) {
                  deleteMutation.mutate(note._id);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Import modal */}
      <Modal
        open={showImport}
        onClose={() => {
          setShowImport(false);
          setSelectedFile(null);
          setDriveSearch('');
          setUploadFile(null);
          setUploadTitle('');
          setImportError('');
        }}
        title="Import note"
      >
        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--bg-accent)' }}>
          {['drive', 'upload'].map(tab => (
            <button
              key={tab}
              onClick={() => { setImportTab(tab); setImportError(''); }}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: importTab === tab ? 'var(--bg-card)' : 'transparent',
                color: importTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: importTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab === 'drive' ? 'Google Drive' : 'Upload PDF'}
            </button>
          ))}
        </div>

        {/* Google Drive tab */}
        {importTab === 'drive' && (
          !user?.googleId ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Connect your Google account to import documents from Drive.
              </p>
              <a
                href="/profile"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: 'var(--primary)' }}
              >
                <ExternalLink size={13} /> Go to Profile to connect
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  className="input-field pl-9"
                  placeholder="Search your Google Docs..."
                  value={driveSearch}
                  onChange={e => setDriveSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {driveLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)
                ) : driveFiles.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                    {driveSearch ? 'No docs match your search.' : 'No Google Docs found in your Drive.'}
                  </p>
                ) : (
                  driveFiles.map(file => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                      style={{
                        background: selectedFile?.id === file.id ? 'var(--primary-bg)' : 'transparent',
                        border: selectedFile?.id === file.id ? '1px solid var(--primary)' : '1px solid transparent',
                      }}
                      onMouseEnter={e => { if (selectedFile?.id !== file.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (selectedFile?.id !== file.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <FileText size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="ml-auto flex-shrink-0"
                      >
                        <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} />
                      </a>
                    </button>
                  ))
                )}
              </div>
              {importError && <p className="text-xs" style={{ color: 'var(--destructive)' }}>{importError}</p>}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowImport(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleImport}
                  loading={importMutation.isPending}
                  disabled={!selectedFile}
                  className="flex-1"
                >
                  Import
                </Button>
              </div>
            </div>
          )
        )}

        {/* Upload PDF tab */}
        {importTab === 'upload' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Title (optional — defaults to filename)
              </label>
              <input
                className="input-field"
                placeholder="Note title..."
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                PDF file
              </label>
              <label
                className="flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors py-8"
                style={{
                  borderColor: uploadFile ? 'var(--primary)' : 'var(--border)',
                  background: uploadFile ? 'var(--primary-bg)' : 'transparent',
                }}
              >
                <Upload size={22} style={{ color: uploadFile ? 'var(--primary)' : 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: uploadFile ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  {uploadFile ? uploadFile.name : 'Click to select a PDF'}
                </span>
                {uploadFile && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setUploadFile(f); setImportError(''); }
                  }}
                />
              </label>
            </div>
            {importError && <p className="text-xs" style={{ color: 'var(--destructive)' }}>{importError}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowImport(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => uploadMutation.mutate({ file: uploadFile, title: uploadTitle })}
                loading={uploadMutation.isPending}
                disabled={!uploadFile}
                className="flex-1"
              >
                Upload
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function NoteCard({ note, onDelete }) {
  return (
    <Card className="relative group flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <Badge variant="primary" className="capitalize">{note.type || 'note'}</Badge>
        {onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link to="/notes/edit" state={{ id: note._id }}>
              <button className="p-1.5 rounded-lg hover:bg-accent text-secondary hover:text-primary transition-colors">
                <Edit3 size={13} />
              </button>
            </Link>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <Link to="/notes/view" state={{ id: note._id }} className="flex-1">
        <h3 className="font-semibold text-foreground text-sm mb-1.5 line-clamp-2 hover:text-primary transition-colors">
          {note.title}
        </h3>
        <p className="text-xs text-secondary line-clamp-4">
          {truncate(stripHtml(note.content), 180)}
        </p>
      </Link>

      <div className="mt-3 flex items-center justify-between">
        {note.tags?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-secondary">
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        ) : <span />}
        <span className="text-xs text-secondary">{formatRelative(note.updatedAt)}</span>
      </div>
    </Card>
  );
}
