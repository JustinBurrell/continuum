import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, FileCheck, Sparkles, Download, ChevronDown, ChevronUp, History, Trash2, Search } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

export default function Resumes() {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState({});
  const [resumeSearch, setResumeSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['resumes', resumeSearch],
    queryFn: () => api.get('/resumes', { params: resumeSearch ? { search: resumeSearch } : {} }).then(r => r.data),
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
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Resumes
          </h1>
          <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>
            {resumeSearch ? `${resumes.length} result${resumes.length !== 1 ? 's' : ''}` : `${resumes.length} uploaded`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file?.type === 'application/pdf') handleUpload(file);
        }}
        style={{
          border: '2px dashed rgba(107,33,168,0.25)',
          borderRadius: 16,
          padding: '32px 0',
          textAlign: 'center',
          marginBottom: 24,
          cursor: 'pointer',
          background: '#fef7ff',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b21a8'; e.currentTarget.style.background = '#f5f0ff'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(107,33,168,0.25)'; e.currentTarget.style.background = '#fef7ff'; }}
      >
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'rgba(107,33,168,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <FileCheck size={24} style={{ color: '#6b21a8' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Upload your resume</p>
        <p style={{ fontSize: 12, color: '#a087b0', margin: 0 }}>Drag and drop a PDF here, or click to browse</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a087b0', pointerEvents: 'none' }} />
        <input
          style={{
            width: '100%',
            paddingLeft: 36,
            paddingRight: 14,
            paddingTop: 9,
            paddingBottom: 9,
            background: 'white',
            border: '1px solid #ede9fe',
            borderRadius: 12,
            fontSize: '0.875rem',
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder="Search by file name, version, or target role..."
          value={resumeSearch}
          onChange={e => setResumeSearch(e.target.value)}
          onFocus={e => e.target.style.borderColor = '#6b21a8'}
          onBlur={e => e.target.style.borderColor = '#ede9fe'}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#a087b0', fontSize: 14 }}>
          {resumeSearch ? `No resumes match "${resumeSearch}".` : 'No resumes uploaded yet. Upload your first resume to get AI-powered feedback.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
  const olderFeedback = allFeedback.slice(0, -1).reverse();
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

  const score = latestFeedback?.overallScore;
  const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : score !== undefined ? '#dc2626' : '#a087b0';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ede9fe',
      borderRadius: 16,
      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
      padding: '18px 22px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: hasFeedback ? 14 : 0 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'rgba(107,33,168,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}>
          <FileCheck size={22} style={{ color: '#6b21a8' }} />
          {score !== undefined && (
            <div style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              background: scoreColor,
              color: '#fff',
              borderRadius: 10,
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 5px',
              lineHeight: 1,
            }}>
              {score}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>
            {resume.fileName || resume.name || 'Untitled Resume'}
          </p>
          <p style={{ fontSize: 11, color: '#a087b0', margin: '3px 0 0' }}>
            Uploaded {formatDate(resume.createdAt)}
            {resume.fileSize && ` · ${(resume.fileSize / 1024).toFixed(0)} KB`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Button size="sm" variant="ghost" onClick={onAiFeedback} loading={feedbackLoading}>
            <Sparkles size={13} /> {hasFeedback ? 'Regenerate' : 'AI Feedback'}
          </Button>
          {resume.fileUrl && (
            <Button size="sm" variant="outline" onClick={handleDownload} loading={downloading}>
              <Download size={13} />
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={onDelete} loading={deleteLoading}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* AI Feedback section */}
      {hasFeedback && (
        <div style={{ borderTop: '1px solid #ede9fe', paddingTop: 14 }}>
          {/* Feedback toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onToggleFeedback}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 1,
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.12s',
              }}
            >
              <Sparkles size={14} style={{ color: '#6b21a8' }} />
              AI Feedback
              {latestFeedback?.overallScore !== undefined && (
                <span style={{
                  background: scoreColor,
                  color: '#fff',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                }}>
                  {latestFeedback.overallScore}/100
                </span>
              )}
              {expanded ? <ChevronUp size={14} style={{ marginLeft: 'auto', color: '#a087b0' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto', color: '#a087b0' }} />}
            </button>

            {olderFeedback.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: '#a087b0',
                  background: 'none',
                  border: '1px solid #ede9fe',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'color 0.12s',
                }}
              >
                <History size={13} />
                {olderFeedback.length} older
              </button>
            )}
          </div>

          {/* Expanded feedback */}
          {expanded && latestFeedback && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 11, color: '#a087b0', margin: 0 }}>
                {formatDate(latestFeedback.generatedAt)} · {latestFeedback.model || 'AI'}
              </p>

              {latestFeedback.strengths?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', marginBottom: 8 }}>Strengths</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {latestFeedback.strengths.map((s, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                        <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#6b21a8' }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestFeedback.improvements?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', marginBottom: 8 }}>Improvements</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {latestFeedback.improvements.map((s, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                        <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#f59e0b' }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestFeedback.sections?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', marginBottom: 8 }}>Section Scores</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {latestFeedback.sections.map((sec, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#6b7280', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{sec.name}</span>
                        <div style={{ flex: 2, height: 6, borderRadius: 10, background: '#ede9fe' }}>
                          <div style={{
                            height: '100%',
                            borderRadius: 10,
                            background: '#6b21a8',
                            width: `${sec.score ?? 0}%`,
                            transition: 'width 0.4s',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b21a8', width: 28, textAlign: 'right' }}>{sec.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestFeedback.keywordOptimization && (
                <div style={{ borderRadius: 12, padding: '12px 14px', background: '#f5f0ff', border: '1px solid #ede9fe' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b21a8', marginBottom: 8 }}>Keyword Optimization</p>
                  {latestFeedback.keywordOptimization.presentKeywords?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: 10, color: '#a087b0', marginBottom: 4 }}>Present</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {latestFeedback.keywordOptimization.presentKeywords.map((kw, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(107,33,168,0.1)', color: '#6b21a8' }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {latestFeedback.keywordOptimization.missingKeywords?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: '#a087b0', marginBottom: 4 }}>Missing</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {latestFeedback.keywordOptimization.missingKeywords.map((kw, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>{kw}</span>
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
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ede9fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a087b0', margin: 0 }}>
                  Feedback history ({olderFeedback.length})
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => setHistoryIndex(i => Math.max(0, i - 1))}
                    disabled={historyIndex === 0}
                    style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#a087b0', display: 'flex', alignItems: 'center', opacity: historyIndex === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <span style={{ fontSize: 11, color: '#a087b0' }}>{historyIndex + 1}/{olderFeedback.length}</span>
                  <button
                    onClick={() => setHistoryIndex(i => Math.min(olderFeedback.length - 1, i + 1))}
                    disabled={historyIndex === olderFeedback.length - 1}
                    style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#a087b0', display: 'flex', alignItems: 'center', opacity: historyIndex === olderFeedback.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
              {(() => {
                const hf = olderFeedback[historyIndex];
                if (!hf) return null;
                return (
                  <div style={{ borderRadius: 12, padding: '12px 14px', background: '#fef7ff', border: '1px solid #ede9fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <p style={{ fontSize: 11, color: '#a087b0', margin: 0 }}>
                        {formatDate(hf.generatedAt)} · {hf.model || 'AI'}
                      </p>
                      {hf.overallScore !== undefined && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b21a8' }}>{hf.overallScore}/100</span>
                      )}
                    </div>
                    {hf.strengths?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#a087b0', marginBottom: 4 }}>Strengths</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {hf.strengths.map((s, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#374151' }}>
                              <span style={{ marginTop: 5, width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: '#6b21a8' }} />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {hf.improvements?.length > 0 && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#a087b0', marginBottom: 4 }}>Improvements</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {hf.improvements.map((s, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#374151' }}>
                              <span style={{ marginTop: 5, width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: '#f59e0b' }} />
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
    </div>
  );
}
