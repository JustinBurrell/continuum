import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const dates = [];
  // padding before
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    dates.push({ date: d, current: false });
  }
  // current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push({ date: new Date(year, month, d), current: true });
  }
  // padding after
  const remaining = 42 - dates.length;
  for (let d = 1; d <= remaining; d++) {
    dates.push({ date: new Date(year, month + 1, d), current: false });
  }
  return dates;
}

function getWeekDates(anchorDate) {
  const d = new Date(anchorDate);
  d.setDate(d.getDate() - d.getDay()); // go to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed' };

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('month');
  const [selected, setSelected] = useState(null);
  const [weekAnchor, setWeekAnchor] = useState(now);
  const [viewingTaskId, setViewingTaskId] = useState(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weekDates = getWeekDates(weekAnchor);
  const weekFrom = toISO(weekDates[0]);
  const weekTo = toISO(weekDates[6]);
  const from = view === 'week' ? weekFrom : toISO(firstDay);
  const to = view === 'week' ? weekTo : toISO(lastDay);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', from, to, view],
    queryFn: () =>
      api.get('/calendar', { params: { from, to, view } }).then(r => r.data),
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const prevWeek = () => setWeekAnchor(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekAnchor(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });

  const days = data?.days || {};
  const overdue = data?.overdue || [];
  const dates = getMonthDates(year, month);

  const selectedTasks = selected ? (days[selected] || []) : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <div className="flex gap-2">
          {['month', 'week'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                view === v ? 'bg-primary text-white' : 'bg-accent text-foreground/70 hover:text-primary'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-3">
          {view === 'week' ? (
            <WeekView days={days} weekDates={weekDates} now={now} onPrev={prevWeek} onNext={nextWeek} onViewTask={setViewingTaskId} />
          ) : (
            <Card className="p-0 overflow-hidden">
              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-accent text-secondary transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <h2 className="font-semibold text-foreground">
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-accent text-secondary transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day of week header */}
              <div className="grid grid-cols-7 border-b border-border">
                {DOW.map(d => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-medium text-secondary">
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              {isLoading ? (
                <div className="grid grid-cols-7 gap-px bg-border">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-none" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7">
                  {dates.map(({ date, current }, i) => {
                    const key = toISO(date);
                    const tasksForDay = days[key] || [];
                    const isToday = key === toISO(now);
                    const isSelected = key === selected;

                    return (
                      <div
                        key={i}
                        onClick={() => setSelected(isSelected ? null : key)}
                        className={`min-h-[72px] p-2 border-b border-r border-border cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent' :
                          isToday ? 'bg-primary/5' :
                          'hover:bg-accent/50'
                        } ${!current ? 'opacity-40' : ''}`}
                      >
                        <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-primary text-white' : 'text-foreground'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {tasksForDay.slice(0, 2).map(task => (
                            <div
                              key={task._id}
                              onClick={e => { e.stopPropagation(); setViewingTaskId(task._id); }}
                              className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 truncate hover:bg-primary/20 transition-colors"
                            >
                              {task.title}
                            </div>
                          ))}
                          {tasksForDay.length > 2 && (
                            <div className="text-xs text-secondary">+{tasksForDay.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day tasks */}
          {selected && (
            <Card>
              <h3 className="font-semibold text-foreground mb-3 text-sm">
                {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedTasks.length === 0 ? (
                <p className="text-xs text-secondary">No tasks on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTasks.map(task => (
                    <div
                      key={task._id}
                      onClick={() => setViewingTaskId(task._id)}
                      className="flex items-start gap-2 cursor-pointer rounded-lg px-2 py-1 -mx-2 hover:bg-accent transition-colors"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-amber-500' : 'bg-secondary/50'
                      }`} />
                      <div>
                        <p className="text-xs font-medium text-foreground">{task.title}</p>
                        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'neutral'} className="text-xs mt-0.5">
                          {STATUS_LABELS[task.status] || task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Overdue */}
          <Card>
            <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-500" /> Overdue
            </h3>
            {overdue.length === 0 ? (
              <p className="text-xs text-secondary">No overdue tasks 🎉</p>
            ) : (
              <div className="space-y-2">
                {overdue.map(task => (
                  <div
                    key={task._id}
                    onClick={() => setViewingTaskId(task._id)}
                    className="flex items-start gap-2 cursor-pointer rounded-lg px-2 py-1 -mx-2 hover:bg-accent transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground line-clamp-1">{task.title}</p>
                      <p className="text-xs text-red-500 flex items-center gap-0.5 mt-0.5">
                        <Clock size={9} /> {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <TaskDetailModal
        taskId={viewingTaskId}
        open={!!viewingTaskId}
        onClose={() => setViewingTaskId(null)}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
        }}
      />
    </div>
  );
}

function WeekView({ days, weekDates, now, onPrev, onNext, onViewTask }) {
  const [selected, setSelected] = useState(null);
  const selectedTasks = selected ? (days[selected] || []) : [];

  const weekLabel = weekDates.length > 0
    ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <Card className="p-0 overflow-hidden">
      {/* Week nav */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-accent text-secondary transition-colors">
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-semibold text-foreground text-sm">{weekLabel}</h2>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-accent text-secondary transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      {/* Day columns */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDates.map((date, i) => {
          const key = toISO(date);
          const isToday = key === toISO(now);
          const isSelected = key === selected;
          const tasksForDay = days[key] || [];
          return (
            <div
              key={i}
              onClick={() => setSelected(isSelected ? null : key)}
              className={`min-h-[120px] p-2 border-r border-border cursor-pointer transition-colors ${isSelected ? 'bg-accent' : isToday ? 'bg-primary/5' : 'hover:bg-accent/50'}`}
            >
              <div className="mb-2 text-center">
                <p className="text-xs text-secondary font-medium">{DOW[date.getDay()]}</p>
                <div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-0.5">
                {tasksForDay.slice(0, 3).map(task => (
                  <div
                    key={task._id}
                    onClick={e => { e.stopPropagation(); onViewTask(task._id); }}
                    className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 truncate hover:bg-primary/20 transition-colors"
                  >
                    {task.title}
                  </div>
                ))}
                {tasksForDay.length > 3 && (
                  <div className="text-xs text-secondary">+{tasksForDay.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Selected day detail */}
      {selected && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs font-semibold text-secondary mb-2">
            {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-secondary">No tasks</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => onViewTask(task._id)}
                  className="flex items-center gap-1.5 bg-accent rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/70 transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-secondary/50'}`} />
                  <span className="text-xs text-foreground font-medium">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
