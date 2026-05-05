import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, Search, X } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const dates = [];
  for (let i = 0; i < startDow; i++) {
    dates.push({ date: new Date(year, month, -startDow + i + 1), current: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push({ date: new Date(year, month, d), current: true });
  }
  const remaining = 42 - dates.length;
  for (let d = 1; d <= remaining; d++) {
    dates.push({ date: new Date(year, month + 1, d), current: false });
  }
  return dates;
}

function getWeekDates(anchorDate) {
  const d = new Date(anchorDate);
  d.setDate(d.getDate() - d.getDay());
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

const PRIORITY_COLOR = {
  high:   { bg: '#FEE2E2', text: '#DC2626', dot: '#ef4444' },
  medium: { bg: 'rgba(217,119,6,0.08)', text: '#D97706', dot: '#f59e0b' },
  low:    { bg: 'rgba(107,33,168,0.08)', text: '#6b21a8', dot: '#d1d5db' },
};
const priorityStyle = (p) => PRIORITY_COLOR[p] || PRIORITY_COLOR.low;

const cardStyle = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
  overflow: 'hidden',
};

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('month');
  const [selected, setSelected] = useState(null);
  const [weekAnchor, setWeekAnchor] = useState(now);
  const [viewingTaskId, setViewingTaskId] = useState(null);
  const [calSearch, setCalSearch] = useState('');

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weekDates = getWeekDates(weekAnchor);
  const weekFrom = toISO(weekDates[0]);
  const weekTo = toISO(weekDates[6]);
  const from = view === 'week' ? weekFrom : toISO(firstDay);
  const to = view === 'week' ? weekTo : toISO(lastDay);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', from, to, view],
    queryFn: () => api.get('/calendar', { params: { from, to, view } }).then(r => r.data),
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

  const switchView = (v) => {
    setView(v);
    setSelected(null);
  };

  const rawDays = data?.days || {};
  const rawOverdue = data?.overdue || [];

  // Dedupe overdue by _id (recurring tasks can generate many same-title documents)
  const seenIds = new Set();
  const overdue = rawOverdue.filter(t => {
    if (seenIds.has(t._id)) return false;
    seenIds.add(t._id);
    return true;
  });

  const allTasksFlat = [
    ...Object.entries(rawDays).flatMap(([dateKey, tasks]) =>
      tasks.map(t => ({ ...t, _dateKey: dateKey }))
    ),
    ...overdue.map(t => ({ ...t, _dateKey: t.dueDate ? toISO(new Date(t.dueDate)) : null })),
  ].reduce((acc, t) => {
    if (!acc.find(x => x._id === t._id)) acc.push(t);
    return acc;
  }, []);

  const searchResults = calSearch
    ? allTasksFlat.filter(t => t.title?.toLowerCase().includes(calSearch.toLowerCase()))
    : [];

  const days = rawDays;
  const dates = getMonthDates(year, month);
  const selectedTasks = selected ? (days[selected] || []) : [];


  const selectedDateLabel = selected
    ? new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Calendar
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['month', 'week'].map(v => (
            <button
              key={v}
              onClick={() => switchView(v)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
                background: view === v ? '#6b21a8' : '#FFFFFF',
                color: view === v ? '#fff' : '#374151',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
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
          placeholder="Search tasks by name..."
          value={calSearch}
          onChange={e => setCalSearch(e.target.value)}
        />
      </div>

      {/* Search results */}
      {calSearch && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, fontWeight: 500 }}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{calSearch}"
          </p>
          {searchResults.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '32px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>No tasks found matching "{calSearch}"</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(task => {
                const dateLabel = task._dateKey
                  ? new Date(task._dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
                  : 'No date';
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                const ps = priorityStyle(task.priority);
                return (
                  <div
                    key={task._id}
                    onClick={() => setViewingTaskId(task._id)}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderLeft: `3px solid ${ps.dot}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                      transition: 'box-shadow 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isOverdue ? '#ef4444' : '#9CA3AF' }}>
                          {isOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
                          {dateLabel}
                        </span>
                        {task.type && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: 'rgba(107,33,168,0.08)', color: '#6b21a8', textTransform: 'capitalize' }}>
                            {task.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'neutral'}>
                      {STATUS_LABELS[task.status] || task.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ display: calSearch ? 'none' : 'grid', gridTemplateColumns: '1fr 288px', gap: 20 }}>
        {/* Calendar grid */}
        <div>
          {view === 'week' ? (
            <WeekView
              days={days}
              weekDates={weekDates}
              now={now}
              selected={selected}
              onSelect={setSelected}
              onPrev={prevWeek}
              onNext={nextWeek}
              onViewTask={setViewingTaskId}
              isLoading={isLoading}
            />
          ) : (
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 520 }}>
              {/* Month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                <button onClick={prevMonth} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={16} />
                </button>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={nextMonth} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* DOW header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                {DOW.map(d => (
                  <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1 }}>
                  {Array.from({ length: 42 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-none" />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, overflow: 'hidden' }}>
                  {dates.map(({ date, current }, i) => {
                    const key = toISO(date);
                    const tasksForDay = days[key] || [];
                    const isToday = key === toISO(now);
                    const isSelected = key === selected;
                    return (
                      <div
                        key={i}
                        onClick={() => setSelected(isSelected ? null : key)}
                        style={{
                          padding: '6px 6px',
                          borderBottom: '1px solid #E5E7EB',
                          borderRight: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                          background: isSelected ? 'rgba(107,33,168,0.06)' : isToday ? 'rgba(107,33,168,0.04)' : '#fff',
                          opacity: current ? 1 : 0.35,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: isToday ? 700 : 500,
                          background: isToday ? '#6b21a8' : isSelected ? 'rgba(107,33,168,0.12)' : 'transparent',
                          color: isToday ? '#fff' : '#374151',
                          marginBottom: 3, flexShrink: 0,
                        }}>
                          {date.getDate()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                          {tasksForDay.slice(0, 2).map(task => {
                            const ps = priorityStyle(task.priority);
                            return (
                              <div
                                key={task._id}
                                onClick={e => { e.stopPropagation(); setViewingTaskId(task._id); }}
                                style={{
                                  fontSize: 10, background: ps.bg, color: ps.text,
                                  borderRadius: 4, padding: '1px 5px',
                                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                  fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.12s', flexShrink: 0,
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                              >
                                {task.title}
                              </div>
                            );
                          })}
                          {tasksForDay.length > 2 && (
                            <div style={{ fontSize: 9, color: '#9CA3AF', paddingLeft: 2, fontWeight: 500, flexShrink: 0 }}>
                              +{tasksForDay.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Selected day panel */}
          {selected ? (
            <div style={cardStyle}>
              <div style={{ padding: '12px 14px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6b21a8', margin: 0 }}>
                    {selectedDateLabel}
                  </h3>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ padding: 2, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', borderRadius: 4 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              {selectedTasks.length === 0 ? (
                <div style={{ padding: '0 14px 14px' }}>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>No tasks on this day.</p>
                </div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto', padding: '0 14px 12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTasks.map(task => {
                      const ps = priorityStyle(task.priority);
                      return (
                        <div
                          key={task._id}
                          onClick={() => setViewingTaskId(task._id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                            padding: '7px 8px', borderRadius: 8,
                            transition: 'background 0.12s', margin: '0 -8px',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: ps.dot }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {task.title}
                            </p>
                            <Badge
                              variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'neutral'}
                              className="text-xs mt-0.5"
                            >
                              {STATUS_LABELS[task.status] || task.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: '14px' }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, textAlign: 'center' }}>
                Click a day to see its tasks
              </p>
            </div>
          )}

          {/* Overdue panel */}
          <div style={cardStyle}>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                  Overdue
                  {overdue.length > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#fff', background: '#ef4444',
                      borderRadius: 20, padding: '1px 6px', lineHeight: 1.4,
                    }}>
                      {overdue.length}
                    </span>
                  )}
                </h3>
              </div>
              {overdue.length === 0 ? (
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>No overdue tasks. Nice work.</p>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {overdue.map(task => (
                    <div
                      key={task._id}
                      onClick={() => setViewingTaskId(task._id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                        padding: '6px 8px', borderRadius: 8,
                        transition: 'background 0.12s', margin: '0 -8px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 5, background: '#ef4444', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </p>
                        <p style={{ fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1, margin: 0 }}>
                          <Clock size={9} />
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailModal
        taskId={viewingTaskId}
        open={!!viewingTaskId}
        onClose={() => setViewingTaskId(null)}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ['tasks-count'], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ['tasks-dashboard-display'], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ['calendar'], refetchType: 'all' });
        }}
      />
    </div>
  );
}

function WeekView({ days, weekDates, now, selected, onSelect, onPrev, onNext, onViewTask, isLoading }) {
  const weekLabel = weekDates.length > 0
    ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <div style={{
      ...cardStyle,
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 180px)', minHeight: 400,
    }}>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <button onClick={onPrev} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{weekLabel}</h2>
        <button onClick={onNext} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflow: 'hidden' }}>
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ borderRight: '1px solid #E5E7EB', padding: 10 }}>
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-full rounded mb-1" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ))
          : weekDates.map((date, i) => {
              const key = toISO(date);
              const isToday = key === toISO(now);
              const isSelected = key === selected;
              const tasksForDay = days[key] || [];
              return (
                <div
                  key={i}
                  onClick={() => onSelect(isSelected ? null : key)}
                  style={{
                    padding: '10px 8px',
                    borderRight: i < 6 ? '1px solid #E5E7EB' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    background: isSelected ? 'rgba(107,33,168,0.06)' : isToday ? 'rgba(107,33,168,0.04)' : '#fff',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}
                >
                  {/* Day header */}
                  <div style={{ textAlign: 'center', marginBottom: 8, flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {['S','M','T','W','T','F','S'][date.getDay()]}
                    </p>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: isToday ? '#6b21a8' : isSelected ? 'rgba(107,33,168,0.12)' : 'transparent',
                      color: isToday ? '#fff' : '#374151',
                      margin: '2px auto 0',
                    }}>
                      {date.getDate()}
                    </div>
                    {tasksForDay.length > 0 && (
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: isToday ? '#fff' : '#6b21a8', margin: '3px auto 0', opacity: 0.6 }} />
                    )}
                  </div>

                  {/* Task chips — capped at 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                    {tasksForDay.slice(0, 3).map(task => {
                      const ps = priorityStyle(task.priority);
                      return (
                        <div
                          key={task._id}
                          onClick={e => { e.stopPropagation(); onViewTask(task._id); }}
                          title={task.title}
                          style={{
                            fontSize: 10, background: ps.bg, color: ps.text,
                            borderRadius: 4, padding: '2px 5px',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                            transition: 'opacity 0.12s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {tasksForDay.length > 3 && (
                      <div
                        onClick={e => { e.stopPropagation(); onSelect(key); }}
                        style={{ fontSize: 9, color: '#6b21a8', paddingLeft: 2, fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}
                      >
                        +{tasksForDay.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
