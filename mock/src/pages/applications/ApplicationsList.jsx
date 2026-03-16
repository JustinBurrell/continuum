import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Briefcase, Search } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'rejected'];
const STAGE_VARIANTS = {
  applied: 'neutral', screening: 'primary', interview: 'warning',
  offer: 'success', rejected: 'danger',
};

const emptyForm = {
  company: '', position: '', status: 'applied', location: '',
  jobUrl: '', salary: '', notes: '', appliedAt: '',
};

export default function ApplicationsList() {
  const [view, setView] = useState('pipeline');
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

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/applications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowCreate(false);
      setForm(emptyForm);
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/applications/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const apps = data?.applications || data?.data || [];

  // Group for pipeline view
  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="text-secondary text-sm mt-0.5">{data?.total ?? apps.length} total</p>
        </div>
        <div className="flex gap-2">
          {['pipeline', 'list'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                view === v ? 'bg-primary text-white' : 'bg-accent text-foreground/70 hover:text-primary'
              }`}
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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            className="input-field pl-9"
            placeholder="Search company or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...STAGES].map(s => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                stageFilter === s ? 'bg-primary text-white' : 'bg-accent text-foreground/70 hover:text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map(s => <Skeleton key={s} className="h-48" />)}
        </div>
      ) : view === 'pipeline' ? (
        /* Pipeline kanban */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STAGES.map(stage => (
            <div key={stage} className="min-w-[180px]">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={STAGE_VARIANTS[stage]} className="capitalize">{stage}</Badge>
                <span className="text-xs text-secondary">{byStage[stage].length}</span>
              </div>
              <div className="space-y-3">
                {byStage[stage].length === 0 ? (
                  <div className="h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                    <p className="text-xs text-secondary">Empty</p>
                  </div>
                ) : (
                  byStage[stage].map(app => (
                    <PipelineCard
                      key={app._id}
                      app={app}
                      stages={STAGES}
                      onStageChange={(stage) => updateStageMutation.mutate({ id: app._id, stage })}
                      stateApp={app}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        apps.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={40} className="mx-auto mb-3 text-secondary/40" />
            <h3 className="font-semibold text-foreground mb-1">No applications found</h3>
            <p className="text-secondary text-sm mb-4">Start tracking your job applications.</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>Add your first application</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => (
              <Card key={app._id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/applications/view" state={{ id: app._id, application: app }} className="hover:text-primary transition-colors">
                    <p className="font-semibold text-foreground text-sm">{app.company}</p>
                  </Link>
                  <p className="text-xs text-secondary">{app.position}</p>
                  {app.location && <p className="text-xs text-secondary/60">{app.location}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {app.appliedAt && <p className="text-xs text-secondary">{formatDate(app.appliedAt)}</p>}
                  <Badge variant={STAGE_VARIANTS[app.status]} className="capitalize">{app.status}</Badge>
                  <Link to="/applications/view" state={{ id: app._id, application: app }}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              </Card>
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
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
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
                placeholder="$120k–$160k"
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
    <Card className="p-3">
      <Link to="/applications/view" state={{ id: app._id, application: stateApp }}>
        <p className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{app.company}</p>
        <p className="text-xs text-secondary mt-0.5 mb-2">{app.position}</p>
      </Link>
      {app.location && <p className="text-xs text-secondary/60 mb-2">{app.location}</p>}
      <select
        value={app.status}
        onChange={e => onStageChange(e.target.value)}
        className="text-xs border border-border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 w-full"
        onClick={e => e.stopPropagation()}
      >
        {stages.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
      </select>
    </Card>
  );
}
