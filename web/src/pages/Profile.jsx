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
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

const cardStyle = {
  background: '#fff',
  border: '1px solid #ede9fe',
  borderRadius: 16,
  boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
  padding: '20px 24px',
  marginBottom: 16,
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
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
      // Send as FormData so values arrive as strings -- backend compares === 'true'
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
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>Your account and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: activeTab === t.key ? '#6b21a8' : '#f5f0ff',
              color: activeTab === t.key ? '#fff' : '#6b21a8',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Email verification banner */}
          {me && !me.emailVerified && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
            }}>
              <ShieldAlert size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#92400e', flex: 1, margin: 0 }}>
                Your email is not verified. Verify it to secure your account.
              </p>
              <button
                onClick={() => setActiveTab('integrations')}
                style={{ fontSize: 12, fontWeight: 600, color: '#b45309', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}
              >
                Verify now
              </button>
            </div>
          )}

          {/* Profile header card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Avatar name={fullName} src={me?.avatarUrl} size="xl" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {fullName || 'Your Name'}
                </h2>
                <p style={{ fontSize: 13, color: '#a087b0', display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0 0' }}>
                  <AtSign size={12} /> {me?.username}
                </p>
                {me?.createdAt && (
                  <p style={{ fontSize: 11, color: '#c4b5d4', display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0 0' }}>
                    <CalendarIcon size={11} /> Joined {formatDate(me.createdAt)}
                  </p>
                )}
                <p style={{ fontSize: 11, color: '#c4b5d4', display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0 0' }}>
                  <Users size={11} /> {friendships.length} friend{friendships.length !== 1 ? 's' : ''}
                </p>
                {me?.bio && (
                  <p style={{ fontSize: 13, color: '#374151', marginTop: 12, paddingTop: 12, borderTop: '1px solid #ede9fe', lineHeight: 1.6 }}>
                    {me.bio}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('editProfile')}>
                Edit
              </Button>
            </div>
          </div>

          {/* Content sections */}
          <OverviewSection
            icon={FileText}
            label="Notes"
            items={notes.slice(0, 5)}
            renderItem={n => (
              <Link key={n._id} to="/notes/view" state={{ id: n._id }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{n.title || 'Untitled'}</span>
                <ChevronRight size={13} style={{ color: '#a087b0', flexShrink: 0 }} />
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
              <Link key={t._id} to="/tasks" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t.title || 'Untitled'}</span>
                <ChevronRight size={13} style={{ color: '#a087b0', flexShrink: 0 }} />
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
              <Link key={s._id} to="/flashcards/view" state={{ id: s._id }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.title || 'Untitled'}</span>
                <ChevronRight size={13} style={{ color: '#a087b0', flexShrink: 0 }} />
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
              <Link key={a._id} to="/applications/view" state={{ id: a._id }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{a.company || a.position || 'Untitled'}</span>
                <ChevronRight size={13} style={{ color: '#a087b0', flexShrink: 0 }} />
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
              <Link key={r._id} to="/resumes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', textDecoration: 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.title || r.fileName || 'Untitled'}</span>
                <ChevronRight size={13} style={{ color: '#a087b0', flexShrink: 0 }} />
              </Link>
            )}
            emptyMsg="No resumes yet."
            allCount={resumes.length}
            allLink="/resumes"
          />
        </div>
      )}

      {/* Edit Profile */}
      {activeTab === 'editProfile' && (
        <form
          onSubmit={profileForm.handleSubmit(data => profileMutation.mutate(data))}
          style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          {/* Avatar */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Profile photo</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={fullName} src={me?.avatarUrl} size="xl" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#6b21a8',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(107,33,168,0.3)',
                  }}
                >
                  <Camera size={13} style={{ color: '#fff' }} />
                </button>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>{fullName}</p>
                <p style={{ fontSize: 13, color: '#a087b0', margin: '3px 0 0' }}>@{me?.username}</p>
                <p style={{ fontSize: 11, color: '#c4b5d4', margin: '4px 0 0' }}>Click the camera icon to update your photo</p>
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
          </div>

          {/* Info */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Personal info</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name" {...profileForm.register('firstName')} />
                <Input label="Last name" {...profileForm.register('lastName')} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Bio</label>
                <textarea
                  {...profileForm.register('bio')}
                  className="input-field resize-none min-h-[80px]"
                  placeholder="Tell people a little about yourself..."
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Activity visibility
                </label>
                <select {...profileForm.register('settings.activityVisibility')} className="input-field">
                  <option value="private">Private - only you</option>
                  <option value="friends">Friends only</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
              {profileMutation.isSuccess && (
                <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>Profile updated!</p>
              )}
              <Button type="submit" loading={profileMutation.isPending}>
                <Save size={15} /> Save changes
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <form onSubmit={notifForm.handleSubmit(vals => notifMutation.mutate(vals))}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Notification preferences</h3>
            <p style={{ fontSize: 12, color: '#a087b0', margin: '0 0 20px' }}>Choose how you want to be notified.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive updates and alerts via email' },
                { key: 'pushNotifications', label: 'Push notifications', desc: 'Receive in-browser push alerts' },
              ].map((item, idx) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '14px 0',
                    borderTop: idx > 0 ? '1px solid #ede9fe' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(107,33,168,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Bell size={15} style={{ color: '#6b21a8' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: '#a087b0', margin: '2px 0 0' }}>{item.desc}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    style={{ width: 16, height: 16, accentColor: '#6b21a8' }}
                    checked={notifForm.watch(item.key)}
                    {...notifForm.register(item.key)}
                    onChange={e => notifForm.setValue(item.key, e.target.checked)}
                  />
                </label>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              {notifSaved && <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>Saved!</p>}
              <Button type="submit" loading={notifMutation.isPending}>
                <Save size={15} /> Save
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Email verification */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: me?.emailVerified ? '#f0fdf4' : '#fffbeb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {me?.emailVerified
                  ? <ShieldCheck size={20} style={{ color: '#16a34a' }} />
                  : <ShieldAlert size={20} style={{ color: '#f59e0b' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>Email verification</p>
                  {me?.emailVerified
                    ? <Badge variant="success">Verified</Badge>
                    : <Badge variant="warning">Unverified</Badge>
                  }
                </div>
                <p style={{ fontSize: 12, color: '#a087b0', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                  <Mail size={11} /> {me?.email}
                </p>
                {verifySent && (
                  <p style={{ fontSize: 12, color: '#16a34a', margin: '4px 0 0' }}>Check your inbox - link sent!</p>
                )}
                {sendVerifyMutation.isError && (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>
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
          </div>

          {/* Google */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>Google Account</p>
                <p style={{ fontSize: 12, color: '#a087b0', margin: '3px 0 0' }}>
                  {me?.googleId ? 'Connected. Drive export enabled.' : 'Not connected. Link to enable Drive export.'}
                </p>
              </div>
              {me?.googleId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge variant="success">Connected</Badge>
                  <Button size="sm" variant="outline" onClick={() =>
                    api.delete('/auth/me/google/link').catch((err) => {
                      const msg = err?.response?.data?.error || 'Failed to unlink Google account';
                      toast({ type: 'error', message: msg });
                    })
                  }>
                    <Unlink size={13} /> Unlink
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => { window.location.href = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/auth/google'; }}>
                  <LinkIcon size={13} /> Connect
                </Button>
              )}
            </div>
          </div>

          {/* Drive import */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <RefreshCw size={20} style={{ color: '#16a34a' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>Google Drive Import</p>
                <p style={{ fontSize: 12, color: '#a087b0', margin: '3px 0 0', lineHeight: 1.5 }}>
                  {me?.googleId
                    ? 'Your account is connected. Import Google Docs directly from the Notes page using the Import button.'
                    : 'Connect your Google Account above to import documents from Google Drive into Notes.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sign out all */}
          <div style={{
            ...cardStyle,
            border: '1px solid #fecaca',
            background: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <LogOut size={20} style={{ color: '#dc2626' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, margin: 0 }}>Sign out all devices</p>
                <p style={{ fontSize: 12, color: '#a087b0', margin: '3px 0 0' }}>End all active sessions across every device</p>
              </div>
              <Button size="sm" variant="danger" onClick={handleLogoutAll} loading={logoutAllLoading}>
                <LogOut size={13} /> Sign out all
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewSection({ icon: Icon, label, items, renderItem, emptyMsg, allCount, allLink }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ede9fe',
      borderRadius: 16,
      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #ede9fe',
      }}>
        <h3 style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#a087b0',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: 0,
        }}>
          <Icon size={12} /> {label}
        </h3>
        {allCount > 0 && (
          <Link to={allLink} style={{ fontSize: 12, color: '#6b21a8', textDecoration: 'none' }}>
            View all ({allCount})
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: '#a087b0', padding: '12px 20px', margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div>
          {items.map(item => renderItem(item))}
        </div>
      )}
    </div>
  );
}
