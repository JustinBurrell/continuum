import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, Search } from 'lucide-react';
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

  const rawDays = data?.days || {};
  const rawOverdue = data?.overdue || [];

  // Flat list of all tasks with their dates, for search results view
  const allTasksFlat = [
    ...Object.entries(rawDays).flatMap(([dateKey, tasks]) =>
      tasks.map(t => ({ ...t, _dateKey: dateKey }))
    ),
    ...rawOverdue.map(t => ({ ...t, _dateKey: t.dueDate ? toISO(new Date(t.dueDate)) : null })),
  ].reduce((acc, t) => {
    // dedupe by _id
    if (!acc.find(x => x._id === t._id)) acc.push(t);
    return acc;
  }, []);

  const searchResults = calSearch
    ? allTasksFlat.filter(t => t.title?.toLowerCase().includes(calSearch.toLowerCase()))
    : [];

  const days = rawDays;
  const overdue = rawOverdue;
  const dates = getMonthDates(year, month);

  const selectedTasks = selected ? (days[selected] || []) : [];

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Calendar
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['month', 'week'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
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
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a087b0', pointerEvents: 'none' }} />
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

      {/* Search results list (shown instead of calendar when searching) */}
      {calSearch && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#a087b0', marginBottom: 12, fontWeight: 500 }}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{calSearch}"
          </p>
          {searchResults.length === 0 ? (
            <div style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              padding: '32px 0',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: '#a087b0' }}>No tasks found matching "{calSearch}"</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(task => {
                const dateLabel = task._dateKey
                  ? new Date(task._dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
                  : 'No date';
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                return (
                  <div
                    key={task._id}
                    onClick={() => setViewingTaskId(task._id)}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderLeft: `3px solid ${task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#d1d5db'}`,
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isOverdue ? '#ef4444' : '#a087b0' }}>
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

      <div style={{ display: calSearch ? 'none' : 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Calendar grid */}
        <div>
          {view === 'week' ? (
            <WeekView days={days} weekDates={weekDates} now={now} onPrev={prevWeek} onNext={nextWeek} onViewTask={setViewingTaskId} />
          ) : (
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 520 }}>
              {/* Month nav */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid #E5E7EB',
                flexShrink: 0,
              }}>
                <button
                  onClick={prevMonth}
                  style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#a087b0', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {MONTHS[month]} {year}
                </h2>
                <button
                  onClick={nextMonth}
                  style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#a087b0', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day of week header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
                {DOW.map(d => (
                  <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#a087b0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells — fixed height grid with equal rows */}
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
                          background: isSelected
                            ? 'rgba(107,33,168,0.04)'
                            : isToday
                            ? 'rgba(107,33,168,0.04)'
                            : '#fff',
                          opacity: current ? 1 : 0.35,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: isToday ? 700 : 500,
                          background: isToday ? '#6b21a8' : 'transparent',
                          color: isToday ? '#fff' : '#374151',
                          marginBottom: 3,
                          flexShrink: 0,
                        }}>
                          {date.getDate()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                          {tasksForDay.slice(0, 2).map(task => (
                            <div
                              key={task._id}
                              onClick={e => { e.stopPropagation(); setViewingTaskId(task._id); }}
                              style={{
                                fontSize: 10,
                                background: task.priority === 'high' ? '#fef2f2' : task.priority === 'medium' ? '#fffbeb' : 'rgba(107,33,168,0.08)',
                                color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#b45309' : '#6b21a8',
                                borderRadius: 4,
                                padding: '1px 5px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'opacity 0.12s',
                                flexShrink: 0,
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              {task.title}
                            </div>
                          ))}
                          {tasksForDay.length > 2 && (
                            <div style={{ fontSize: 9, color: '#a087b0', paddingLeft: 2, fontWeight: 500, flexShrink: 0 }}>+{tasksForDay.length - 2} more</div>
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

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected day tasks */}
          {selected && (
            <div style={cardStyle}>
              <div style={{ padding: '14px 16px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
                  {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                {selectedTasks.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#a087b0' }}>No tasks on this day.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedTasks.map(task => (
                      <div
                        key={task._id}
                        onClick={() => setViewingTaskId(task._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          cursor: 'pointer',
                          padding: '6px 8px',
                          borderRadius: 8,
                          transition: 'background 0.12s',
                          margin: '0 -8px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          marginTop: 5,
                          flexShrink: 0,
                          background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#d1d5db',
                        }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0 }}>{task.title}</p>
                          <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'neutral'} className="text-xs mt-0.5">
                            {STATUS_LABELS[task.status] || task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overdue */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 16px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} style={{ color: '#ef4444' }} /> Overdue
              </h3>
              {overdue.length === 0 ? (
                <p style={{ fontSize: 12, color: '#a087b0' }}>No overdue tasks. Nice work.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {overdue.map(task => (
                    <div
                      key={task._id}
                      onClick={() => setViewingTaskId(task._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: 8,
                        transition: 'background 0.12s',
                        margin: '0 -8px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 5, background: '#ef4444', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.title}</p>
                        <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Clock size={9} /> {new Date(task.dueDate).toLocaleDateString()}
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
    ? `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 140px)',
      minHeight: 400,
    }}>
      {/* Week nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0,
      }}>
        <button onClick={onPrev} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#a087b0', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{weekLabel}</h2>
        <button onClick={onNext} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#a087b0', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflow: 'hidden' }}>
        {weekDates.map((date, i) => {
          const key = toISO(date);
          const isToday = key === toISO(now);
          const isSelected = key === selected;
          const tasksForDay = days[key] || [];
          return (
            <div
              key={i}
              onClick={() => setSelected(isSelected ? null : key)}
              style={{
                padding: '10px 8px',
                borderRight: '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'background 0.12s',
                background: isSelected ? 'rgba(107,33,168,0.04)' : isToday ? 'rgba(107,33,168,0.04)' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 12, flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#a087b0', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {DOW[date.getDay()]}
                </p>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  background: isToday ? '#6b21a8' : 'transparent',
                  color: isToday ? '#fff' : '#374151',
                  margin: '4px auto 0',
                }}>
                  {date.getDate()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
                {tasksForDay.slice(0, 4).map(task => (
                  <div
                    key={task._id}
                    onClick={e => { e.stopPropagation(); onViewTask(task._id); }}
                    style={{
                      fontSize: 11,
                      background: task.priority === 'high' ? '#fef2f2' : task.priority === 'medium' ? '#fffbeb' : 'rgba(107,33,168,0.08)',
                      color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#b45309' : '#6b21a8',
                      borderRadius: 5,
                      padding: '2px 6px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'opacity 0.12s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {task.title}
                  </div>
                ))}
                {tasksForDay.length > 4 && (
                  <div style={{ fontSize: 10, color: '#a087b0', paddingLeft: 2, fontWeight: 500, flexShrink: 0 }}>+{tasksForDay.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', background: '#F8F9FA' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b21a8', marginBottom: 8 }}>
            {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedTasks.length === 0 ? (
            <p style={{ fontSize: 12, color: '#a087b0' }}>No tasks</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => onViewTask(task._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6b21a8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#d1d5db',
                  }} />
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
