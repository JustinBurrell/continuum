import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, AlertCircle, UserPlus, Pencil, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const STATUSES = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed' };
const STATUS_COLORS = { todo: 'neutral', in_progress: 'warning', completed: 'success' };
const PRIORITIES = ['low', 'medium', 'high'];

// ----------------------------------------
// TaskDetailModal
// Props:
//   taskId   — ID of task to display (null/undefined = closed)
//   open     — boolean
//   onClose  — callback
//   onUpdated — optional callback after a successful mutation (use to invalidate parent queries)
// ----------------------------------------
export default function TaskDetailModal({ taskId, open, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'detail', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(r => r.data),
    enabled: !!taskId && open,
  });

  const task = data?.task;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
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

  const openEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      isShared: task.isShared || false,
    });
    setEditing(true);
  };

  const handleClose = () => {
    setEditing(false);
    onClose();
  };

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

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
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft size={13} /> Back to detail
          </button>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Title *</label>
            <input
              className="input-field"
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
            <textarea
              className="input-field resize-none min-h-[72px]"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Priority</label>
              <select
                className="input-field capitalize"
                value={editForm.priority}
                onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Due date</label>
              <input
                type="date"
                className="input-field"
                value={editForm.dueDate}
                onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={editForm.isShared}
              onChange={e => setEditForm(f => ({ ...f, isShared: e.target.checked }))}
            />
            Shared task
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ ...editForm, dueDate: editForm.dueDate || undefined })}
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
            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
              task.priority === 'high' ? 'bg-red-500' :
              task.priority === 'medium' ? 'bg-amber-500' : 'bg-secondary/50'
            }`} />
            <h3 className={`text-base font-semibold text-foreground leading-snug ${
              task.status === 'completed' ? 'line-through text-secondary' : ''
            }`}>
              {task.title}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
            <Badge variant="neutral" className="capitalize">{task.priority || 'low'} priority</Badge>
            {task.isShared && <Badge variant="primary">Shared</Badge>}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{task.description}</p>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-red-500' : 'text-secondary'}`}>
              {isOverdue ? <AlertCircle size={14} /> : <Clock size={14} />}
              <span>{isOverdue ? 'Overdue · ' : 'Due '}{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Participants */}
          {task.isShared && task.participants?.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-secondary">
              <UserPlus size={14} />
              <span>{task.participants.length} collaborator{task.participants.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Status quick-change */}
          <div>
            <label className="text-xs font-medium text-secondary block mb-1.5">Change status</label>
            <select
              value={task.status}
              onChange={e => statusMutation.mutate(e.target.value)}
              disabled={statusMutation.isPending}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={handleClose} className="flex-1">Close</Button>
            <Button onClick={openEdit} className="flex-1">
              <Pencil size={14} /> Edit task
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
