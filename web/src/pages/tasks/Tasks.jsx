import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Clock, AlertCircle, Trash2, Users } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import ShareModal from '@/components/ui/ShareModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { formatDate } from '@/lib/utils';

const STATUSES = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS = { 'todo': 'To Do', 'in_progress': 'In Progress', 'completed': 'Completed' };
const PRIORITIES = ['low', 'medium', 'high'];
const TYPES = ['homework', 'study', 'project', 'exam', 'club', 'professional', 'personal', 'other'];

const PRIORITY_COLORS = {
  high: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', dot: '#ef4444' },
  medium: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', dot: '#f59e0b' },
  low: { border: '#d1d5db', bg: 'transparent', dot: '#9ca3af' },
};

const COLUMN_META = {
  todo: { label: 'To Do', accent: '#6b21a8' },
  in_progress: { label: 'In Progress', accent: '#f59e0b' },
  completed: { label: 'Completed', accent: '#22c55e' },
};

const emptyForm = {
  title: '', description: '', priority: 'medium', status: 'todo',
  dueDate: '', type: '', isShared: false, participants: [],
};

export default function Tasks() {
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sharedTab, setSharedTab] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState(location.state?.openTaskId ?? null);
  const [showSharePicker, setShowSharePicker] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: sharedTab ? ['tasks', 'shared'] : ['tasks', 'mine'],
    queryFn: () =>
      sharedTab
        ? api.get('/tasks/shared').then(r => r.data)
        : api.get('/tasks').then(r => r.data),
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tasks', payload),
    onSuccess: () => {
      invalidateTasks();
      setShowCreate(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/tasks/${id}`, payload),
    onSuccess: invalidateTasks,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: invalidateTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: invalidateTasks,
  });

  const allTasks = data?.tasks || data?.data || [];

  const columns = STATUSES.map(status => ({
    status,
    tasks: allTasks.filter(t => t.status === status),
  }));

  const handleStatusChange = (taskId, newStatus) => {
    statusMutation.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Tasks
          </h1>
          <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>{allTasks.length} tasks</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New task
        </Button>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[{ key: false, label: 'My tasks' }, { key: true, label: 'Shared with me' }].map(({ key, label }) => (
          <button
            key={String(key)}
            onClick={() => setSharedTab(key)}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: sharedTab === key ? '#6b21a8' : '#f5f0ff',
              color: sharedTab === key ? '#fff' : '#6b21a8',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {STATUSES.map(s => <Skeleton key={s} className="h-64" />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {columns.map(col => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              tasks={col.tasks}
              onStatusChange={handleStatusChange}
              onDelete={sharedTab ? null : (id) => { if (window.confirm('Delete task?')) deleteMutation.mutate(id); }}
              onView={setViewingTaskId}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New task">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Title *</label>
            <input
              className="input-field"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
            <textarea
              className="input-field resize-none min-h-[72px]"
              placeholder="Optional details..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Priority</label>
              <select
                className="input-field capitalize"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Type</label>
              <select
                className="input-field capitalize"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Due date</label>
            <input
              type="date"
              className="input-field"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div>
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
                background: form.participants.length > 0 ? '#f5f0ff' : 'white',
                color: form.participants.length > 0 ? '#6b21a8' : '#374151',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.12s',
              }}
            >
              <Users size={14} />
              {form.participants.length > 0
                ? `${form.participants.length} collaborator${form.participants.length !== 1 ? 's' : ''} selected`
                : 'Add collaborators (optional)'}
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                ...form,
                isShared: form.participants.length > 0,
                dueDate: form.dueDate || undefined,
                type: form.type || undefined,
              })}
              loading={createMutation.isPending}
              disabled={!form.title.trim()}
              className="flex-1"
            >
              Create task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share picker for task creation */}
      <ShareModal
        open={showSharePicker}
        onClose={() => setShowSharePicker(false)}
        mode="task"
        currentParticipants={form.participants}
        onSave={({ participants }) => {
          setForm(f => ({ ...f, participants, isShared: participants.length > 0 }));
          setShowSharePicker(false);
        }}
        title="Add collaborators"
      />

      <TaskDetailModal
        taskId={viewingTaskId}
        open={!!viewingTaskId}
        onClose={() => setViewingTaskId(null)}
        onUpdated={invalidateTasks}
      />
    </div>
  );
}

function KanbanColumn({ status, tasks, onStatusChange, onDelete, onView }) {
  const meta = COLUMN_META[status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Column header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(107,33,168,0.04)',
      }}>
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: meta.accent,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>
          {meta.label}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#fff',
          background: meta.accent,
          borderRadius: 20,
          padding: '1px 7px',
          minWidth: 20,
          textAlign: 'center',
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.length === 0 ? (
          <div style={{
            height: 80,
            borderRadius: 12,
            border: '2px dashed #ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#a087b0' }}>No tasks</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onView={onView}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete, onView }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;

  return (
    <div
      onClick={() => onView(task._id)}
      className="group"
      style={{
        background: '#fff',
        border: `1px solid #ede9fe`,
        borderLeft: `3px solid ${priorityStyle.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        transition: 'box-shadow 0.15s, transform 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.12)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Title */}
      <p style={{
        fontSize: 13,
        fontWeight: 600,
        color: task.status === 'completed' ? '#a087b0' : '#111827',
        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
        marginBottom: 4,
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {task.title}
      </p>

      {task.description && (
        <p style={{
          fontSize: 11,
          color: '#a087b0',
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.4,
        }}>
          {task.description}
        </p>
      )}

      {(task.type || task.dueDate) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {task.type && (
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: '#f5f0ff',
              color: '#6b21a8',
              textTransform: 'capitalize',
            }}>
              {task.type}
            </span>
          )}
          {task.dueDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: isOverdue ? '#ef4444' : '#a087b0',
            }}>
              {isOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
              {isOverdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <select
          value={task.status}
          onChange={e => { e.stopPropagation(); onStatusChange(task._id, e.target.value); }}
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: 11,
            border: '1px solid #ede9fe',
            borderRadius: 8,
            padding: '3px 8px',
            background: '#fef7ff',
            color: '#6b21a8',
            fontWeight: 500,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task._id); }}
              style={{
                padding: 4,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#a087b0',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a087b0'; }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {task.isShared && task.participants?.length > 0 && (
        <div
          onClick={e => { e.stopPropagation(); onView(task._id); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, cursor: 'pointer' }}
        >
          <Users size={11} style={{ color: '#6b21a8' }} />
          <span style={{ fontSize: 11, color: '#6b21a8', fontWeight: 500 }}>
            {task.participants.length} collaborator{task.participants.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
