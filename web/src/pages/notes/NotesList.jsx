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
      {/* Page header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#111827', fontWeight: 700, lineHeight: 1.2 }}>
            Notes
          </h1>
          <p style={{ color: '#a087b0', fontSize: '0.8125rem', marginTop: 2 }}>
            {data?.pagination?.total ?? notes.length} notes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImport(true); setImportError(''); }}
            style={{
              border: '1px solid #ede9fe',
              background: 'white',
              color: '#374151',
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Upload size={15} /> Import
          </button>
          <Link to="/notes/new">
            <button
              style={{
                background: '#6b21a8',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <Plus size={15} /> New note
            </button>
          </Link>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a087b0' }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={sharedTab}
            style={{
              width: '100%',
              background: 'white',
              border: '1px solid #ede9fe',
              borderRadius: 12,
              padding: '10px 16px 10px 40px',
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setSharedTab(v => !v)}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: sharedTab ? '#6b21a8' : '#f5f0ff',
              color: sharedTab ? 'white' : '#6b21a8',
              transition: 'all 0.15s',
            }}
          >
            Shared with me
          </button>
          {!sharedTab && NOTE_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: type === t ? '#6b21a8' : '#f5f0ff',
                color: type === t ? 'white' : '#6b21a8',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
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
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#f5f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FileText size={28} style={{ color: '#6b21a8' }} />
          </div>
          <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginBottom: 6 }}>
            No notes found
          </h3>
          <p style={{ color: '#a087b0', fontSize: '0.875rem', marginBottom: 20 }}>
            {sharedTab
              ? 'No notes have been shared with you yet.'
              : search || type !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Start capturing your thoughts and ideas.'}
          </p>
          {!sharedTab && !search && type === 'all' && (
            <Link to="/notes/new">
              <button
                style={{
                  background: '#6b21a8',
                  color: 'white',
                  padding: '9px 20px',
                  borderRadius: 12,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Create your first note
              </button>
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
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, borderRadius: 10, background: '#f5f0ff' }}>
          {['drive', 'upload'].map(tab => (
            <button
              key={tab}
              onClick={() => { setImportTab(tab); setImportError(''); }}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 8,
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: importTab === tab ? 'white' : 'transparent',
                color: importTab === tab ? '#111827' : '#a087b0',
                boxShadow: importTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab === 'drive' ? 'Google Drive' : 'Upload PDF'}
            </button>
          ))}
        </div>

        {/* Google Drive tab */}
        {importTab === 'drive' && (
          !user?.googleId ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: '0.875rem', color: '#a087b0', marginBottom: 12 }}>
                Connect your Google account to import documents from Drive.
              </p>
              <a
                href="/profile"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 500, color: '#6b21a8' }}
              >
                <ExternalLink size={13} /> Go to Profile to connect
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a087b0' }} />
                <input
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid #ede9fe',
                    borderRadius: 12,
                    padding: '9px 14px 9px 36px',
                    fontSize: '0.875rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Search your Google Docs..."
                  value={driveSearch}
                  onChange={e => setDriveSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }} className="space-y-1">
                {driveLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)
                ) : driveFiles.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', textAlign: 'center', padding: '16px 0', color: '#a087b0' }}>
                    {driveSearch ? 'No docs match your search.' : 'No Google Docs found in your Drive.'}
                  </p>
                ) : (
                  driveFiles.map(file => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 10,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: selectedFile?.id === file.id ? '1px solid #6b21a8' : '1px solid transparent',
                        background: selectedFile?.id === file.id ? '#f5f0ff' : 'transparent',
                        transition: 'all 0.12s',
                      }}
                    >
                      <FileText size={14} style={{ color: '#a087b0', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ flexShrink: 0 }}
                      >
                        <ExternalLink size={12} style={{ color: '#a087b0' }} />
                      </a>
                    </button>
                  ))
                )}
              </div>
              {importError && <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>{importError}</p>}
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#a087b0', marginBottom: 6 }}>
                Title (optional — defaults to filename)
              </label>
              <input
                style={{
                  width: '100%',
                  background: 'white',
                  border: '1px solid #ede9fe',
                  borderRadius: 12,
                  padding: '9px 14px',
                  fontSize: '0.875rem',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Note title..."
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#a087b0', marginBottom: 6 }}>
                PDF file
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  borderRadius: 12,
                  border: `2px dashed ${uploadFile ? '#6b21a8' : '#ede9fe'}`,
                  background: uploadFile ? '#f5f0ff' : 'transparent',
                  cursor: 'pointer',
                  padding: '32px 0',
                  transition: 'all 0.15s',
                }}
              >
                <Upload size={22} style={{ color: uploadFile ? '#6b21a8' : '#a087b0' }} />
                <span style={{ fontSize: '0.875rem', color: uploadFile ? '#6b21a8' : '#a087b0' }}>
                  {uploadFile ? uploadFile.name : 'Click to select a PDF'}
                </span>
                {uploadFile && (
                  <span style={{ fontSize: '0.75rem', color: '#a087b0' }}>
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
            {importError && <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>{importError}</p>}
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
    <div
      className="group"
      style={{
        background: 'white',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#6b21a8';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#ede9fe';
        e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
      }}
    >
      {/* Top row: badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{
          display: 'inline-block',
          background: '#f5f0ff',
          color: '#6b21a8',
          fontSize: '0.6875rem',
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
          textTransform: 'capitalize',
          letterSpacing: '0.02em',
        }}>
          {note.type || 'note'}
        </span>
        {onDelete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0 }} className="group-hover:opacity-100" >
            <Link to="/notes/edit" state={{ id: note._id }}>
              <button style={{
                padding: '5px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: '#a087b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; e.currentTarget.style.color = '#6b21a8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
              >
                <Edit3 size={13} />
              </button>
            </Link>
            <button
              onClick={onDelete}
              style={{
                padding: '5px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: '#a087b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Title + preview */}
      <Link to="/notes/view" state={{ id: note._id }} style={{ flex: 1, textDecoration: 'none' }}>
        <h3 style={{
          fontWeight: 600,
          color: '#111827',
          fontSize: '0.9375rem',
          marginBottom: 6,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
        onMouseLeave={e => e.currentTarget.style.color = '#111827'}
        >
          {note.title}
        </h3>
        <p style={{
          fontSize: '0.8125rem',
          color: '#a087b0',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {truncate(stripHtml(note.content), 160)}
        </p>
      </Link>

      {/* Footer */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {note.tags?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: '#a087b0' }}>
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        ) : <span />}
        <span style={{ fontSize: '0.75rem', color: '#a087b0' }}>{formatRelative(note.updatedAt)}</span>
      </div>
    </div>
  );
}
