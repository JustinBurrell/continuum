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

const cardStyle = {
  background: '#fff',
  border: '1px solid #ede9fe',
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
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
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
                background: view === v ? '#6b21a8' : '#f5f0ff',
                color: view === v ? '#fff' : '#6b21a8',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Calendar grid */}
        <div>
          {view === 'week' ? (
            <WeekView days={days} weekDates={weekDates} now={now} onPrev={prevWeek} onNext={nextWeek} onViewTask={setViewingTaskId} />
          ) : (
            <div style={cardStyle}>
              {/* Month nav */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid #ede9fe',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #ede9fe' }}>
                {DOW.map(d => (
                  <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#a087b0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {Array.from({ length: 42 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-none" />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
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
                          minHeight: 76,
                          padding: 8,
                          borderBottom: '1px solid #ede9fe',
                          borderRight: '1px solid #ede9fe',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                          background: isSelected
                            ? '#f5f0ff'
                            : isToday
                            ? 'rgba(107,33,168,0.04)'
                            : '#fff',
                          opacity: current ? 1 : 0.35,
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
                          marginBottom: 4,
                        }}>
                          {date.getDate()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {tasksForDay.slice(0, 2).map(task => (
                            <div
                              key={task._id}
                              onClick={e => { e.stopPropagation(); setViewingTaskId(task._id); }}
                              style={{
                                fontSize: 10,
                                background: 'rgba(107,33,168,0.1)',
                                color: '#6b21a8',
                                borderRadius: 4,
                                padding: '1px 5px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              {task.title}
                            </div>
                          ))}
                          {tasksForDay.length > 2 && (
                            <div style={{ fontSize: 10, color: '#a087b0', paddingLeft: 2 }}>+{tasksForDay.length - 2} more</div>
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
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
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
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f0ff'}
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
      border: '1px solid #ede9fe',
      borderRadius: 16,
      boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
      overflow: 'hidden',
    }}>
      {/* Week nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #ede9fe',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
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
                minHeight: 140,
                padding: '10px 8px',
                borderRight: '1px solid #ede9fe',
                cursor: 'pointer',
                transition: 'background 0.12s',
                background: isSelected ? '#f5f0ff' : isToday ? 'rgba(107,33,168,0.04)' : '#fff',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#a087b0', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {DOW[date.getDay()]}
                </p>
                <div style={{
                  width: 28,
                  height: 28,
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {tasksForDay.slice(0, 3).map(task => (
                  <div
                    key={task._id}
                    onClick={e => { e.stopPropagation(); onViewTask(task._id); }}
                    style={{
                      fontSize: 10,
                      background: 'rgba(107,33,168,0.1)',
                      color: '#6b21a8',
                      borderRadius: 4,
                      padding: '2px 5px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {task.title}
                  </div>
                ))}
                {tasksForDay.length > 3 && (
                  <div style={{ fontSize: 10, color: '#a087b0', paddingLeft: 2 }}>+{tasksForDay.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #ede9fe', background: '#fef7ff' }}>
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
                    border: '1px solid #ede9fe',
                    borderRadius: 8,
                    padding: '5px 10px',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6b21a8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#ede9fe'}
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
