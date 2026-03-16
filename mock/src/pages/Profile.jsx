import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Camera, Save, RefreshCw, LinkIcon, Unlink, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
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

  const profileMutation = useMutation({
    mutationFn: (payload) => {
      // Send as JSON — bodyParser.json() handles it, Multer passes through for non-multipart requests.
      // FormData was causing Multer to fail to parse the body silently (req.body stayed empty).
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

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of all devices? You will need to log in again.')) return;
    setLogoutAllLoading(true);
    try {
      await api.post('/auth/logout-all');
    } catch (_) {
      // ignore errors — clear anyway
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const me = data?.user || data?.data || user;

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'integrations', label: 'Integrations' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Profile</h1>
        <p className="text-secondary text-sm mt-0.5">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
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

      {activeTab === 'profile' && (
        <form
          onSubmit={profileForm.handleSubmit(data =>
            profileMutation.mutate(data)
          )}
          className="space-y-5"
        >
          {/* Avatar */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4">Profile photo</h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar name={[me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.username} src={me?.avatarUrl} size="xl" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-sm hover:bg-primary-hover transition-colors"
                >
                  <Camera size={13} className="text-white" />
                </button>
              </div>
              <div>
                <p className="font-medium text-foreground">{[me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.username}</p>
                <p className="text-sm text-secondary">@{me?.username}</p>
                <p className="text-xs text-secondary mt-1">
                  Click the camera to update your photo
                </p>
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
                <Input
                  label="First name"
                  {...profileForm.register('firstName')}
                />
                <Input
                  label="Last name"
                  {...profileForm.register('lastName')}
                />
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
                <select
                  {...profileForm.register('settings.activityVisibility')}
                  className="input-field"
                >
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

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {/* Google account */}
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
                  {me?.googleId
                    ? `Connected · Drive export enabled`
                    : 'Not connected — link to enable Drive export'}
                </p>
              </div>
              {me?.googleId ? (
                <div className="flex items-center gap-2">
                  <Badge variant="success">Connected</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => api.delete('/auth/me/google/link').catch(() => {})}
                  >
                    <Unlink size={13} /> Unlink
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href =
                      (import.meta.env.VITE_API_URL || 'http://localhost:5001') +
                      '/api/auth/google';
                  }}
                >
                  <LinkIcon size={13} /> Connect
                </Button>
              )}
            </div>
          </Card>

          {/* Google Drive import info */}
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

          {/* Sign out all devices */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <LogOut size={18} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Sign out all devices</p>
                <p className="text-xs text-secondary">
                  End all active sessions across every device
                </p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={handleLogoutAll}
                loading={logoutAllLoading}
              >
                <LogOut size={13} /> Sign out all
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
