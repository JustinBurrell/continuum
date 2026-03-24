import { useState, useRef, useEffect, forwardRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Camera, LinkIcon, Unlink, LogOut,
  Bell, FileText, Layers, Briefcase, FileCheck,
  CheckSquare, Users, AtSign, Calendar as CalendarIcon,
  ChevronRight, ShieldCheck, ShieldAlert, Mail,
  Edit3, Shield, User, Eye, EyeOff, KeyRound,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

const card = {
  background: '#fff',
  border: '1px solid #ede9fe',
  borderRadius: 16,
  boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
  padding: '20px 24px',
  marginBottom: 16,
};

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#a087b0',
  marginBottom: 10,
  marginTop: 4,
};

const FieldInput = forwardRef(function FieldInput({ label, error, ...props }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      <input
        ref={ref}
        style={{
          padding: '9px 12px',
          borderRadius: 10,
          border: `1px solid ${error ? '#fca5a5' : '#ede9fe'}`,
          background: '#fef7ff',
          fontSize: 13,
          color: '#111827',
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = error ? '#dc2626' : '#6b21a8'}
        onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#ede9fe'}
        {...props}
      />
      {error && <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>{error}</p>}
    </div>
  );
});

const PasswordInput = forwardRef(function PasswordInput({ label, error, ...props }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          style={{
            padding: '9px 40px 9px 12px',
            borderRadius: 10,
            border: `1px solid ${error ? '#fca5a5' : '#ede9fe'}`,
            background: '#fef7ff',
            fontSize: 13,
            color: '#111827',
            outline: 'none',
            transition: 'border-color 0.15s',
            width: '100%',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = error ? '#dc2626' : '#6b21a8'}
          onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#ede9fe'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#a087b0',
            display: 'flex', alignItems: 'center', padding: 2,
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>{error}</p>}
    </div>
  );
});

function PasswordRequirements({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'At least one letter', ok: /[a-zA-Z]/.test(password) },
    { label: 'At least one number', ok: /\d/.test(password) },
    { label: 'At least one special character', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
      {checks.map(c => (
        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
            background: c.ok ? '#dcfce7' : '#f5f0ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, color: c.ok ? '#16a34a' : '#a087b0', fontWeight: 700 }}>
              {c.ok ? '✓' : '✗'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: c.ok ? '#16a34a' : '#a087b0' }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function AvatarCropModal({ file, onSave, onClose }) {
  const CROP_SIZE = 280;
  const [imgSrc, setImgSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const imgEl = useRef(new Image());
  const containerRef = useRef(null);
  const minScale = useRef(1);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      const img = imgEl.current;
      img.onload = () => {
        // Scale to fill (cover) the crop area
        const cover = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
        minScale.current = cover;
        setScale(cover);
        setOffset({ x: 0, y: 0 });
      };
      img.src = src;
      setImgSrc(src);
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Non-passive wheel listener to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      setScale(s => Math.max(minScale.current, Math.min(5, s - e.deltaY * 0.003)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [imgSrc]);

  const handleMouseDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    const img = imgEl.current;
    const imgW = img.naturalWidth * scale;
    const imgH = img.naturalHeight * scale;
    const drawX = (CROP_SIZE - imgW) / 2 + offset.x;
    const drawY = (CROP_SIZE - imgH) / 2 + offset.y;
    ctx.drawImage(img, drawX, drawY, imgW, imgH);
    canvas.toBlob(blob => {
      if (blob) onSave(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 24, width: 340,
        boxShadow: '0 20px 60px rgba(107,33,168,0.25)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>Adjust photo</h3>
        <p style={{ fontSize: 12, color: '#a087b0', margin: '0 0 16px' }}>Drag to reposition · Scroll to zoom</p>
        <div
          ref={containerRef}
          style={{
            width: CROP_SIZE, height: CROP_SIZE, borderRadius: '50%',
            overflow: 'hidden', position: 'relative',
            cursor: dragging ? 'grabbing' : 'grab',
            background: '#f5f0ff', margin: '0 auto 16px',
            border: '3px solid #6b21a8', flexShrink: 0,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imgSrc && (
            <img
              src={imgSrc}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                transformOrigin: 'center',
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={onClose}>Cancel</Button>
          <Button style={{ flex: 1 }} onClick={handleCrop}>Save photo</Button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });

  // Overview data — only load when on overview tab
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

  // Profile form
  const { register: regProfile, handleSubmit: hProfile, formState: { errors: pErrors, isDirty: pDirty }, reset: resetProfile } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      'settings.activityVisibility': user?.settings?.activityVisibility || 'friends',
    },
  });

  // Username form
  const { register: regUser, handleSubmit: hUser, formState: { errors: uErrors }, setError: setUserError } = useForm({
    defaultValues: { username: user?.username || '' },
  });

  // Notifications form
  const notifForm = useForm({
    defaultValues: {
      emailNotifications: user?.settings?.emailNotifications ?? true,
      pushNotifications: user?.settings?.pushNotifications ?? true,
    },
  });

  // Password form
  const { register: regPwd, handleSubmit: hPwd, formState: { errors: pwErrors }, setError: setPwError, reset: resetPwd, watch: watchPwd } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPwdWatch = watchPwd('newPassword', '');

  useEffect(() => { setNewPasswordValue(newPwdWatch); }, [newPwdWatch]);

  // Sync profile + notif forms when fresh /me data loads
  useEffect(() => {
    if (data) {
      const fresh = data.user || data.data;
      if (!fresh) return;
      resetProfile({
        firstName: fresh.firstName || '',
        lastName: fresh.lastName || '',
        bio: fresh.bio || '',
        'settings.activityVisibility': fresh.settings?.activityVisibility || 'friends',
      });
      notifForm.reset({
        emailNotifications: fresh.settings?.emailNotifications ?? true,
        pushNotifications: fresh.settings?.pushNotifications ?? true,
      });
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Profile mutation
  const profileMutation = useMutation({
    mutationFn: (payload) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
      return api.patch('/auth/me/profile', fd);
    },
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
      toast({ type: 'success', message: 'Profile updated' });
    },
    onError: () => toast({ type: 'error', message: 'Failed to save profile' }),
  });

  // Username mutation
  const usernameMutation = useMutation({
    mutationFn: ({ username }) => api.patch('/auth/me/username', { username }),
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
      toast({ type: 'success', message: 'Username updated' });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to update username';
      if (err?.response?.status === 409) {
        setUserError('username', { message: 'Username is already taken' });
      } else {
        setUserError('username', { message: msg });
      }
    },
  });

  // Notifications mutation
  const notifMutation = useMutation({
    mutationFn: (vals) => {
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

  // Avatar mutation
  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.patch('/auth/me/profile', fd);
    },
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
      toast({ type: 'success', message: 'Avatar updated' });
    },
  });

  // Password mutation
  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      api.patch('/auth/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      resetPwd();
      setNewPasswordValue('');
      toast({ type: 'success', message: 'Password updated successfully' });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to update password';
      if (err?.response?.status === 401) {
        setPwError('currentPassword', { message: 'Current password is incorrect' });
      } else {
        toast({ type: 'error', message: msg });
      }
    },
  });

  // Send verification
  const sendVerifyMutation = useMutation({
    mutationFn: () => api.post('/auth/send-verification'),
    onSuccess: () => setVerifySent(true),
  });

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of all devices? You will need to log in again.')) return;
    setLogoutAllLoading(true);
    try { await api.post('/auth/logout-all'); } catch (_) {}
    finally { localStorage.clear(); navigate('/login'); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account and all data? This cannot be undone.')) return;
    if (!window.confirm('Last chance — this will delete all your notes, tasks, flashcards, and messages forever.')) return;
    setDeleteAccountLoading(true);
    try {
      await api.delete('/auth/me');
      localStorage.clear();
      navigate('/login');
    } catch (_) {
      toast.error('Failed to delete account. Please try again.');
      setDeleteAccountLoading(false);
    }
  };

  const onProfileSave = (vals) => {
    if (!pDirty) return;
    profileMutation.mutate(vals);
  };

  const onPasswordSave = (vals) => {
    if (vals.newPassword !== vals.confirmPassword) {
      setPwError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    passwordMutation.mutate({ currentPassword: vals.currentPassword, newPassword: vals.newPassword });
  };

  const me = user || data?.user || data?.data;
  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.username;
  const friendships = friendsData?.friendships || friendsData?.data || [];
  const notes = notesData?.notes || notesData?.data || [];
  const tasks = tasksData?.tasks || tasksData?.data || [];
  const flashcardSets = flashcardsData?.sets || [];
  const applications = appsData?.applications || appsData?.data || [];
  const resumes = resumesData?.resumes || resumesData?.data || [];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'profile', label: 'Profile', icon: Edit3 },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>Manage your account and preferences</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
      <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', background: '#f5f0ff', borderRadius: 14, padding: 4 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                border: 'none',
                background: active ? '#6b21a8' : 'transparent',
                color: active ? '#fff' : '#a087b0',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div>
          {/* Email verification banner */}
          {me && !me.emailVerified && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
              padding: '12px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                  Verify your email to unlock all features.
                </p>
              </div>
              <Button size="sm" variant="outline"
                loading={sendVerifyMutation.isPending}
                onClick={() => sendVerifyMutation.mutate()}
                style={{ borderColor: '#fbbf24', color: '#92400e', background: 'transparent', flexShrink: 0 }}
              >
                {verifySent ? 'Sent!' : 'Send email'}
              </Button>
            </div>
          )}

          {/* Profile header card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Avatar name={fullName} src={me?.avatarUrl} size="xl" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: '#111827', margin: 0 }}>{fullName}</p>
                <p style={{ fontSize: 13, color: '#a087b0', margin: '2px 0 6px' }}>@{me?.username}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarIcon size={11} /> Joined {formatDate(me?.createdAt)}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {friendships.length} friend{friendships.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {me?.bio && <p style={{ fontSize: 13, color: '#374151', marginTop: 8, marginBottom: 0 }}>{me.bio}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('profile')}>
                <Edit3 size={13} /> Edit
              </Button>
            </div>
          </div>

          {/* Content overview sections */}
          {[
            { label: 'Notes', icon: FileText, items: notes, path: '/notes', keyFn: n => n.title || 'Untitled', itemNav: n => ['/notes/view', { id: n._id }] },
            { label: 'Tasks', icon: CheckSquare, items: tasks, path: '/tasks', keyFn: t => t.title, itemNav: t => ['/tasks', { openTaskId: t._id }] },
            { label: 'Flashcard Sets', icon: Layers, items: flashcardSets, path: '/flashcards', keyFn: s => s.title, itemNav: s => ['/flashcards/view', { id: s._id }] },
            { label: 'Applications', icon: Briefcase, items: applications, path: '/applications', keyFn: a => a.company, itemNav: a => ['/applications/view', { application: a }], stageFn: a => a.stage || a.status },
            { label: 'Resumes', icon: FileCheck, items: resumes, path: '/resumes', keyFn: r => r.fileName || r.name, itemNav: null },
          ].map(({ label, icon: Icon, items, path, keyFn, itemNav, stageFn }) => (
            <div key={label} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: items.length > 0 ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} style={{ color: '#6b21a8' }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#a087b0', background: '#f5f0ff', padding: '1px 7px', borderRadius: 20 }}>{items.length}</span>
                </div>
                <Link to={path} style={{ fontSize: 12, color: '#6b21a8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              {items.slice(0, 3).map((item, i) => {
                const text = keyFn(item);
                const nav = itemNav ? itemNav(item) : null;
                const stage = stageFn ? stageFn(item) : null;
                const stageColors = {
                  draft:     { bg: '#f3f4f6', color: '#6b7280' },
                  applied:   { bg: '#eff6ff', color: '#2563eb' },
                  interview: { bg: '#fdf4ff', color: '#7c3aed' },
                  offer:     { bg: '#f0fdf4', color: '#16a34a' },
                  rejected:  { bg: '#fef2f2', color: '#dc2626' },
                  withdrawn: { bg: '#f3f4f6', color: '#6b7280' },
                };
                const sc = stageColors[stage] || stageColors.draft;
                return (
                  <div
                    key={i}
                    onClick={() => nav ? navigate(nav[0], { state: nav[1] }) : navigate(path)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, padding: '6px 0',
                      borderTop: '1px solid #ede9fe', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.querySelector('.item-text').style.color = '#6b21a8'; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.item-text').style.color = '#374151'; }}
                  >
                    <span className="item-text" style={{ fontSize: 13, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {text}
                    </span>
                    {stage && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        background: sc.bg, color: sc.color, flexShrink: 0, textTransform: 'capitalize',
                      }}>
                        {stage}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ─── PROFILE TAB ─── */}
      {activeTab === 'profile' && (
        <div>
          {/* Avatar */}
          <div style={card}>
            <p style={sectionLabel}>Photo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={fullName} src={me?.avatarUrl} size="xl" />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#6b21a8', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(107,33,168,0.3)',
                  }}
                >
                  <Camera size={12} style={{ color: '#fff' }} />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files[0]; if (f) { setCropFile(f); e.target.value = ''; } }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{fullName}</p>
                <p style={{ fontSize: 12, color: '#a087b0', margin: 0 }}>JPG or PNG, max 5 MB</p>
              </div>
              {avatarMutation.isPending && <span style={{ fontSize: 12, color: '#a087b0' }}>Uploading…</span>}
            </div>
          </div>

          {/* Personal info */}
          <div style={card}>
            <p style={sectionLabel}>Personal info</p>
            <form onSubmit={hProfile(onProfileSave)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <FieldInput label="First name" error={pErrors.firstName?.message}
                  {...regProfile('firstName', { required: 'Required' })} />
                <FieldInput label="Last name"
                  {...regProfile('lastName')} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Bio</label>
                <textarea
                  rows={3}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: '1px solid #ede9fe', background: '#fef7ff',
                    fontSize: 13, color: '#111827', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', transition: 'border-color 0.15s', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6b21a8'}
                  onBlur={e => e.target.style.borderColor = '#ede9fe'}
                  {...regProfile('bio')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Activity visibility
                </label>
                <select
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: '1px solid #ede9fe', background: '#fef7ff',
                    fontSize: 13, color: '#111827', outline: 'none', cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                  {...regProfile('settings.activityVisibility')}
                >
                  <option value="private">Private — only you</option>
                  <option value="friends">Friends — your accepted friends</option>
                </select>
              </div>
              <Button type="submit" loading={profileMutation.isPending} disabled={!pDirty}>
                Save changes
              </Button>
            </form>
          </div>

          {/* Username */}
          <div style={card}>
            <p style={sectionLabel}>Username</p>
            <form onSubmit={hUser(vals => usernameMutation.mutate(vals))}>
              <div style={{ marginBottom: 12 }}>
                <FieldInput
                  label="Username"
                  error={uErrors.username?.message}
                  placeholder="your_username"
                  {...regUser('username', {
                    required: 'Username is required',
                    pattern: {
                      value: /^[a-z0-9_-]{3,30}$/i,
                      message: 'Must be 3–30 chars: letters, numbers, _ or -',
                    },
                  })}
                />
                <p style={{ fontSize: 11, color: '#a087b0', marginTop: 5 }}>
                  3–30 characters. Letters, numbers, underscores and hyphens only.
                </p>
              </div>
              <Button type="submit" loading={usernameMutation.isPending}>
                Update username
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ─── SECURITY TAB ─── */}
      {activeTab === 'security' && (
        <div>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KeyRound size={17} style={{ color: '#6b21a8' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Change password</p>
                <p style={{ fontSize: 12, color: '#a087b0', margin: 0 }}>
                  {me?.googleId ? 'Google sign-in users must use Forgot Password to set a password first.' : 'Use a strong, unique password.'}
                </p>
              </div>
            </div>

            <form onSubmit={hPwd(onPasswordSave)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <PasswordInput
                  label="Current password"
                  error={pwErrors.currentPassword?.message}
                  {...regPwd('currentPassword', { required: 'Required' })}
                />
                <PasswordInput
                  label="New password"
                  error={pwErrors.newPassword?.message}
                  {...regPwd('newPassword', { required: 'Required' })}
                />
                {newPasswordValue.length > 0 && (
                  <PasswordRequirements password={newPasswordValue} />
                )}
                <PasswordInput
                  label="Confirm new password"
                  error={pwErrors.confirmPassword?.message}
                  {...regPwd('confirmPassword', { required: 'Required' })}
                />
              </div>
              <Button type="submit" loading={passwordMutation.isPending}>
                Update password
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS TAB ─── */}
      {activeTab === 'notifications' && (
        <div>
          <div style={card}>
            <p style={sectionLabel}>Email & push</p>
            <form onSubmit={notifForm.handleSubmit(vals => notifMutation.mutate(vals))}>
              {[
                { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive activity updates via email' },
                { key: 'pushNotifications', label: 'Push notifications', desc: 'Browser notifications for real-time updates' },
              ].map(({ key, label, desc }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0', borderBottom: '1px solid #ede9fe', cursor: 'pointer', gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#a087b0', margin: '2px 0 0' }}>{desc}</p>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <input type="checkbox" style={{ display: 'none' }} {...notifForm.register(key)} />
                    <div
                      onClick={() => notifForm.setValue(key, !notifForm.watch(key), { shouldDirty: true })}
                      style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: notifForm.watch(key) ? '#6b21a8' : '#e5e7eb',
                        transition: 'background 0.2s', cursor: 'pointer', position: 'relative',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3, left: notifForm.watch(key) ? 21 : 3,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }} />
                    </div>
                  </div>
                </label>
              ))}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button type="submit" loading={notifMutation.isPending}>Save</Button>
                {notifSaved && <span style={{ fontSize: 12, color: '#16a34a' }}>Saved!</span>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INTEGRATIONS TAB ─── */}
      {activeTab === 'integrations' && (
        <div>
          {/* Email verification */}
          <div style={card}>
            <p style={sectionLabel}>Email</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={17} style={{ color: '#6b21a8' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{me?.email}</p>
                  <div style={{ marginTop: 3 }}>
                    {me?.emailVerified
                      ? <Badge variant="success"><ShieldCheck size={10} style={{ marginRight: 3 }} />Verified</Badge>
                      : <Badge variant="warning"><ShieldAlert size={10} style={{ marginRight: 3 }} />Not verified</Badge>
                    }
                  </div>
                </div>
              </div>
              {!me?.emailVerified && (
                <Button size="sm" variant="outline"
                  loading={sendVerifyMutation.isPending}
                  onClick={() => sendVerifyMutation.mutate()}
                >
                  {verifySent ? 'Email sent!' : 'Verify email'}
                </Button>
              )}
            </div>
          </div>

          {/* Google */}
          <div style={card}>
            <p style={sectionLabel}>Google</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AtSign size={17} style={{ color: '#6b21a8' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Google Account</p>
                  <div style={{ marginTop: 3 }}>
                    {me?.googleId
                      ? <Badge variant="success">Connected</Badge>
                      : <Badge variant="neutral">Not connected</Badge>
                    }
                  </div>
                </div>
              </div>
              {me?.googleId ? (
                <Button size="sm" variant="outline"
                  onClick={() => {
                    if (window.confirm('Unlink your Google account?')) {
                      api.delete('/auth/me/google/link', { data: { keepNotes: true } })
                        .then(r => { const u = r.data.user || r.data.data; if (u) updateUser(u); })
                        .catch(e => toast({ type: 'error', message: e?.response?.data?.error || 'Failed to unlink' }));
                    }
                  }}
                >
                  <Unlink size={13} /> Unlink
                </Button>
              ) : (
                <Button size="sm" variant="outline"
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}
                >
                  <LinkIcon size={13} /> Connect
                </Button>
              )}
            </div>
            {me?.googleId && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f5f0ff', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: '#6b21a8', margin: 0 }}>
                  Google Drive connected — you can import Google Docs as notes from the Notes page.
                </p>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div style={{ ...card, borderColor: '#fecaca', background: '#fff' }}>
            <p style={{ ...sectionLabel, color: '#dc2626' }}>Danger zone</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Sign out of all devices</p>
                  <p style={{ fontSize: 12, color: '#a087b0', margin: '2px 0 0' }}>Revokes all active sessions. You will need to log in again.</p>
                </div>
                <Button size="sm" variant="danger" loading={logoutAllLoading} onClick={handleLogoutAll}>
                  <LogOut size={13} /> Sign out all
                </Button>
              </div>
              <div style={{ borderTop: '1px solid #fecaca', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', margin: 0 }}>Delete account</p>
                  <p style={{ fontSize: 12, color: '#a087b0', margin: '2px 0 0' }}>Permanently deletes your account and all data. This cannot be undone.</p>
                </div>
                <Button size="sm" variant="danger" loading={deleteAccountLoading} onClick={handleDeleteAccount}>
                  Delete account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onSave={(croppedFile) => {
            setCropFile(null);
            avatarMutation.mutate(croppedFile);
          }}
          onClose={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
