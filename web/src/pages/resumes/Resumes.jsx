import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, FileCheck, Sparkles, Download, ChevronDown, ChevronUp, History, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

export default function Resumes() {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then(r => r.data),
  });

  const handleUpload = async (file) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', file.name.replace('.pdf', ''));
      await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAiFeedback = async (resumeId) => {
    setFeedbackLoading(prev => ({ ...prev, [resumeId]: true }));
    try {
      await api.post(`/resumes/${resumeId}/feedback`);
      const updated = await api.get('/resumes').then(r => r.data);
      queryClient.setQueryData(['resumes'], updated);
      setExpandedFeedback(prev => ({ ...prev, [resumeId]: true }));
    } catch (err) {
      console.error('AI feedback error:', err);
    } finally {
      setFeedbackLoading(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/resumes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const resumes = data?.resumes || data?.data || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumes</h1>
          <p className="text-secondary text-sm mt-0.5">{resumes.length} uploaded</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => handleUpload(e.target.files[0])}
          />
          <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
            <Plus size={16} /> Upload resume
          </Button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-primary/60 hover:bg-accent/50 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file?.type === 'application/pdf') handleUpload(file);
        }}
      >
        <FileCheck size={32} className="mx-auto mb-2 text-primary/40" />
        <p className="text-sm font-medium text-foreground mb-1">Upload your resume</p>
        <p className="text-xs text-secondary">Drag & drop PDF here, or click to browse</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-8 text-secondary text-sm">
          No resumes uploaded yet. Upload your first resume to get AI-powered feedback.
        </div>
      ) : (
        <div className="space-y-4">
          {resumes.map(resume => (
            <ResumeCard
              key={resume._id}
              resume={resume}
              expanded={expandedFeedback[resume._id]}
              feedbackLoading={feedbackLoading[resume._id]}
              onToggleFeedback={() =>
                setExpandedFeedback(prev => ({ ...prev, [resume._id]: !prev[resume._id] }))
              }
              onAiFeedback={() => handleAiFeedback(resume._id)}
              onDelete={() => {
                if (window.confirm('Delete this resume and all its feedback history?')) {
                  deleteMutation.mutate(resume._id);
                }
              }}
              deleteLoading={deleteMutation.isPending && deleteMutation.variables === resume._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeCard({ resume, expanded, feedbackLoading, onToggleFeedback, onAiFeedback, onDelete, deleteLoading }) {
  const hasFeedback = resume.feedback?.length > 0;
  const allFeedback = resume.feedback || [];
  const latestFeedback = allFeedback[allFeedback.length - 1];
  const olderFeedback = allFeedback.slice(0, -1).reverse(); // older entries, newest first
  const [downloading, setDownloading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/resumes/${resume._id}/download`);
      window.open(res.data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileCheck size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{resume.fileName || resume.name || 'Untitled Resume'}</p>
          <p className="text-xs text-secondary mt-0.5">
            Uploaded {formatDate(resume.createdAt)}
            {resume.fileSize && ` · ${(resume.fileSize / 1024).toFixed(0)} KB`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button size="sm" variant="ghost" onClick={onAiFeedback} loading={feedbackLoading}>
            <Sparkles size={13} /> {hasFeedback ? 'Regenerate' : 'AI Feedback'}
          </Button>
          {resume.fileUrl && (
            <Button size="sm" variant="outline" onClick={handleDownload} loading={downloading}>
              <Download size={13} /> Download
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={onDelete} loading={deleteLoading}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* AI Feedback accordion */}
      {hasFeedback && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFeedback}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors flex-1 text-left"
            >
              <Sparkles size={14} className="text-primary" />
              AI Feedback
              {latestFeedback?.overallScore !== undefined && (
                <span className="ml-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                  {latestFeedback.overallScore}/100
                </span>
              )}
              {expanded ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>
            {olderFeedback.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-accent"
                title="View feedback history"
              >
                <History size={13} />
                {olderFeedback.length} older
              </button>
            )}
          </div>
          {expanded && latestFeedback && (
            <div className="mt-3 space-y-4">
              <p className="text-xs text-secondary">
                {formatDate(latestFeedback.generatedAt)} · {latestFeedback.model || 'AI'}
              </p>

              {latestFeedback.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>Strengths</p>
                  <ul className="space-y-1">
                    {latestFeedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestFeedback.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>Improvements</p>
                  <ul className="space-y-1">
                    {latestFeedback.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--warning, #f59e0b)' }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestFeedback.sections?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>Section Scores</p>
                  <div className="space-y-2">
                    {latestFeedback.sections.map((sec, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{sec.name}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${sec.score ?? 0}%`, background: 'var(--primary)' }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--text-secondary)' }}>{sec.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestFeedback.keywordOptimization && (
                <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--primary-bg)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Keyword Optimization</p>
                  {latestFeedback.keywordOptimization.presentKeywords?.length > 0 && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Present</p>
                      <div className="flex flex-wrap gap-1">
                        {latestFeedback.keywordOptimization.presentKeywords.map((kw, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(107,33,168,0.1)', color: 'var(--primary)' }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {latestFeedback.keywordOptimization.missingKeywords?.length > 0 && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Missing</p>
                      <div className="flex flex-wrap gap-1">
                        {latestFeedback.keywordOptimization.missingKeywords.map((kw, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning, #f59e0b)' }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feedback history */}
          {showHistory && olderFeedback.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  Feedback history ({olderFeedback.length})
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryIndex(i => Math.max(0, i - 1))}
                    disabled={historyIndex === 0}
                    className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp size={13} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {historyIndex + 1}/{olderFeedback.length}
                  </span>
                  <button
                    onClick={() => setHistoryIndex(i => Math.min(olderFeedback.length - 1, i + 1))}
                    disabled={historyIndex === olderFeedback.length - 1}
                    className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={13} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
              </div>
              {(() => {
                const hf = olderFeedback[historyIndex];
                if (!hf) return null;
                return (
                  <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(hf.generatedAt)} · {hf.model || 'AI'}
                      </p>
                      {hf.overallScore !== undefined && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                          {hf.overallScore}/100
                        </span>
                      )}
                    </div>
                    {hf.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Strengths</p>
                        <ul className="space-y-0.5">
                          {hf.strengths.map((s, i) => (
                            <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-primary)' }}>
                              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--primary)' }} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {hf.improvements?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Improvements</p>
                        <ul className="space-y-0.5">
                          {hf.improvements.map((s, i) => (
                            <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-primary)' }}>
                              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--warning, #f59e0b)' }} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
