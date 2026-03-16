import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, Edit3, ExternalLink,
  MapPin, DollarSign, Calendar, Save, X,
  User, Phone, Mail, Plus, Bell,
} from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const STAGES = ['draft', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'];
const STAGE_VARIANTS = {
  draft: 'neutral', applied: 'primary', interview: 'warning',
  offer: 'success', rejected: 'danger', withdrawn: 'neutral',
};

const emptyContact = { name: '', email: '', role: '', linkedIn: '' };
const emptyReminder = { description: '', date: '' };

export default function ApplicationDetail() {
  const location = useLocation();
  const id = location.state?.id;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  // Contacts state
  const [contacts, setContacts] = useState(null); // null = use app.contacts
  const [contactForm, setContactForm] = useState(emptyContact);
  const [showContactForm, setShowContactForm] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState(null); // null = use app.reminders
  const [reminderForm, setReminderForm] = useState(emptyReminder);
  const [showReminderForm, setShowReminderForm] = useState(false);

  // Get application from router state (passed from list) or list cache
  const stateApp = location.state?.application;
  const cachedList = queryClient.getQueryData(['applications']);
  const listApps = cachedList?.applications || cachedList?.data || [];
  const cachedApp = listApps.find(a => a._id === id);
  const app = form || stateApp || cachedApp;

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/applications/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setEditing(false);
      setForm(null);
    },
  });

  const addContactMutation = useMutation({
    mutationFn: (payload) => api.post(`/applications/${id}/contacts`, payload),
    onSuccess: (res) => {
      // Backend returns { contact, application } — read contacts from returned application
      const updatedContacts = res.data?.application?.contacts || [...(contacts ?? app?.contacts ?? []), { ...contactForm }];
      setContacts(updatedContacts);
      setContactForm(emptyContact);
      setShowContactForm(false);
    },
  });

  const addReminderMutation = useMutation({
    mutationFn: (payload) => api.post(`/applications/${id}/reminders`, payload),
    onSuccess: (res) => {
      // Backend returns { reminder, application } — field is followUpReminders
      const updatedReminders = res.data?.application?.followUpReminders || [...(reminders ?? app?.followUpReminders ?? []), { ...reminderForm }];
      setReminders(updatedReminders);
      setReminderForm(emptyReminder);
      setShowReminderForm(false);
    },
  });

  if (!app) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary">Application not found.</p>
        <Link to="/applications" className="text-primary text-sm hover:underline mt-2 block">Back</Link>
      </div>
    );
  }

  const displayForm = form || app;
  const displayContacts = contacts ?? app?.contacts ?? [];
  const displayReminders = reminders ?? app?.followUpReminders ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/applications">
          <button className="p-2 rounded-lg hover:bg-accent text-secondary transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1" />
        {editing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm(null); }}>
              <X size={14} /> Cancel
            </Button>
            <Button size="sm" onClick={() => updateMutation.mutate(form)} loading={updateMutation.isPending}>
              <Save size={14} /> Save
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => { setForm({ ...app }); setEditing(true); }}>
            <Edit3 size={14} /> Edit
          </Button>
        )}
      </div>

      {/* Main card */}
      <Card className="mb-5">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Company</label>
                <input
                  className="input-field"
                  value={displayForm.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">Role</label>
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
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
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
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{app.company}</h1>
                <p className="text-secondary mt-0.5">{app.position}</p>
              </div>
              <Badge variant={STAGE_VARIANTS[app.status]} className="capitalize text-sm px-3 py-1">
                {app.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {app.location && (
                <div className="flex items-center gap-2 text-secondary">
                  <MapPin size={14} /> {app.location}
                </div>
              )}
              {app.salary && (
                <div className="flex items-center gap-2 text-secondary">
                  <DollarSign size={14} /> {app.salary}
                </div>
              )}
              {app.appliedAt && (
                <div className="flex items-center gap-2 text-secondary">
                  <Calendar size={14} /> Applied {formatDate(app.appliedAt)}
                </div>
              )}
              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink size={14} /> Job posting
                </a>
              )}
            </div>

            {app.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-secondary mb-2">Notes</p>
                <p className="text-sm text-foreground">{app.notes}</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Contacts section */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User size={16} className="text-primary" /> Contacts
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowContactForm(v => !v)}>
            <Plus size={13} /> Add contact
          </Button>
        </div>

        {displayContacts.length === 0 && !showContactForm && (
          <p className="text-sm text-secondary">No contacts added yet.</p>
        )}

        {displayContacts.length > 0 && (
          <div className="space-y-3 mb-4">
            {displayContacts.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-accent rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  {c.role && <p className="text-xs text-secondary">{c.role}</p>}
                  <div className="flex flex-wrap gap-3 mt-1">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Mail size={11} /> {c.email}
                      </a>
                    )}
                    {c.linkedIn && (
                      <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-secondary hover:text-primary">
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
          <div className="border border-border rounded-xl p-4 space-y-3">
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
      </Card>

      {/* Reminders section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Bell size={16} className="text-primary" /> Reminders
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowReminderForm(v => !v)}>
            <Plus size={13} /> Add reminder
          </Button>
        </div>

        {displayReminders.length === 0 && !showReminderForm && (
          <p className="text-sm text-secondary">No reminders set yet.</p>
        )}

        {displayReminders.length > 0 && (
          <div className="space-y-3 mb-4">
            {displayReminders.map((r, i) => (
              <div key={r._id || i} className="flex items-start gap-3 p-3 bg-accent rounded-xl">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Bell size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{r.description}</p>
                  {r.date && (
                    <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
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
          <div className="border border-border rounded-xl p-4 space-y-3">
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
              <label className="text-xs font-medium text-secondary block mb-1">Date & time</label>
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
      </Card>
    </div>
  );
}
