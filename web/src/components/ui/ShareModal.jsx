import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';

/**
 * ShareModal — reusable sharing modal for notes, flashcard sets, and tasks.
 *
 * Props:
 *   open           — boolean
 *   onClose        — () => void
 *   mode           — 'default' | 'task'   (task mode skips visibility radios)
 *   currentVisibility — 'private' | 'friends' | 'specific' (default mode only)
 *   currentSharedWith — [userId, ...] (IDs currently shared with)
 *   currentParticipants — [{ userId }, ...] (task mode only)
 *   onSave         — ({ visibility, sharedWith }) => void   (default mode)
 *                     or ({ participants }) => void          (task mode)
 *   saving         — boolean (loading state for save button)
 *   title          — optional modal title override
 */
export default function ShareModal({
  open,
  onClose,
  mode = 'default',
  currentVisibility = 'private',
  currentSharedWith = [],
  currentParticipants = [],
  onSave,
  saving = false,
  title,
}) {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState(currentVisibility);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Fetch accepted friends
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends-list'],
    queryFn: () => api.get('/friends').then(r => r.data),
    enabled: open,
  });

  // Reset state when modal opens
  const sharedWithKey = JSON.stringify(currentSharedWith);
  const participantsKey = JSON.stringify(currentParticipants?.map(p => p.userId));
  useEffect(() => {
    if (open) {
      if (mode === 'task') {
        const ids = (currentParticipants || []).map(p => p.userId?.toString?.() || p.userId);
        setSelectedIds(new Set(ids));
      } else {
        setVisibility(currentVisibility || 'private');
        setSelectedIds(new Set((currentSharedWith || []).map(id => id.toString?.() || id)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, currentVisibility, sharedWithKey, participantsKey]);

  // The friends endpoint returns { friendships: [...] } where each has user1 & user2 populated.
  // Extract the friend (the user who isn't the current user).
  const friends = (friendsData?.friendships || friendsData?.data || []).map(f => {
    if (f.user1 && f.user2) {
      return f.user1._id === user?._id ? f.user2 : f.user1;
    }
    if (f.friend) return f.friend;
    return f;
  });

  const toggleFriend = (friendId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const handleSave = () => {
    if (mode === 'task') {
      const participants = Array.from(selectedIds).map(id => ({ userId: id }));
      onSave({ participants });
    } else {
      if (visibility === 'specific') {
        onSave({ visibility: 'specific', sharedWith: Array.from(selectedIds) });
      } else {
        onSave({ visibility, sharedWith: [] });
      }
    }
  };

  const fullName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';

  const showFriendPicker = mode === 'task' || visibility === 'specific';

  return (
    <Modal open={open} onClose={onClose} title={title || (mode === 'task' ? 'Share task' : 'Share')}>
      <div className="space-y-4">
        {/* Visibility options (default mode only) */}
        {mode !== 'task' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 8 }}>
              Visibility
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { value: 'private', label: 'Private', desc: 'Only you can see this' },
                { value: 'friends', label: 'All Friends', desc: 'Visible to all your friends' },
                { value: 'specific', label: 'Specific Friends', desc: 'Choose who can see this' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: visibility === opt.value ? '1.5px solid #6b21a8' : '1px solid #ede9fe',
                    background: visibility === opt.value ? '#f5f0ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: visibility === opt.value ? '5px solid #6b21a8' : '2px solid #d1d5db',
                    flexShrink: 0,
                    transition: 'border 0.12s',
                  }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0 }}>{opt.label}</p>
                    <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: 0 }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Friend picker */}
        {showFriendPicker && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 8 }}>
              {mode === 'task' ? 'Add collaborators' : 'Select friends'}
            </label>
            {friendsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: '#a087b0' }}>
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#a087b0', textAlign: 'center', padding: '16px 0' }}>
                No friends yet. Add friends to share content.
              </p>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {friends.map(friend => {
                  const fId = friend._id?.toString?.() || friend._id;
                  const isSelected = selectedIds.has(fId);
                  return (
                    <button
                      key={fId}
                      onClick={() => toggleFriend(fId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: isSelected ? '1.5px solid #6b21a8' : '1px solid transparent',
                        background: isSelected ? '#f5f0ff' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        textAlign: 'left',
                      }}
                    >
                      <Avatar name={fullName(friend)} src={friend.avatarUrl} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fullName(friend)}
                        </p>
                        {friend.username && (
                          <p style={{ fontSize: '0.75rem', color: '#a087b0', margin: 0 }}>@{friend.username}</p>
                        )}
                      </div>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: isSelected ? 'none' : '1.5px solid #d1d5db',
                        background: isSelected ? '#6b21a8' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.12s',
                      }}>
                        {isSelected && <Check size={12} style={{ color: 'white' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected count */}
        {showFriendPicker && selectedIds.size > 0 && (
          <p style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 500 }}>
            {selectedIds.size} friend{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={
              mode !== 'task' && visibility === 'specific' && selectedIds.size === 0
            }
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
