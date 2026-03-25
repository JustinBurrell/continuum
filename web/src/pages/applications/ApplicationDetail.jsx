import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, Edit3, ExternalLink,
  MapPin, DollarSign, Calendar, Save, X,
  User, Phone, Mail, Plus, Bell, Trash2,
} from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
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

const emptyContact = { name: '', email: '', role: '', linkedIn: '' };
const emptyReminder = { description: '', date: '' };

const cardStyle = {
  background: '#fff',
  border: '1px solid #ede9fe',
  borderRadius: 16,
  boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
  padding: '20px 24px',
  marginBottom: 16,
};

function StageBadge({ stage }) {
  const s = STAGE_STYLES[stage] || STAGE_STYLES.draft;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 14px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {stage}
    </span>
  );
}

export default function ApplicationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Contacts state
  const [contacts, setContacts] = useState(null);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [showContactForm, setShowContactForm] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState(null);
  const [reminderForm, setReminderForm] = useState(emptyReminder);
  const [showReminderForm, setShowReminderForm] = useState(false);

  const stateApp = location.state?.application;
  const cachedList = queryClient.getQueryData(['applications']);
  const listApps = cachedList?.applications || cachedList?.data || [];
  const cachedApp = listApps.find(a => a._id === id);
  const app = form || stateApp || cachedApp;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications-dashboard'] });
      navigate('/applications');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/applications/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications-dashboard'] });
      setEditing(false);
      setForm(null);
    },
  });

  const addContactMutation = useMutation({
    mutationFn: (payload) => api.post(`/applications/${id}/contacts`, payload),
    onSuccess: (res) => {
      const updatedContacts = res.data?.application?.contacts || [...(contacts ?? app?.contacts ?? []), { ...contactForm }];
      setContacts(updatedContacts);
      setContactForm(emptyContact);
      setShowContactForm(false);
    },
  });

  const addReminderMutation = useMutation({
    mutationFn: (payload) => api.post(`/applications/${id}/reminders`, payload),
    onSuccess: (res) => {
      const updatedReminders = res.data?.application?.followUpReminders || [...(reminders ?? app?.followUpReminders ?? []), { ...reminderForm }];
      setReminders(updatedReminders);
      setReminderForm(emptyReminder);
      setShowReminderForm(false);
    },
  });

  if (!app) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ color: '#a087b0', marginBottom: 8 }}>Application not found.</p>
        <Link to="/applications" style={{ color: '#6b21a8', fontSize: 13 }}>Back to applications</Link>
      </div>
    );
  }

  const displayForm = form || app;
  const displayContacts = contacts ?? app?.contacts ?? [];
  const displayReminders = reminders ?? app?.followUpReminders ?? [];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/applications">
          <button style={{
            padding: 8,
            borderRadius: 10,
            border: 'none',
            background: '#f5f0ff',
            cursor: 'pointer',
            color: '#6b21a8',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.15s',
          }}>
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div style={{ flex: 1 }} />
        {editing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm(null); }}>
              <X size={14} /> Cancel
            </Button>
            <Button size="sm" onClick={() => updateMutation.mutate(form)} loading={updateMutation.isPending} disabled={!form?.company?.trim() || !form?.position?.trim()}>
              <Save size={14} /> Save
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8, border: '1px solid #ede9fe',
                background: 'white', color: '#a087b0', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#a087b0'; e.currentTarget.style.borderColor = '#ede9fe'; }}
              title="Delete application"
            >
              <Trash2 size={15} />
            </button>
            <Button variant="outline" size="sm" onClick={() => { setForm({ ...app }); setEditing(true); }}>
              <Edit3 size={14} /> Edit
            </Button>
          </>
        )}
      </div>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete application">
        <div className="space-y-4">
          <p style={{ fontSize: 13, color: '#374151' }}>
            Delete <strong>{app?.company}</strong> — <strong>{app?.position}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
              style={{ background: '#ef4444', flex: 1 }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main card */}
      <div style={cardStyle}>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Company <span className="text-red-500">*</span></label>
                <input
                  className="input-field"
                  value={displayForm.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Role <span className="text-red-500">*</span></label>
                <input
                  className="input-field"
                  value={displayForm.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Stage</label>
                <select
                  className="input-field capitalize"
                  value={displayForm.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Location</label>
                <input
                  className="input-field"
                  value={displayForm.location || ''}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Salary</label>
                <input
                  className="input-field"
                  value={displayForm.salary || ''}
                  onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Job URL</label>
                <input
                  className="input-field"
                  value={displayForm.jobUrl || ''}
                  onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-secondary block mb-1">Notes</label>
              <textarea
                className="input-field resize-none min-h-[80px]"
                value={displayForm.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {app.company}
                </h1>
                <p style={{ fontSize: 15, color: '#a087b0', marginTop: 4 }}>{app.position}</p>
              </div>
              <StageBadge stage={app.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {app.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                  <MapPin size={14} style={{ color: '#a087b0' }} /> {app.location}
                </div>
              )}
              {app.salary && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                  <DollarSign size={14} style={{ color: '#a087b0' }} /> {app.salary}
                </div>
              )}
              {app.appliedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                  <Calendar size={14} style={{ color: '#a087b0' }} /> Applied {formatDate(app.appliedAt)}
                </div>
              )}
              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b21a8', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> Job posting
                </a>
              )}
            </div>

            {app.notes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ede9fe' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#a087b0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Notes</p>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{app.notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Contacts section */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <User size={16} style={{ color: '#6b21a8' }} /> Contacts
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowContactForm(v => !v)}>
            <Plus size={13} /> Add contact
          </Button>
        </div>

        {displayContacts.length === 0 && !showContactForm && (
          <p style={{ fontSize: 13, color: '#a087b0' }}>No contacts added yet.</p>
        )}

        {displayContacts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: showContactForm ? 16 : 0 }}>
            {displayContacts.map((c, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                background: '#f5f0ff',
                borderRadius: 12,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(107,33,168,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <User size={15} style={{ color: '#6b21a8' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{c.name}</p>
                  {c.role && <p style={{ fontSize: 11, color: '#a087b0', margin: '2px 0 0' }}>{c.role}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
                    {c.email && (
                      <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b21a8', textDecoration: 'none' }}>
                        <Mail size={11} /> {c.email}
                      </a>
                    )}
                    {c.linkedIn && (
                      <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a087b0', textDecoration: 'none' }}>
                        <Phone size={11} /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showContactForm && (
          <div style={{ border: '1px solid #ede9fe', borderRadius: 12, padding: '14px 16px' }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Name *</label>
                <input
                  className="input-field"
                  placeholder="Jane Smith"
                  value={contactForm.name}
                  onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Role</label>
                <input
                  className="input-field"
                  placeholder="Recruiter"
                  value={contactForm.role}
                  onChange={e => setContactForm(f => ({ ...f, role: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="jane@company.com"
                  value={contactForm.email}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">LinkedIn URL</label>
                <input
                  className="input-field"
                  placeholder="https://linkedin.com/in/..."
                  value={contactForm.linkedIn}
                  onChange={e => setContactForm(f => ({ ...f, linkedIn: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowContactForm(false); setContactForm(emptyContact); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => addContactMutation.mutate(contactForm)}
                loading={addContactMutation.isPending}
                disabled={!contactForm.name.trim()}
              >
                Save contact
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reminders section */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Bell size={16} style={{ color: '#6b21a8' }} /> Reminders
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowReminderForm(v => !v)}>
            <Plus size={13} /> Add reminder
          </Button>
        </div>

        {displayReminders.length === 0 && !showReminderForm && (
          <p style={{ fontSize: 13, color: '#a087b0' }}>No reminders set yet.</p>
        )}

        {displayReminders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: showReminderForm ? 16 : 0 }}>
            {displayReminders.map((r, i) => (
              <div key={r._id || i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                background: '#fffbeb',
                borderRadius: 12,
                border: '1px solid #fde68a',
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Bell size={15} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{r.description}</p>
                  {r.date && (
                    <p style={{ fontSize: 11, color: '#a087b0', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Calendar size={10} />
                      {new Date(r.date).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showReminderForm && (
          <div style={{ border: '1px solid #ede9fe', borderRadius: 12, padding: '14px 16px' }} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-secondary block mb-1">Description *</label>
              <textarea
                className="input-field resize-none min-h-[72px]"
                placeholder="Reminder description..."
                value={reminderForm.description}
                onChange={e => setReminderForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary block mb-1">Date &amp; time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={reminderForm.date}
                onChange={e => setReminderForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowReminderForm(false); setReminderForm(emptyReminder); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => addReminderMutation.mutate(reminderForm)}
                loading={addReminderMutation.isPending}
                disabled={!reminderForm.description.trim()}
              >
                Save reminder
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
