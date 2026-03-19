import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Briefcase, Search } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const STAGES = ['draft', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'];

const STAGE_STYLES = {
  draft:     { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  applied:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  interview: { bg: '#fdf4ff', color: '#7c3aed', border: '#e9d5ff' },
  offer:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  withdrawn: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
};

const emptyForm = {
  company: '', position: '', status: 'applied', location: '',
  jobUrl: '', salary: '', notes: '', appliedAt: '',
};

function StageBadge({ stage }) {
  const s = STAGE_STYLES[stage] || STAGE_STYLES.draft;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {stage}
    </span>
  );
}

export default function ApplicationsList() {
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', { search, status: stageFilter }],
    queryFn: () =>
      api.get('/applications', {
        params: {
          ...(search && { search }),
          ...(stageFilter !== 'all' && { status: stageFilter }),
        },
      }).then(r => r.data),
    keepPreviousData: true,
  });

  const invalidateApps = () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    queryClient.invalidateQueries({ queryKey: ['applications-dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/applications', payload),
    onSuccess: () => {
      invalidateApps();
      setShowCreate(false);
      setForm(emptyForm);
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/applications/${id}`, { status }),
    onSuccess: invalidateApps,
  });

  const apps = data?.applications || data?.data || [];

  // Group for pipeline view
  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s);
    return acc;
  }, {});

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Applications
          </h1>
          <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>{data?.total ?? apps.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['pipeline', 'list'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
                background: view === v ? '#6b21a8' : '#f5f0ff',
                color: view === v ? '#fff' : '#6b21a8',
              }}
            >
              {v}
            </button>
          ))}
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add application
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a087b0' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36 }}
            placeholder="Search company or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...STAGES].map(s => {
            const active = stageFilter === s;
            const style = s !== 'all' ? STAGE_STYLES[s] : null;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  border: active && s !== 'all' ? `1px solid ${style?.border}` : active ? '1px solid #6b21a8' : '1px solid #ede9fe',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                  background: active ? (s === 'all' ? '#6b21a8' : style?.bg) : '#fff',
                  color: active ? (s === 'all' ? '#fff' : style?.color) : '#a087b0',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {STAGES.map(s => <Skeleton key={s} className="h-48" />)}
        </div>
      ) : view === 'pipeline' ? (
        /* Pipeline kanban */
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stageFilter === 'all' ? STAGES.length : 1}, 1fr)`, gap: 16, overflowX: 'auto' }}>
          {(stageFilter === 'all' ? STAGES : [stageFilter]).map(stage => {
            const s = STAGE_STYLES[stage];
            return (
              <div key={stage} style={{ minWidth: 180 }}>
                {/* Column header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  padding: '7px 12px',
                  borderRadius: 10,
                  background: 'rgba(107,33,168,0.03)',
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: s.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'capitalize', flex: 1 }}>
                    {stage}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    background: s.color,
                    borderRadius: 20,
                    padding: '1px 7px',
                  }}>
                    {byStage[stage].length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {byStage[stage].length === 0 ? (
                    <div style={{
                      height: 72,
                      borderRadius: 12,
                      border: '2px dashed #ede9fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <p style={{ fontSize: 11, color: '#a087b0' }}>Empty</p>
                    </div>
                  ) : (
                    byStage[stage].map(app => (
                      <PipelineCard
                        key={app._id}
                        app={app}
                        stages={STAGES}
                        onStageChange={(status) => updateStageMutation.mutate({ id: app._id, status })}
                        stateApp={app}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Briefcase size={40} style={{ margin: '0 auto 12px', color: '#d4c5e8' }} />
            {stageFilter !== 'all' || search ? (
              <>
                <h3 style={{ fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>No applications found</h3>
                <p style={{ color: '#a087b0', fontSize: 14 }}>No applications match this filter.</p>
              </>
            ) : (
              <>
                <h3 style={{ fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>No applications yet</h3>
                <p style={{ color: '#a087b0', fontSize: 14, marginBottom: 16 }}>Start tracking your job applications.</p>
                <Button size="sm" onClick={() => setShowCreate(true)}>Add your first application</Button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apps.map(app => (
              <div
                key={app._id}
                style={{
                  background: '#fff',
                  border: '1px solid #ede9fe',
                  borderRadius: 16,
                  boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)'}
              >
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'rgba(107,33,168,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Briefcase size={18} style={{ color: '#6b21a8' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to="/applications/view"
                    state={{ id: app._id, application: app }}
                    style={{ textDecoration: 'none' }}
                  >
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>{app.company}</p>
                  </Link>
                  <p style={{ fontSize: 12, color: '#a087b0', margin: '2px 0 0' }}>{app.position}</p>
                  {app.location && <p style={{ fontSize: 11, color: '#c4b5d4', margin: '2px 0 0' }}>{app.location}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {app.appliedAt && <p style={{ fontSize: 12, color: '#a087b0' }}>{formatDate(app.appliedAt)}</p>}
                  <StageBadge stage={app.status} />
                  <Link to="/applications/view" state={{ id: app._id, application: app }}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New application" className="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Company *</label>
              <input
                className="input-field"
                placeholder="Google"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Position *</label>
              <input
                className="input-field"
                placeholder="Software Engineer"
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Stage</label>
              <select
                className="input-field capitalize"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Applied date</label>
              <input
                type="date"
                className="input-field"
                value={form.appliedAt}
                onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Location</label>
              <input
                className="input-field"
                placeholder="Remote / NYC"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Salary range</label>
              <input
                className="input-field"
                placeholder="$120k-$160k"
                value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Job URL</label>
            <input
              className="input-field"
              placeholder="https://..."
              value={form.jobUrl}
              onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Notes</label>
            <textarea
              className="input-field resize-none min-h-[72px]"
              placeholder="Any notes about this application..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                ...form,
                appliedAt: form.appliedAt || undefined,
              })}
              loading={createMutation.isPending}
              disabled={!form.company.trim() || !form.position.trim()}
              className="flex-1"
            >
              Add application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PipelineCard({ app, stages, onStageChange, stateApp }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ede9fe',
      borderRadius: 12,
      boxShadow: '0 1px 6px rgba(107,33,168,0.06)',
      padding: '12px 14px',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(107,33,168,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(107,33,168,0.06)'}
    >
      <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: 0 }}>{app.company}</p>
      <p style={{ fontSize: 11, color: '#a087b0', margin: '3px 0 8px' }}>{app.position}</p>
      {app.location && <p style={{ fontSize: 11, color: '#c4b5d4', marginBottom: 8 }}>{app.location}</p>}
      <select
        value={app.status}
        onChange={e => onStageChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        style={{
          fontSize: 11,
          border: '1px solid #ede9fe',
          borderRadius: 8,
          padding: '4px 8px',
          background: '#fef7ff',
          color: '#6b21a8',
          fontWeight: 600,
          width: '100%',
          marginBottom: 10,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {stages.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
      <Link to="/applications/view" state={{ id: app._id, application: stateApp }}>
        <Button variant="outline" size="sm" className="w-full text-xs">View / Edit</Button>
      </Link>
    </div>
  );
}
