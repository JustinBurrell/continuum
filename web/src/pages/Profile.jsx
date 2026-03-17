import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Camera, Save, RefreshCw, LinkIcon, Unlink, LogOut,
  Bell, FileText, Layers, Briefcase, FileCheck,
  CheckSquare, Users, AtSign, Calendar as CalendarIcon,
  ChevronRight, ShieldCheck, ShieldAlert, Mail,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { formatDate } from '@/lib/utils';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });

  // Overview data
  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends').then(r => r.data),
    enabled: activeTab === 'overview',
  });
  const { data: notesData } = useQuery({
    queryKey: ['notes'],
    queryFn: () => api.get('/notes').then(r => r.data),
    enabled: activeTab === 'overview',
  });
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
    enabled: activeTab === 'overview',
  });
  const { data: flashcardsData } = useQuery({
    queryKey: ['flashcard-sets'],
    queryFn: () => api.get('/flashcard-sets').then(r => r.data),
    enabled: activeTab === 'overview',
  });
  const { data: appsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: activeTab === 'overview',
  });
  const { data: resumesData } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then(r => r.data),
    enabled: activeTab === 'overview',
  });

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      'settings.activityVisibility': user?.settings?.activityVisibility || 'friends',
    },
  });

  const notifForm = useForm({
    defaultValues: {
      emailNotifications: user?.settings?.emailNotifications ?? true,
      pushNotifications: user?.settings?.pushNotifications ?? true,
    },
  });

  // Sync notifForm once fresh /me data loads (ensures DB values, not stale context, are shown)
  useEffect(() => {
    if (data) {
      const fresh = data.user || data.data;
      notifForm.reset({
        emailNotifications: fresh?.settings?.emailNotifications ?? true,
        pushNotifications: fresh?.settings?.pushNotifications ?? true,
      });
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const profileMutation = useMutation({
    mutationFn: (payload) => {
      const { settings, ...body } = payload;
      if (settings) {
        Object.entries(settings).forEach(([k, v]) => {
          body[`settings.${k}`] = v;
        });
      }
      return api.patch('/auth/me/profile', body);
    },
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
    },
  });

  const notifMutation = useMutation({
    mutationFn: (vals) => {
      // Send as FormData so values arrive as strings — backend compares === 'true'
      const fd = new FormData();
      fd.append('settings.emailNotifications', vals.emailNotifications);
      fd.append('settings.pushNotifications', vals.pushNotifications);
      return api.patch('/auth/me/profile', fd);
    },
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.patch('/auth/me/profile', fd);
    },
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
    },
  });

  const sendVerifyMutation = useMutation({
    mutationFn: () => api.post('/auth/send-verification'),
    onSuccess: () => setVerifySent(true),
  });

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of all devices? You will need to log in again.')) return;
    setLogoutAllLoading(true);
    try {
      await api.post('/auth/logout-all');
    } catch (_) {}
    finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const me = data?.user || data?.data || user;
  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.username;
  const friendships = friendsData?.friendships || friendsData?.data || [];
  const notes = notesData?.notes || notesData?.data || [];
  const tasks = tasksData?.tasks || tasksData?.data || [];
  const flashcardSets = flashcardsData?.sets || [];
  const applications = appsData?.applications || appsData?.data || [];
  const resumes = resumesData?.resumes || resumesData?.data || [];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'editProfile', label: 'Edit Profile' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'integrations', label: 'Integrations' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="text-secondary text-sm mt-0.5">Your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-primary text-white'
                : 'bg-accent text-foreground/70 hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Email verification banner */}
          {me && !me.emailVerified && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <ShieldAlert size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                Your email is not verified. Verify it to secure your account.
              </p>
              <button
                onClick={() => setActiveTab('integrations')}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline flex-shrink-0"
              >
                Verify now
              </button>
            </div>
          )}

          {/* Profile header */}
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <Avatar name={fullName} src={me?.avatarUrl} size="xl" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground">{fullName || 'Your Name'}</h2>
                <p className="text-sm text-secondary flex items-center gap-1 mt-0.5">
                  <AtSign size={12} /> {me?.username}
                </p>
                {me?.createdAt && (
                  <p className="text-xs text-secondary/70 flex items-center gap-1 mt-1">
                    <CalendarIcon size={11} /> Joined {formatDate(me.createdAt)}
                  </p>
                )}
                <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                  <Users size={11} /> {friendships.length} friend{friendships.length !== 1 ? 's' : ''}
                </p>
                {me?.bio && (
                  <p className="text-sm text-foreground/80 mt-3 pt-3 border-t border-border leading-relaxed">
                    {me.bio}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('editProfile')}>
                Edit
              </Button>
            </div>
          </Card>

          {/* Content lists */}
          <OverviewSection
            icon={FileText}
            label="Notes"
            items={notes.slice(0, 5)}
            renderItem={n => (
              <Link key={n._id} to="/notes/view" state={{ id: n._id }} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors group">
                <span className="text-sm text-foreground truncate">{n.title || 'Untitled'}</span>
                <ChevronRight size={13} className="text-secondary opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </Link>
            )}
            emptyMsg="No notes yet."
            allCount={notes.length}
            allLink="/notes"
          />

          <OverviewSection
            icon={CheckSquare}
            label="Tasks"
            items={tasks.slice(0, 5)}
            renderItem={t => (
              <Link key={t._id} to="/tasks" className="flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors group">
                <span className="text-sm text-foreground truncate">{t.title || 'Untitled'}</span>
                <ChevronRight size={13} className="text-secondary opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </Link>
            )}
            emptyMsg="No tasks yet."
            allCount={tasks.length}
            allLink="/tasks"
          />

          <OverviewSection
            icon={Layers}
            label="Flashcard Sets"
            items={flashcardSets.slice(0, 5)}
            renderItem={s => (
              <Link key={s._id} to="/flashcards/view" state={{ id: s._id }} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors group">
                <span className="text-sm text-foreground truncate">{s.title || 'Untitled'}</span>
                <ChevronRight size={13} className="text-secondary opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </Link>
            )}
            emptyMsg="No flashcard sets yet."
            allCount={flashcardSets.length}
            allLink="/flashcards"
          />

          <OverviewSection
            icon={Briefcase}
            label="Applications"
            items={applications.slice(0, 5)}
            renderItem={a => (
              <Link key={a._id} to="/applications/view" state={{ id: a._id }} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors group">
                <span className="text-sm text-foreground truncate">{a.company || a.position || 'Untitled'}</span>
                <ChevronRight size={13} className="text-secondary opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </Link>
            )}
            emptyMsg="No applications yet."
            allCount={applications.length}
            allLink="/applications"
          />

          <OverviewSection
            icon={FileCheck}
            label="Resumes"
            items={resumes.slice(0, 5)}
            renderItem={r => (
              <Link key={r._id} to="/resumes" className="flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors group">
                <span className="text-sm text-foreground truncate">{r.title || r.fileName || 'Untitled'}</span>
                <ChevronRight size={13} className="text-secondary opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </Link>
            )}
            emptyMsg="No resumes yet."
            allCount={resumes.length}
            allLink="/resumes"
          />
        </div>
      )}

      {/* ── Edit Profile ── */}
      {activeTab === 'editProfile' && (
        <form
          onSubmit={profileForm.handleSubmit(data => profileMutation.mutate(data))}
          className="space-y-5"
        >
          {/* Avatar */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4">Profile photo</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar name={fullName} src={me?.avatarUrl} size="xl" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-sm hover:bg-primary-hover transition-colors"
                >
                  <Camera size={13} className="text-white" />
                </button>
              </div>
              <div>
                <p className="font-medium text-foreground">{fullName}</p>
                <p className="text-sm text-secondary">@{me?.username}</p>
                <p className="text-xs text-secondary mt-1">Click the camera to update your photo</p>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0];
                if (file) avatarMutation.mutate(file);
              }}
            />
          </Card>

          {/* Info */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4">Personal info</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name" {...profileForm.register('firstName')} />
                <Input label="Last name" {...profileForm.register('lastName')} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Bio</label>
                <textarea
                  {...profileForm.register('bio')}
                  className="input-field resize-none min-h-[80px]"
                  placeholder="Tell people a little about yourself..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Activity visibility
                </label>
                <select {...profileForm.register('settings.activityVisibility')} className="input-field">
                  <option value="private">Private — only you</option>
                  <option value="friends">Friends only</option>
                  <option value="public">Public — everyone</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="submit" loading={profileMutation.isPending}>
                <Save size={15} /> Save changes
              </Button>
            </div>
            {profileMutation.isSuccess && (
              <p className="text-xs text-green-600 mt-2 text-right">Profile updated!</p>
            )}
          </Card>
        </form>
      )}

      {/* ── Notifications ── */}
      {activeTab === 'notifications' && (
        <form onSubmit={notifForm.handleSubmit(vals => notifMutation.mutate(vals))} className="space-y-4">
          <Card>
            <h3 className="font-semibold text-foreground mb-1">Notification preferences</h3>
            <p className="text-xs text-secondary mb-5">Choose how you want to be notified.</p>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email notifications</p>
                    <p className="text-xs text-secondary">Receive updates and alerts via email</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={notifForm.watch('emailNotifications')}
                  {...notifForm.register('emailNotifications')}
                  onChange={e => notifForm.setValue('emailNotifications', e.target.checked)}
                />
              </label>
              <div className="border-t border-border" />
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Push notifications</p>
                    <p className="text-xs text-secondary">Receive in-browser push alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={notifForm.watch('pushNotifications')}
                  {...notifForm.register('pushNotifications')}
                  onChange={e => notifForm.setValue('pushNotifications', e.target.checked)}
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {notifSaved && <p className="text-xs text-green-600">Saved!</p>}
              <Button type="submit" loading={notifMutation.isPending}>
                <Save size={15} /> Save
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ── Integrations ── */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {/* Email verification */}
          <Card>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${me?.emailVerified ? 'bg-green-50' : 'bg-amber-50'}`}>
                {me?.emailVerified
                  ? <ShieldCheck size={18} className="text-green-600" />
                  : <ShieldAlert size={18} className="text-amber-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">Email verification</p>
                  {me?.emailVerified
                    ? <Badge variant="success">Verified</Badge>
                    : <Badge variant="warning">Unverified</Badge>
                  }
                </div>
                <p className="text-xs text-secondary mt-0.5 flex items-center gap-1">
                  <Mail size={10} /> {me?.email}
                </p>
                {verifySent && (
                  <p className="text-xs text-green-600 mt-1">Check your inbox — link sent!</p>
                )}
                {sendVerifyMutation.isError && (
                  <p className="text-xs text-red-500 mt-1">
                    {sendVerifyMutation.error?.response?.data?.error || 'Failed to send. Try again.'}
                  </p>
                )}
              </div>
              {!me?.emailVerified && !verifySent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendVerifyMutation.mutate()}
                  loading={sendVerifyMutation.isPending}
                >
                  Send verification email
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Google Account</p>
                <p className="text-xs text-secondary">
                  {me?.googleId ? 'Connected · Drive export enabled' : 'Not connected — link to enable Drive export'}
                </p>
              </div>
              {me?.googleId ? (
                <div className="flex items-center gap-2">
                  <Badge variant="success">Connected</Badge>
                  <Button size="sm" variant="outline" onClick={() => api.delete('/auth/me/google/link').catch(() => {})}>
                    <Unlink size={13} /> Unlink
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => { window.location.href = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/auth/google'; }}>
                  <LinkIcon size={13} /> Connect
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <RefreshCw size={18} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Google Drive Import</p>
                <p className="text-xs text-secondary mt-0.5">
                  {me?.googleId
                    ? 'Your account is connected. Import Google Docs directly from the Notes page using the Import button.'
                    : 'Connect your Google Account above to import documents from Google Drive into Notes.'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <LogOut size={18} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Sign out all devices</p>
                <p className="text-xs text-secondary">End all active sessions across every device</p>
              </div>
              <Button size="sm" variant="danger" onClick={handleLogoutAll} loading={logoutAllLoading}>
                <LogOut size={13} /> Sign out all
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function OverviewSection({ icon: Icon, label, items, renderItem, emptyMsg, allCount, allLink }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-secondary flex items-center gap-2">
          <Icon size={12} /> {label}
        </h3>
        {allCount > 0 && (
          <Link to={allLink} className="text-xs text-primary hover:underline">
            View all ({allCount})
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-secondary px-4 py-3">{emptyMsg}</p>
      ) : (
        <div className="divide-y divide-border">
          {items.map(item => renderItem(item))}
        </div>
      )}
    </Card>
  );
}

