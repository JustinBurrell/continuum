import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Clock, AlertCircle, Trash2, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { formatDate } from '@/lib/utils';

const STATUSES = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS = { 'todo': 'To Do', 'in_progress': 'In Progress', 'completed': 'Completed' };
const STATUS_COLORS = { todo: 'neutral', 'in_progress': 'warning', completed: 'success' };
const PRIORITIES = ['low', 'medium', 'high'];

const emptyForm = {
  title: '', description: '', priority: 'medium', status: 'todo',
  dueDate: '', isShared: false,
};

export default function Tasks() {
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sharedTab, setSharedTab] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState(location.state?.openTaskId ?? null);

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

  // Group by status for kanban
  const columns = STATUSES.map(status => ({
    status,
    tasks: allTasks.filter(t => t.status === status),
  }));

  const handleStatusChange = (taskId, newStatus) => {
    statusMutation.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-secondary text-sm mt-0.5">{allTasks.length} tasks</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New task
        </Button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSharedTab(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !sharedTab
              ? 'bg-primary text-white'
              : 'bg-accent text-foreground/70 hover:text-primary'
          }`}
        >
          My tasks
        </button>
        <button
          onClick={() => setSharedTab(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sharedTab
              ? 'bg-primary text-white'
              : 'bg-accent text-foreground/70 hover:text-primary'
          }`}
        >
          Shared with me
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUSES.map(s => <Skeleton key={s} className="h-64" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <label className="text-sm font-medium text-foreground block mb-1.5">Due date</label>
              <input
                type="date"
                className="input-field"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={form.isShared}
              onChange={e => setForm(f => ({ ...f, isShared: e.target.checked }))}
            />
            Shared task (allow collaborators)
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                ...form,
                dueDate: form.dueDate || undefined,
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
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
        <span className="text-xs text-secondary font-medium">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-3">
        {tasks.length === 0 ? (
          <div className="h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
            <p className="text-xs text-secondary">No tasks</p>
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

  return (
    <Card className="group p-4 cursor-pointer" onClick={() => onView(task._id)}>
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
          task.priority === 'high' ? 'bg-red-500' :
          task.priority === 'medium' ? 'bg-amber-500' : 'bg-secondary/50'
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-foreground line-clamp-2 ${
            task.status === 'completed' ? 'line-through text-secondary' : ''
          }`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-secondary mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>

      {task.dueDate && (
        <div className={`flex items-center gap-1 text-xs mb-3 ${isOverdue ? 'text-red-500' : 'text-secondary'}`}>
          {isOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
          {isOverdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <select
          value={task.status}
          onChange={e => { e.stopPropagation(); onStatusChange(task._id, e.target.value); }}
          onClick={e => e.stopPropagation()}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(task._id); }}
              className="p-1 rounded hover:bg-red-50 text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {task.isShared && task.participants?.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <UserPlus size={11} className="text-secondary" />
          <span className="text-xs text-secondary">{task.participants.length} collaborator{task.participants.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </Card>
  );
}
