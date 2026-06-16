import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Inbox } from 'lucide-react';
import { taskApi } from '../api/index.js';
import Spinner from '../components/ui/Spinner.jsx';

const ACTIVE_GROUPS = [
  { key: 'todo', label: 'To Do', dot: 'bg-haze/50' },
  { key: 'in_progress', label: 'In Progress', dot: 'bg-[#ff9500]' },
];
const PRIORITY = {
  low: 'bg-fill/10 text-haze',
  medium: 'bg-accent/10 text-accent',
  high: 'bg-[#ff375f]/10 text-[#ff375f]',
};
const RANGES = [
  { key: 'week', label: 'Last week' },
  { key: 'month', label: 'Last month' },
  { key: 'all', label: 'All time' },
];

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-full bg-fill/5 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            value === o.key ? 'bg-surface text-ink shadow-soft' : 'text-haze hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function MyTasks() {
  const [view, setView] = useState('active'); // active | history
  const [range, setRange] = useState('month');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = view === 'history' ? { status: 'done', range } : { status: 'active' };
    taskApi
      .mine(params)
      .then((res) => active && setTasks(res.data || []))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [view, range]);

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Tasks</h1>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { key: 'active', label: 'Active' },
            { key: 'history', label: 'History' },
          ]}
        />
      </div>

      {view === 'history' && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-haze">Completed in:</span>
          <Segmented value={range} onChange={setRange} options={RANGES} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-haze">
          <Spinner size={28} />
        </div>
      ) : view === 'history' ? (
        <HistoryList tasks={tasks} />
      ) : (
        <ActiveBoard tasks={tasks} />
      )}
    </div>
  );
}

function TaskCard({ t, footer }) {
  return (
    <Link
      to={`/projects/${t.task_project_id}`}
      className="card block p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{t.task_name}</p>
        <span className={`chip ${PRIORITY[t.task_priority]}`}>{t.task_priority}</span>
      </div>
      <p className="mt-1 text-xs text-haze">{t.project_name}</p>
      {footer}
    </Link>
  );
}

function ActiveBoard({ tasks }) {
  if (tasks.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-fill/15 p-12 text-center text-haze">
        <div className="mb-2 text-4xl">🌿</div>
        Nothing on your plate. Enjoy the calm.
      </div>
    );
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {ACTIVE_GROUPS.map((g) => {
        const items = tasks.filter((t) => t.task_status === g.key);
        return (
          <div key={g.key}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
              <h2 className="text-sm font-semibold">{g.label}</h2>
              <span className="text-xs text-haze">{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.map((t) => (
                <TaskCard
                  key={t.task_id}
                  t={t}
                  footer={
                    t.task_deadline && (
                      <p className="mt-2 text-xs text-haze">
                        Due {new Date(t.task_deadline).toLocaleDateString()}
                      </p>
                    )
                  }
                />
              ))}
              {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-fill/15 py-6 text-center text-xs text-haze">
                  Nothing here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedCard({ t }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{t.task_name}</p>
        {t.archived ? (
          <span className="chip bg-fill/10 text-haze">Archived</span>
        ) : (
          <span className={`chip ${PRIORITY[t.priority] || PRIORITY.medium}`}>{t.priority}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-haze">{t.project_name}</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-[#34c759]">
        <CheckCircle2 size={13} />
        Completed {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : ''}
      </p>
    </>
  );
  // archived items have no live project to open
  return t.archived ? (
    <div className="card block p-4 opacity-90">{body}</div>
  ) : (
    <Link to={`/projects/${t.project_id}`} className="card block p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      {body}
    </Link>
  );
}

function HistoryList({ tasks }) {
  if (tasks.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-fill/15 p-12 text-center text-haze">
        <div className="mb-3 flex justify-center"><Inbox size={40} strokeWidth={1.5} /></div>
        No completed tasks in this period.
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => (
        <CompletedCard key={t.id} t={t} />
      ))}
    </div>
  );
}
