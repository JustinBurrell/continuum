import { useState, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppAvatar from '@/components/ui/AppAvatar';
import AvatarCropModal from '@/components/ui/AvatarCropModal';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function PhotoBioStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio ?? '');
  const [preview, setPreview] = useState(user?.avatarUrl ?? null);
  const [file, setFile] = useState(null);           // cropped display file
  const [originalFile, setOriginalFile] = useState(null); // full-res original — kept for re-crop + upload
  const [cropFile, setCropFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = '';

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Only JPG, PNG, WebP, and GIF files are accepted.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('File is too large. Maximum size is 5 MB.');
      return;
    }

    setFileError(null);
    setOriginalFile(f);
    setCropFile(f);
  };

  const handleContinue = async () => {
    if (fileError) return; // don't save with a bad file
    setLoading(true);
    try {
      const form = new FormData();
      if (file) {
        form.append('avatar', file);
        if (originalFile) form.append('avatarOriginal', originalFile);
      }
      if (bio !== (user?.bio ?? '')) form.append('bio', bio);

      if (form.has('avatar') || form.has('bio')) {
        const res = await api.patch('/auth/me/profile', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser({ bio: res.data.user.bio, avatarUrl: res.data.user.avatarUrl, avatarOriginalUrl: res.data.user.avatarOriginalUrl });
      }
      onContinue();
    } catch (_) {
      onContinue();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        Put a face to it.
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Add a photo and a short bio so friends can find you.
      </p>

      {/* Avatar picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => originalFile ? setCropFile(originalFile) : fileInputRef.current?.click()}
          title={originalFile ? 'Adjust crop' : 'Upload photo'}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            border: `2px dashed ${fileError ? '#dc2626' : '#e5d3f0'}`,
            background: '#f9f5ff', cursor: 'pointer', overflow: 'hidden', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {preview
            ? <img src={preview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <AppAvatar name={fullName} size="lg" />
          }
        </button>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'none', border: '1px solid #e5d3f0', borderRadius: 6, padding: '6px 14px', fontSize: '0.8125rem', color: '#6b21a8', cursor: 'pointer', fontWeight: 500 }}
          >
            {file ? 'Change photo' : 'Upload photo'}
          </button>
          {originalFile && (
            <button
              type="button"
              onClick={() => setCropFile(originalFile)}
              style={{ background: 'none', border: 'none', color: '#6b21a8', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 0', display: 'block', textDecoration: 'underline' }}
            >
              Adjust crop
            </button>
          )}
          {fileError
            ? <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '4px 0 0' }}>{fileError}</p>
            : !originalFile && <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '4px 0 0' }}>JPG, PNG, WebP — max 5 MB</p>
          }
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          Bio
          <span style={{ color: bio.length >= 160 ? '#dc2626' : bio.length >= 150 ? '#f59e0b' : '#9CA3AF', fontWeight: 400, marginLeft: 4 }}>
            ({160 - bio.length} left)
          </span>
        </label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 160))}
          placeholder="A sentence or two about yourself…"
          rows={3}
          style={{
            width: '100%', padding: '9px 12px', border: '1px solid #e5d3f0', borderRadius: 8,
            fontSize: '0.9rem', color: '#111827', background: '#fff', outline: 'none',
            resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#6b21a8'}
          onBlur={e => e.target.style.borderColor = '#e5d3f0'}
        />
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !!fileError}
        style={{
          width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: (loading || fileError) ? 'not-allowed' : 'pointer',
          opacity: (loading || fileError) ? 0.7 : 1,
          marginBottom: 10, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!loading && !fileError) e.currentTarget.style.background = '#581c87'; }}
        onMouseLeave={e => { if (!loading && !fileError) e.currentTarget.style.background = '#6b21a8'; }}
      >
        {loading ? 'Saving…' : 'Save & Continue'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip
      </button>

      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onSave={({ cropped, original }) => {
            setCropFile(null);
            setFile(cropped);
            setPreview(URL.createObjectURL(cropped));
            if (original) setOriginalFile(original); // preserve original for re-crop and upload
          }}
          onClose={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
