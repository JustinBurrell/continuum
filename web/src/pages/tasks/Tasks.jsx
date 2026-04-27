import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Clock, AlertCircle, Trash2, Users, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import queryClient from '@/lib/queryClient';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TasksSkeleton from '@/components/skeletons/TasksSkeleton';
import Skeleton from '@/components/ui/Skeleton';
import ShareModal from '@/components/ui/ShareModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

const STATUSES = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS = { 'todo': 'To Do', 'in_progress': 'In Progress', 'completed': 'Completed' };
const PRIORITIES = ['low', 'medium', 'high'];
const TYPES = ['homework', 'study', 'project', 'exam', 'club', 'professional', 'personal', 'other'];

const TYPE_COLORS = {
  homework: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  study: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  project: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  exam: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  club: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  professional: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  personal: { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8' },
  other: { bg: '#f3f4f6', text: '#374151' },
};

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
  const { user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(null); // task id to delete
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sharedTab, setSharedTab] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState(location.state?.openTaskId ?? null);
  const toast = useToast();
  const [viewingCommentId, setViewingCommentId] = useState(location.state?.commentId ?? null);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [search, setSearch] = useState('');

  // Own tasks — auto-fetch all pages so the full Kanban board is always complete
  const {
    data: ownData,
    isLoading: ownLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['tasks', 'mine', search],
    queryFn: ({ pageParam }) =>
      api.get('/tasks', {
        params: { ...(search && { search }), page: pageParam, limit: 50 },
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      return p && p.page < p.pages ? p.page + 1 : undefined;
    },
    placeholderData: (prev) => prev,
    enabled: !sharedTab,
  });

  // Shared tasks — no backend pagination on that endpoint
  const { data: sharedData, isLoading: sharedLoading } = useQuery({
    queryKey: ['tasks', 'shared', search],
    queryFn: () =>
      api.get('/tasks/shared', { params: search ? { search } : {} }).then(r => r.data),
    placeholderData: (prev) => prev,
    enabled: sharedTab,
  });

  // Silently fetch remaining pages so all Kanban columns are populated
  useEffect(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const isLoading = sharedTab ? sharedLoading : ownLoading;
  const allTasks = sharedTab
    ? (sharedData?.tasks || [])
    : (ownData?.pages.flatMap(p => p.tasks) ?? []);

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['activity'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tasks', payload),
    onSuccess: () => {
      posthog.capture('task_created', { platform: 'web' });
      invalidateTasks();
      setShowCreate(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/tasks/${id}`, payload),
    onSuccess: invalidateTasks,
  });

  const taskQueryKey = sharedTab ? ['tasks', 'shared', search] : ['tasks', 'mine', search];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const prev = queryClient.getQueryData(taskQueryKey);
      if (!sharedTab) {
        queryClient.setQueryData(taskQueryKey, (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              tasks: page.tasks.map(t => t._id === id ? { ...t, status } : t),
            })),
          };
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(taskQueryKey, ctx.prev);
      toast({ message: err?.response?.data?.error || 'Failed to update task status.', type: 'error' });
    },
    onSettled: invalidateTasks,
  });

  const participantStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/participant-status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const prev = queryClient.getQueryData(taskQueryKey);
      queryClient.setQueryData(taskQueryKey, (old) => {
        if (!old) return old;
        const tasks = (old.tasks || old.data || []).map(t => {
          if (t._id !== id) return t;
          const participants = (t.participants || []).map(p =>
            String(p.userId?._id || p.userId) === String(user?._id) ? { ...p, status } : p
          );
          return { ...t, participants };
        });
        return old.tasks ? { ...old, tasks } : { ...old, data: tasks };
      });
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(taskQueryKey, ctx.prev);
      toast({ message: err?.response?.data?.error || 'Failed to update task status.', type: 'error' });
    },
    onSettled: invalidateTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const prev = queryClient.getQueryData(taskQueryKey);
      queryClient.setQueryData(taskQueryKey, (old) => {
        if (!old?.pages) return old;
        return { ...old, pages: old.pages.map(page => ({ ...page, tasks: page.tasks.filter(t => t._id !== id) })) };
      });
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(taskQueryKey, ctx.prev);
      toast({ message: err?.response?.data?.error || 'Failed to delete task.', type: 'error' });
    },
    onSettled: invalidateTasks,
  });


  const columns = STATUSES.map(status => ({
    status,
    tasks: allTasks.filter(t => t.status === status),
  }));

  const handleStatusChange = (taskId, newStatus) => {
    if (sharedTab) {
      participantStatusMutation.mutate({ id: taskId, status: newStatus });
    } else {
      statusMutation.mutate({ id: taskId, status: newStatus });
    }
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Tasks
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{allTasks.length} tasks</p>
        </div>
        {!user?.isDemo && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New task
          </Button>
        )}
      </div>

      {/* Search */}
      {(
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            style={{
              width: '100%',
              paddingLeft: 36,
              paddingRight: 14,
              paddingTop: 9,
              paddingBottom: 9,
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder={sharedTab ? "Search shared tasks..." : "Search tasks..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

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
              background: sharedTab === key ? '#6b21a8' : 'transparent',
              color: sharedTab === key ? '#fff' : '#6b7280',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TasksSkeleton />
      ) : (
        <div className="kanban-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {columns.map(col => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              tasks={col.tasks}
              onStatusChange={handleStatusChange}
              onDelete={sharedTab || user?.isDemo ? null : (id) => setDeleteConfirm(id)}
              onView={setViewingTaskId}
              isSharedTab={sharedTab}
              currentUserId={user?._id}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New task">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Title <span className="text-red-500">*</span></label>
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
            <label className="text-sm font-medium text-foreground block mb-1.5">Due date <span className="text-red-500">*</span></label>
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
                border: '1px solid #E5E7EB',
                background: form.participants.length > 0 ? 'rgba(107,33,168,0.08)' : 'white',
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
              disabled={!form.title.trim() || !form.dueDate}
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
        onClose={() => { setViewingTaskId(null); setViewingCommentId(null); }}
        onUpdated={invalidateTasks}
        scrollToCommentId={viewingCommentId}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => { deleteMutation.mutate(deleteConfirm); setDeleteConfirm(null); }}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function KanbanColumn({ status, tasks, onStatusChange, onDelete, onView, isSharedTab, currentUserId }) {
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
            border: '2px dashed #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#6B7280' }}>No tasks</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onView={onView}
              isSharedTab={isSharedTab}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete, onView, isSharedTab, currentUserId }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
  const myParticipant = isSharedTab
    ? task.participants?.find(p => String(p.userId?._id || p.userId) === String(currentUserId))
    : null;
  const displayStatus = myParticipant ? myParticipant.status : task.status;

  return (
    <div
      onClick={() => onView(task._id)}
      className="group"
      style={{
        background: '#fff',
        border: `1px solid #E5E7EB`,
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
        color: task.status === 'completed' ? '#9CA3AF' : '#111827',

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
          color: '#6B7280',
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
              background: (TYPE_COLORS[task.type] || TYPE_COLORS.other).bg,
              color: (TYPE_COLORS[task.type] || TYPE_COLORS.other).text,
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
              color: isOverdue ? '#ef4444' : '#9CA3AF',
            }}>
              {isOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
              {isOverdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
            </div>
          )}
        </div>
      )}

      {/* Footer: status + delete */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 8,
        borderTop: '1px solid #E5E7EB',
        marginTop: 4,
      }}>
        <select
          value={displayStatus}
          onChange={e => { e.stopPropagation(); onStatusChange(task._id, e.target.value); }}
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: 11,
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            padding: '4px 10px',
            background: '#FFFFFF',
            color: '#6b21a8',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6b21a8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task._id); }}
              title="Delete task"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#D1D5DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s, background 0.15s',
                opacity: 0,
              }}
              className="group-hover:opacity-100"
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D1D5DB'; }}
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
