import { useState, useRef, useEffect, forwardRef } from 'react';
import { posthog } from '@/lib/posthog';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Camera, LinkIcon, Unlink, LogOut, Trash2,
  Bell, FileText, Layers, Briefcase, FileCheck,
  CheckSquare, Users, AtSign, Calendar as CalendarIcon,
  ChevronRight, ShieldCheck, ShieldAlert, Mail,
  Edit3, Shield, User, Eye, EyeOff, KeyRound,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import AppAvatar from '@/components/ui/AppAvatar';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import PasswordRequirements from '@/components/ui/PasswordRequirements';
import ConfirmModal from '@/components/ui/ConfirmModal';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import SocialLinks from '@/components/ui/SocialLinks';
import AvatarCropModal from '@/components/ui/AvatarCropModal';

const card = {
  background: '#fff',
  border: '1px solid #E5E7EB',
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
  color: '#9CA3AF',
  marginBottom: 10,
  marginTop: 4,
};

const FieldInput = forwardRef(function FieldInput({ label, error, required, ...props }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      <input
        ref={ref}
        style={{
          padding: '9px 12px',
          borderRadius: 10,
          border: `1px solid ${error ? '#fca5a5' : '#E5E7EB'}`,
          background: '#FFFFFF',
          fontSize: 13,
          color: '#111827',
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = error ? '#dc2626' : '#6b21a8'}
        onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#E5E7EB'}
        {...props}
      />
      {error && <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>{error}</p>}
    </div>
  );
});

const PasswordInput = forwardRef(function PasswordInput({ label, error, required, ...props }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          style={{
            padding: '9px 40px 9px 12px',
            borderRadius: 10,
            border: `1px solid ${error ? '#fca5a5' : '#E5E7EB'}`,
            background: '#FFFFFF',
            fontSize: 13,
            color: '#111827',
            outline: 'none',
            transition: 'border-color 0.15s',
            width: '100%',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = error ? '#dc2626' : '#6b21a8'}
          onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#E5E7EB'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
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



function DeleteAccountModal({ username, googleOnly, onClose, onConfirm, loading }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const usernameMatch = usernameInput.trim().toLowerCase() === username?.toLowerCase();

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28, width: 420, maxWidth: '92vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', margin: '0 0 6px' }}>Delete account</h3>
        <p style={{ fontSize: 13, color: '#374151', margin: '0 0 16px', lineHeight: 1.5 }}>
          Your account will be <strong>scheduled for deletion in 30 days</strong>. All your notes, tasks,
          flashcards, messages, and data will be permanently removed.
          You can restore it at any time by logging in before the deadline.
        </p>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
            After 30 days, this action is <strong>irreversible</strong>. This cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              Type your username to confirm
            </label>
            <input
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder={username}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                border: `1px solid ${usernameInput && !usernameMatch ? '#fca5a5' : '#E5E7EB'}`,
                background: '#FFFFFF', fontSize: 13, color: '#111827',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {usernameInput && !usernameMatch && (
              <p style={{ fontSize: 11, color: '#dc2626', margin: '4px 0 0' }}>Username does not match</p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              {googleOnly ? 'Password (leave blank if Google sign-in only)' : 'Enter your password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                style={{
                  width: '100%', padding: '9px 40px 9px 12px', borderRadius: 10,
                  border: '1px solid #E5E7EB', background: '#FFFFFF',
                  fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
              }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <button
            onClick={() => onConfirm(password)}
            disabled={!usernameMatch || loading}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
              background: usernameMatch ? '#dc2626' : '#f3f4f6',
              color: usernameMatch ? '#fff' : '#D1D5DB',
              fontSize: 13, fontWeight: 600, cursor: usernameMatch ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Profile() {
  const { user, updateUser, logout, setForceOnboardingOpen } = useAuth();
  const toast = useToast();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);                  // URL for editing existing uploaded avatar
  const [originalFile, setOriginalFile] = useState(null);       // raw pick — kept for re-crop
  const [pendingCroppedFile, setPendingCroppedFile] = useState(null); // cropped, not yet uploaded
  const [pendingOriginalFile, setPendingOriginalFile] = useState(null); // original (full res) — uploaded alongside crop
  const [localPreview, setLocalPreview] = useState(null);       // blob URL for preview before upload
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
    staleTime: 120_000,
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
      linkedinUrl: user?.linkedinUrl || '',
      instagramHandle: user?.instagramHandle || '',
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

  // Sync profile + notif forms when fresh /me data loads, and keep AuthContext in sync
  useEffect(() => {
    if (data) {
      const fresh = data.user || data.data;
      if (!fresh) return;
      updateUser(fresh);
      resetProfile({
        firstName: fresh.firstName || '',
        lastName: fresh.lastName || '',
        bio: fresh.bio || '',
        linkedinUrl: fresh.linkedinUrl || '',
        instagramHandle: fresh.instagramHandle || '',
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
      if (updated) {
        updateUser(updated);
        queryClient.setQueryData(['me'], (old) => old ? { ...old, user: updated } : old);
      }
      toast({ type: 'success', message: 'Profile updated' });
    },
    onError: () => toast({ type: 'error', message: 'Failed to save profile' }),
  });

  // Username mutation
  const usernameMutation = useMutation({
    mutationFn: ({ username }) => api.patch('/auth/me/username', { username }),
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) {
        updateUser(updated);
        queryClient.setQueryData(['me'], (old) => old ? { ...old, user: updated } : old);
      }
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
      if (updated) {
        updateUser(updated);
        queryClient.setQueryData(['me'], (old) => old ? { ...old, user: updated } : old);
      }
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    },
  });

  // Avatar mutation — sends the cropped display file and optionally the full-res original
  const avatarMutation = useMutation({
    mutationFn: ({ cropped, original }) => {
      const fd = new FormData();
      fd.append('avatar', cropped);
      if (original) fd.append('avatarOriginal', original);
      return api.patch('/auth/me/profile', fd);
    },
    onSuccess: (res) => {
      const updated = res.data.user || res.data.data;
      if (updated) {
        updateUser(updated);
        queryClient.setQueryData(['me'], (old) => old ? { ...old, user: updated } : old);
      }
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

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => api.get('/auth/sessions').then(r => r.data.sessions),
    enabled: !user?.isDemo,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (id) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth-sessions'] }),
    onError: () => toast({ type: 'error', message: 'Failed to revoke session' }),
  });

  const handleLogoutAll = () => setShowLogoutAllConfirm(true);

  const doLogoutAll = async () => {
    setShowLogoutAllConfirm(false);
    setLogoutAllLoading(true);
    try { await api.post('/auth/logout-all'); } catch (_) {}
    finally { localStorage.clear(); navigate('/login'); }
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDeleteAccount = async (password) => {
    setDeleteAccountLoading(true);
    try {
      await api.delete('/auth/me', { data: { password } });
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to delete account';
      toast({ type: 'error', message: msg });
      setDeleteAccountLoading(false);
    }
  };

  const handleRestoreAccount = async () => {
    setRestoreLoading(true);
    try {
      const res = await api.post('/auth/me/restore');
      const updated = res.data.user || res.data.data;
      if (updated) updateUser(updated);
      toast({ type: 'success', message: 'Account restored successfully' });
    } catch (_) {
      toast({ type: 'error', message: 'Failed to restore account. Please try again.' });
    } finally {
      setRestoreLoading(false);
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

  const me = data?.user || data?.data || user;
  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.username;
  const friendships = friendsData?.friendships || friendsData?.data || [];
  const notes = notesData?.notes || notesData?.data || [];
  const tasks = tasksData?.tasks || tasksData?.data || [];
  const flashcardSets = flashcardsData?.sets || [];

  const { data: streakData } = useQuery({
    queryKey: ['study-streak'],
    queryFn: () => api.get('/study-sessions/streak').then(r => r.data),
    staleTime: 300_000,
  });
  const streak = streakData?.streak ?? 0;
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
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Manage your account and preferences</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
      <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', background: '#F8F9FA', borderRadius: 14, padding: 4 }}>
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
                color: active ? '#fff' : '#6B7280',
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
              <AppAvatar name={fullName} src={me?.avatarUrl} size="xl" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: '#111827' }}>{fullName}</span>
                  <VerifiedBadge roles={me?.roles} expanded />
                </span>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 6px' }}>@{me?.username}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarIcon size={11} /> Joined {formatDate(me?.createdAt)}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {friendships.length} friend{friendships.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {me?.bio && <p style={{ fontSize: 13, color: '#374151', marginTop: 8, marginBottom: 0 }}>{me.bio}</p>}
                <SocialLinks user={me} style={{ marginTop: 8 }} />
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('profile')} data-tour-highlight="profile-edit">
                <Edit3 size={13} /> Edit
              </Button>
            </div>
          </div>

          {/* Study streak card */}
          {streak >= 1 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.875rem' }}>{streak >= 7 ? '🔥' : '⚡'}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 20, color: '#111827', lineHeight: 1 }}>{streak}</span>
                    <span style={{ fontSize: 13, color: '#9CA3AF', marginLeft: 6 }}>day study streak</span>
                  </div>
                </div>
                <Link to="/flashcards" style={{ fontSize: 12, color: '#6b21a8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                  Study now <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}

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
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} style={{ color: '#6b21a8' }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', background: 'rgba(107,33,168,0.08)', padding: '1px 7px', borderRadius: 20 }}>{items.length}</span>
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
                  draft:     { bg: '#F3F4F6', color: '#6B7280' },
                  applied:   { bg: 'rgba(107,33,168,0.08)', color: '#6b21a8' },
                  interview: { bg: 'rgba(217,119,6,0.08)', color: '#D97706' },
                  offer:     { bg: 'rgba(5,150,105,0.08)', color: '#059669' },
                  rejected:  { bg: '#FEE2E2', color: '#DC2626' },
                  withdrawn: { bg: '#F3F4F6', color: '#6B7280' },
                };
                const sc = stageColors[stage] || stageColors.draft;
                return (
                  <div
                    key={i}
                    onClick={() => nav ? navigate(nav[0], { state: nav[1] }) : navigate(path)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, padding: '6px 0',
                      borderTop: '1px solid #E5E7EB', cursor: 'pointer',
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
          {/* Feature tour — hidden for demo and seed accounts */}
          {!user?.isDemo && !user?.isSeedUser && (
          <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Feature tour</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                Replay the guided tour of Continuum any time.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              style={{ flexShrink: 0 }}
              onClick={async () => {
                try {
                  posthog.capture('tour_replayed', { platform: 'web', goal: user?.onboardingGoal ?? 'not_sure' });
                  await api.patch('/auth/me/tour/reset');
                  updateUser({ tourCompleted: false });
                } catch (_) {}
                setForceOnboardingOpen(true);
              }}
            >
              Replay tour
            </Button>
          </div>
          )}

          {/* Avatar */}
          <div style={card}>
            <p style={sectionLabel}>Photo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <AppAvatar name={fullName} src={localPreview ?? me?.avatarUrl} size="xl" />
                {!user?.isDemo && (
                  <>
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
                      onChange={e => { const f = e.target.files[0]; if (f) { setOriginalFile(f); setCropFile(f); e.target.value = ''; } }} />
                  </>
                )}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{fullName}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>JPG or PNG, max 5 MB</p>
                {!user?.isDemo && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Edit crop on existing avatar — shown when no new file is pending */}
                    {!originalFile && (me?.avatarUrl || localPreview) && (
                      <button
                        onClick={() => setCropSrc(me?.avatarOriginalUrl ?? me?.avatarUrl)}
                        style={{ fontSize: 12, color: '#6b21a8', background: 'none', border: '1px solid #e5d3f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                      >
                        Edit crop
                      </button>
                    )}
                    {/* Adjust crop on a freshly picked file */}
                    {originalFile && (
                      <button
                        onClick={() => setCropFile(originalFile)}
                        style={{ fontSize: 12, color: '#6b21a8', background: 'none', border: '1px solid #e5d3f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                      >
                        Adjust crop
                      </button>
                    )}
                    {/* Save button — only shown when there is a pending cropped file to upload */}
                    {pendingCroppedFile && (
                      <button
                        onClick={() => {
                          avatarMutation.mutate({ cropped: pendingCroppedFile, original: pendingOriginalFile });
                          setLocalPreview(null);
                          setPendingCroppedFile(null);
                          setPendingOriginalFile(null);
                          setOriginalFile(null);
                        }}
                        disabled={avatarMutation.isPending}
                        style={{ fontSize: 12, color: '#fff', background: '#6b21a8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: avatarMutation.isPending ? 0.6 : 1 }}
                      >
                        {avatarMutation.isPending ? 'Saving…' : 'Save photo'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div style={card}>
            <p style={sectionLabel}>Personal info</p>
            {user?.isDemo && (
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, fontStyle: 'italic' }}>
                Demo account — profile is read-only.
              </p>
            )}
            <form onSubmit={hProfile(onProfileSave)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <FieldInput label="First name" required error={pErrors.firstName?.message}
                  disabled={!!user?.isDemo}
                  {...regProfile('firstName', { required: 'Required' })} />
                <FieldInput label="Last name" required error={pErrors.lastName?.message}
                  disabled={!!user?.isDemo}
                  {...regProfile('lastName', { required: 'Required' })} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Bio</label>
                <textarea
                  rows={3}
                  disabled={!!user?.isDemo}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: '1px solid #E5E7EB', background: '#FFFFFF',
                    fontSize: 13, color: '#111827', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', transition: 'border-color 0.15s', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6b21a8'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  {...regProfile('bio')}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <FieldInput
                  label="LinkedIn URL"
                  placeholder="https://linkedin.com/in/yourprofile"
                  disabled={!!user?.isDemo}
                  error={pErrors.linkedinUrl?.message}
                  {...regProfile('linkedinUrl', {
                    validate: (v) => {
                      if (!v) return true;
                      return /^https:\/\/(www\.)?linkedin\.com\/in\//.test(v.trim())
                        || 'Must start with https://linkedin.com/in/';
                    },
                  })}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <FieldInput
                  label="Instagram handle"
                  placeholder="yourhandle"
                  disabled={!!user?.isDemo}
                  error={pErrors.instagramHandle?.message}
                  {...regProfile('instagramHandle', {
                    validate: (v) => {
                      if (!v) return true;
                      return /^@?[a-zA-Z0-9._]{1,30}$/.test(v.trim())
                        || 'Handle must be 1-30 chars: letters, numbers, periods, underscores';
                    },
                  })}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Activity visibility
                </label>
                <select
                  disabled={!!user?.isDemo}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: '1px solid #E5E7EB', background: '#FFFFFF',
                    fontSize: 13, color: '#111827', outline: 'none', cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                  {...regProfile('settings.activityVisibility')}
                >
                  <option value="private">Private — only you</option>
                  <option value="friends">Friends — your accepted friends</option>
                </select>
              </div>
              {!user?.isDemo && (
                <Button type="submit" loading={profileMutation.isPending} disabled={!pDirty}>
                  Save changes
                </Button>
              )}
            </form>
          </div>

          {/* Username */}
          {!user?.isDemo && <div style={card}>
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
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>
                  3–30 characters. Letters, numbers, underscores and hyphens only.
                </p>
              </div>
              <Button type="submit" loading={usernameMutation.isPending}>
                Update username
              </Button>
            </form>
          </div>}
        </div>
      )}

      {/* ─── SECURITY TAB ─── */}
      {activeTab === 'security' && (
        <div>
          {/* Pending deletion banner */}
          {me?.pendingDeletion && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
              padding: '14px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', margin: '0 0 2px' }}>
                  Account scheduled for deletion
                </p>
                <p style={{ fontSize: 12, color: '#b91c1c', margin: 0 }}>
                  Your account will be permanently deleted on {new Date(me.scheduledDeletionAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Log in before then to restore it.
                </p>
              </div>
              <Button size="sm" variant="outline" loading={restoreLoading} onClick={handleRestoreAccount}
                style={{ borderColor: '#dc2626', color: '#dc2626', background: 'transparent', flexShrink: 0 }}>
                Restore account
              </Button>
            </div>
          )}

          {!user?.isDemo && <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KeyRound size={17} style={{ color: '#6b21a8' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Change password</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                  {me?.googleId ? 'Google sign-in users must use Forgot Password to set a password first.' : 'Use a strong, unique password.'}
                </p>
              </div>
            </div>

            <form onSubmit={hPwd(onPasswordSave)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <PasswordInput
                  label="Current password"
                  required
                  error={pwErrors.currentPassword?.message}
                  {...regPwd('currentPassword', { required: 'Required' })}
                />
                <PasswordInput
                  label="New password"
                  required
                  error={pwErrors.newPassword?.message}
                  {...regPwd('newPassword', {
                    required: 'Required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                    validate: (v) =>
                      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(v) ||
                      'Must include a letter, a number, and a special character',
                  })}
                />
                {newPasswordValue.length > 0 && (
                  <PasswordRequirements password={newPasswordValue} />
                )}
                <PasswordInput
                  label="Confirm new password"
                  required
                  error={pwErrors.confirmPassword?.message}
                  {...regPwd('confirmPassword', { required: 'Required' })}
                />
              </div>
              <Button type="submit" loading={passwordMutation.isPending}>
                Update password
              </Button>
            </form>
          </div>}

          {/* Active sessions */}
          {!user?.isDemo && (
            <div style={card}>
              <p style={sectionLabel}>Active sessions</p>
              {sessionsLoading ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Loading sessions...</p>
              ) : !sessionsData || sessionsData.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No active sessions found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sessionsData.map((s) => (
                    <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 10px', background: s.isCurrent ? 'rgba(107,33,168,0.04)' : '#FFFFFF', borderRadius: 8, border: s.isCurrent ? '1px solid rgba(107,33,168,0.12)' : '1px solid transparent' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{s.deviceId || 'Unknown device'}</p>
                          {s.isCurrent && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#6b21a8', background: '#E5E7EB', padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                              This device
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                          Signed in {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          {s.lastUsedAt && (
                            <> &middot; Last active {(() => {
                              const diff = Date.now() - new Date(s.lastUsedAt).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return 'just now';
                              if (mins < 60) return `${mins}m ago`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs}h ago`;
                              return `${Math.floor(hrs / 24)}d ago`;
                            })()}</>
                          )}
                          {s.ipLocation && <> &middot; {s.ipLocation}</>}
                        </p>
                      </div>
                      <button
                        onClick={() => !s.isCurrent && revokeSessionMutation.mutate(s._id)}
                        disabled={s.isCurrent || revokeSessionMutation.isPending}
                        title={s.isCurrent ? 'Cannot remove your current session' : 'Revoke session'}
                        style={{ background: 'none', border: 'none', cursor: s.isCurrent ? 'not-allowed' : 'pointer', color: s.isCurrent ? '#d1d5db' : '#dc2626', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, flexShrink: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Danger zone */}
          {!user?.isDemo && <div style={{ ...card, borderColor: '#fecaca', background: '#fff' }}>
            <p style={{ ...sectionLabel, color: '#dc2626' }}>Danger zone</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Sign out of all devices</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Revokes all active sessions. You will need to log in again.</p>
                </div>
                <Button size="sm" variant="danger" loading={logoutAllLoading} onClick={handleLogoutAll}>
                  <LogOut size={13} /> Sign out all
                </Button>
              </div>
              <div style={{ borderTop: '1px solid #fecaca', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', margin: 0 }}>Delete account</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Permanently deletes your account and all data. This cannot be undone.</p>
                </div>
                <Button size="sm" variant="danger" loading={deleteAccountLoading} onClick={handleDeleteAccount}>
                  Delete account
                </Button>
              </div>
            </div>
          </div>}
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
                    padding: '14px 0', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{desc}</p>
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
                {notifSaved && <span style={{ fontSize: 12, color: '#059669' }}>Saved!</span>}
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(107,33,168,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              {!user?.isDemo && (me?.googleId ? (
                <Button size="sm" variant="outline"
                  onClick={() => {
                    setShowUnlinkConfirm(true);
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
              ))}
            </div>
            {me?.googleId && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(107,33,168,0.08)', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: '#6b21a8', margin: 0 }}>
                  Google Drive connected — select Google Docs to import as notes from the Notes page.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {(cropFile || cropSrc) && (
        <AvatarCropModal
          file={cropFile ?? undefined}
          src={cropSrc ?? undefined}
          onSave={({ cropped, original }) => {
            setCropFile(null);
            setCropSrc(null);
            setPendingCroppedFile(cropped);
            setPendingOriginalFile(original ?? null);
            setLocalPreview(URL.createObjectURL(cropped));
            if (original) setOriginalFile(original); // keep for in-session re-crop
          }}
          onClose={() => { setCropFile(null); setCropSrc(null); }}
        />
      )}

      <ConfirmModal
        open={showLogoutAllConfirm}
        title="Sign out of all devices"
        message="You will be signed out of all devices and will need to log in again."
        confirmLabel="Sign out all"
        variant="danger"
        onConfirm={doLogoutAll}
        onClose={() => setShowLogoutAllConfirm(false)}
      />

      <ConfirmModal
        open={showUnlinkConfirm}
        title="Unlink Google account"
        message="Are you sure you want to unlink your Google account? You can re-link it at any time."
        confirmLabel="Unlink"
        variant="danger"
        onConfirm={() => {
          setShowUnlinkConfirm(false);
          api.delete('/auth/me/google/link', { data: { keepNotes: true } })
            .then(r => {
              const u = r.data.user || r.data.data;
              if (u) {
                updateUser(u);
                queryClient.setQueryData(['me'], (old) => old ? { ...old, user: u } : old);
              }
            })
            .catch(e => toast({ type: 'error', message: e?.response?.data?.error || 'Failed to unlink' }));
        }}
        onClose={() => setShowUnlinkConfirm(false)}
      />

      {showDeleteModal && (
        <DeleteAccountModal
          username={me?.username}
          googleOnly={!!me?.googleId}
          loading={deleteAccountLoading}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteAccount}
        />
      )}
    </div>
  );
}
