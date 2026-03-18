import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, AlertCircle, Pencil, ArrowLeft, Users } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import ShareModal from '@/components/ui/ShareModal';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const STATUSES = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed' };
const STATUS_COLORS = { todo: 'neutral', in_progress: 'warning', completed: 'success' };
const PRIORITIES = ['low', 'medium', 'high'];
const TYPES = ['homework', 'study', 'project', 'exam', 'club', 'professional', 'personal', 'other'];
const TYPE_COLORS = {
  homework: { bg: '#dbeafe', text: '#1d4ed8' },
  study: { bg: '#f5f0ff', text: '#6b21a8' },
  project: { bg: '#fef3c7', text: '#b45309' },
  exam: { bg: '#fce7f3', text: '#be185d' },
  club: { bg: '#d1fae5', text: '#065f46' },
  professional: { bg: '#e0e7ff', text: '#3730a3' },
  personal: { bg: '#fef9c3', text: '#854d0e' },
  other: { bg: '#f3f4f6', text: '#374151' },
};

// ----------------------------------------
// TaskDetailModal
// Props:
//   taskId   — ID of task to display (null/undefined = closed)
//   open     — boolean
//   onClose  — callback
//   onUpdated — optional callback after a successful mutation (use to invalidate parent queries)
// ----------------------------------------
export default function TaskDetailModal({ taskId, open, onClose, onUpdated }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'detail', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(r => r.data),
    enabled: !!taskId && open,
  });

  const task = data?.task;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
    onUpdated?.();
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/tasks/${taskId}`, payload),
    onSuccess: () => {
      invalidateAll();
      setEditing(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: invalidateAll,
  });

  const participantsMutation = useMutation({
    mutationFn: (payload) => api.patch(`/tasks/${taskId}/participants`, payload),
    onSuccess: () => {
      invalidateAll();
      setShowSharePicker(false);
    },
  });

  const openEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      type: task.type || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      isShared: task.isShared || false,
    });
    setEditing(true);
  };

  const handleClose = () => {
    setEditing(false);
    setShowParticipants(false);
    setShowSharePicker(false);
    onClose();
  };

  const isOwner = task && String(task.userId) === String(user?._id);
  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const priorityPillStyle = (priority) => {
    if (priority === 'high') return { background: '#fef2f2', color: '#dc2626' };
    if (priority === 'medium') return { background: '#fffbeb', color: '#b45309' };
    return { background: '#f9fafb', color: '#6b7280' };
  };

  return (
    <Modal open={open} onClose={handleClose} title={editing ? 'Edit task' : 'Task detail'}>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !task ? (
        <p className="text-sm text-secondary text-center py-4">Task not found.</p>
      ) : editing ? (
        <div className="space-y-4">
          <button
            onClick={() => setEditing(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#a087b0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#6b21a8'}
            onMouseLeave={e => e.currentTarget.style.color = '#a087b0'}
          >
            <ArrowLeft size={13} /> Back to detail
          </button>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 6 }}>
              Title *
            </label>
            <input
              className="input-field"
              style={{ borderColor: '#ede9fe', borderRadius: 12 }}
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              className="input-field resize-none min-h-[72px]"
              style={{ borderColor: '#ede9fe', borderRadius: 12 }}
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 6 }}>
                Priority
              </label>
              <select
                className="input-field capitalize"
                style={{ borderColor: '#ede9fe', borderRadius: 12 }}
                value={editForm.priority}
                onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 6 }}>
                Type
              </label>
              <select
                className="input-field capitalize"
                style={{ borderColor: '#ede9fe', borderRadius: 12 }}
                value={editForm.type}
                onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 6 }}>
              Due date
            </label>
            <input
              type="date"
              className="input-field"
              style={{ borderColor: '#ede9fe', borderRadius: 12 }}
              value={editForm.dueDate}
              onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowSharePicker(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid #ede9fe',
              background: task?.participants?.length > 0 ? '#f5f0ff' : 'white',
              color: task?.participants?.length > 0 ? '#6b21a8' : '#374151',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <Users size={14} />
            {task?.participants?.length > 0
              ? `${task.participants.length} collaborator${task.participants.length !== 1 ? 's' : ''}`
              : 'Add collaborators'}
          </button>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ ...editForm, dueDate: editForm.dueDate || undefined, type: editForm.type || undefined })}
              loading={updateMutation.isPending}
              disabled={!editForm.title?.trim()}
              className="flex-1"
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Title */}
          <div className="flex items-start gap-3">
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              marginTop: 5,
              flexShrink: 0,
              background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#d1d5db',
            }} />
            <h3 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 16,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.4,
              margin: 0,
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              opacity: task.status === 'completed' ? 0.55 : 1,
            }}>
              {task.title}
            </h3>
          </div>

          {/* Status pills — owner can change, others see read-only */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#a087b0', marginBottom: 8 }}>
              Status
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => isOwner && statusMutation.mutate(s)}
                  disabled={!isOwner || statusMutation.isPending}
                  style={{
                    fontSize: 12,
                    fontWeight: task.status === s ? 600 : 400,
                    padding: '5px 14px',
                    borderRadius: 999,
                    border: task.status === s ? 'none' : '1px solid #ede9fe',
                    background: task.status === s ? '#6b21a8' : '#ffffff',
                    color: task.status === s ? '#ffffff' : '#111827',
                    cursor: !isOwner ? 'default' : statusMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: (!isOwner && task.status !== s) ? 0.5 : statusMutation.isPending ? 0.6 : 1,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + type + shared badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              ...priorityPillStyle(task.priority || 'low'),
              fontSize: 12,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: 999,
              textTransform: 'capitalize',
            }}>
              {task.priority || 'low'} priority
            </span>
            {task.type && (
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 12px',
                borderRadius: 999,
                background: (TYPE_COLORS[task.type] || TYPE_COLORS.other).bg,
                color: (TYPE_COLORS[task.type] || TYPE_COLORS.other).text,
                textTransform: 'capitalize',
              }}>
                {task.type}
              </span>
            )}
            {task.isShared && (
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '4px 12px',
                borderRadius: 999,
                background: '#f5f0ff',
                color: '#6b21a8',
              }}>
                Shared
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ background: '#f5f0ff', borderRadius: 12, padding: '12px' }}>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: 999,
              background: isOverdue ? '#fef2f2' : '#f5f0ff',
              color: isOverdue ? '#dc2626' : '#6b21a8',
            }}>
              {isOverdue ? <AlertCircle size={13} /> : <Clock size={13} />}
              <span>{isOverdue ? 'Overdue: ' : 'Due '}{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Participants */}
          {task.isShared && task.participants?.length > 0 && (
            <div>
              <button
                onClick={() => setShowParticipants(v => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f5f0ff',
                  borderRadius: 12,
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                <Users size={14} style={{ color: '#6b21a8', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#6b21a8', fontWeight: 500 }}>
                  {task.participants.length} collaborator{task.participants.length !== 1 ? 's' : ''}
                </span>
              </button>
              {showParticipants && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, background: '#fef7ff', borderRadius: 12, padding: '10px 12px', border: '1px solid #ede9fe' }}>
                  {task.participants.map(p => {
                    const pUser = p.userId;
                    const name = pUser?.firstName
                      ? `${pUser.firstName} ${pUser.lastName || ''}`
                      : pUser?.username || p.userId?.toString?.() || 'Unknown';
                    return (
                      <Link
                        key={p.userId?._id || p.userId}
                        to="/users/view"
                        state={{ id: pUser?._id || p.userId }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '4px 6px', borderRadius: 8, transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Avatar name={name} src={pUser?.avatarUrl} size="sm" />
                        <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{name}</span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: p.status === 'completed' ? '#dcfce7' : p.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
                          color: p.status === 'completed' ? '#16a34a' : p.status === 'in_progress' ? '#b45309' : '#6b7280',
                          marginLeft: 'auto',
                        }}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #ede9fe', marginTop: 4 }}>
            <Button variant="outline" onClick={handleClose} className="flex-1">Close</Button>
            {isOwner && (
              <Button onClick={openEdit} className="flex-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={14} /> Edit task
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Share picker for editing participants */}
      <ShareModal
        open={showSharePicker}
        onClose={() => setShowSharePicker(false)}
        mode="task"
        currentParticipants={task?.participants || []}
        onSave={(payload) => participantsMutation.mutate(payload)}
        saving={participantsMutation.isPending}
        title="Manage collaborators"
      />
    </Modal>
  );
}
