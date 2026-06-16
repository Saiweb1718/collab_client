import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clusterApi, projectApi, taskApi } from '../api/index.js';
import { useAuth } from '../xcontext/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { gradientFor } from '../lib/format.js';

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ clusters: [], projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [clusters, projects, tasks] = await Promise.all([
          clusterApi.list(),
          projectApi.mine(),
          taskApi.mine(),
        ]);
        setData({ clusters: clusters.data, projects: projects.data, tasks: tasks.data });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user.user_name?.split(' ')[0];

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-haze">
        <Spinner size={28} />
      </div>
    );

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <p className="text-sm text-haze">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{firstName} 👋</h1>
      </header>

      <Section title="Workspaces" count={data.clusters.length}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.clusters.map((c) => (
            <Link
              key={c.cluster_id}
              to={`/clusters/${c.cluster_id}`}
              className="card group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div
                className="mb-4 grid h-11 w-11 place-items-center rounded-2xl text-lg font-bold text-white shadow-soft"
                style={{ background: gradientFor(c.cluster_name) }}
              >
                {c.cluster_name[0]?.toUpperCase()}
              </div>
              <h3 className="font-semibold tracking-tight">{c.cluster_name}</h3>
              <p className="mt-0.5 text-sm text-haze">{c.memberCount} members · {c.userRole}</p>
            </Link>
          ))}
          {data.clusters.length === 0 && (
            <EmptyHint text="Create or join a workspace from the sidebar to get started." />
          )}
        </div>
      </Section>

      <Section title="Recent projects" count={data.projects.length}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.slice(0, 6).map((p) => (
            <Link
              key={p.project_id}
              to={`/projects/${p.project_id}`}
              className="card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {p.cluster_name}
              </p>
              <h3 className="mt-1 font-semibold tracking-tight">{p.project_name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-haze">
                {p.description || 'No description'}
              </p>
            </Link>
          ))}
          {data.projects.length === 0 && <EmptyHint text="You're not part of any projects yet." />}
        </div>
      </Section>

      <Section title="My tasks" count={data.tasks.length}>
        <div className="card divide-y divide-fill/10 overflow-hidden">
          {data.tasks.length === 0 ? (
            <div className="p-6 text-sm text-haze">No tasks assigned to you. Enjoy the calm. 🌿</div>
          ) : (
            data.tasks.map((t) => (
              <Link
                key={t.task_id}
                to={`/projects/${t.task_project_id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-fill/5"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    t.task_status === 'done'
                      ? 'bg-[#34c759]'
                      : t.task_status === 'in_progress'
                        ? 'bg-[#ff9500]'
                        : 'bg-haze/50'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.task_name}</p>
                  <p className="truncate text-xs text-haze">{t.project_name}</p>
                </div>
                <span className="chip bg-fill/10 text-haze">{STATUS_LABEL[t.task_status]}</span>
              </Link>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}

const Section = ({ title, count, children }) => (
  <section className="mb-9">
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <span className="text-sm text-haze">{count}</span>
    </div>
    {children}
  </section>
);

const EmptyHint = ({ text }) => (
  <div className="col-span-full rounded-3xl border border-dashed border-fill/15 p-6 text-center text-sm text-haze">
    {text}
  </div>
);
