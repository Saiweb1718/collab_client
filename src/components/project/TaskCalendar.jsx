import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_DOT = {
  todo: 'bg-haze/60',
  in_progress: 'bg-[#ff9500]',
  done: 'bg-[#34c759]',
};
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function TaskCalendar({ tasks, onTaskClick }) {
  const [cursor, setCursor] = useState(() => new Date());

  // group tasks by their deadline day
  const byDay = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.task_deadline) continue;
      const key = t.task_deadline.slice(0, 10);
      (map[key] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const unscheduled = useMemo(() => tasks.filter((t) => !t.task_deadline), [tasks]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back to Sunday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const todayKey = ymd(new Date());
  const monthLabel = cursor.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const move = (delta) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="flex flex-col">
      {/* Calendar header */}
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-fill/10">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => move(1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-fill/10">
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={() => setCursor(new Date())} className="btn-secondary !py-1.5 text-xs">
          Today
        </button>
        {unscheduled.length > 0 && (
          <span className="ml-auto text-xs text-haze">{unscheduled.length} unscheduled</span>
        )}
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-2 pb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-semibold uppercase tracking-wide text-haze">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((d, i) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey;
          const dayTasks = byDay[key] || [];
          return (
            <div
              key={i}
              className={`flex min-h-[96px] flex-col rounded-2xl border p-1.5 transition ${
                inMonth ? 'border-fill/10 bg-surface/60' : 'border-transparent opacity-40'
              }`}
            >
              <span
                className={`mb-1 grid h-6 w-6 place-items-center self-end rounded-full text-xs ${
                  isToday ? 'bg-accent font-semibold text-white' : 'text-haze'
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.task_id}
                    onClick={() => onTaskClick?.(t)}
                    title={t.task_name}
                    className="flex items-center gap-1.5 rounded-lg bg-fill/5 px-1.5 py-1 text-left text-[11px] leading-tight transition hover:bg-fill/10"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[t.task_status]}`} />
                    <span className="truncate">{t.task_name}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="px-1 text-[10px] text-haze">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
