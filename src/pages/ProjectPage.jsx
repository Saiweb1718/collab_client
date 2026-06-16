import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Settings, MessageSquare, Plus, Lock, Globe, UserPlus, LayoutGrid, CalendarDays } from 'lucide-react';
import { projectApi, taskApi } from '../api/index.js';
import Avatar from '../components/ui/Avatar.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import ChatDrawer from '../components/chat/ChatDrawer.jsx';
import ProjectSettings from '../components/project/ProjectSettings.jsx';
import RequestsModal from '../components/project/RequestsModal.jsx';
import TaskCalendar from '../components/project/TaskCalendar.jsx';
import { useIsDesktop } from '../lib/useMediaQuery.js';

const COLUMNS = [
  { key: 'todo', label: 'To Do', dot: 'bg-haze/50' },
  { key: 'in_progress', label: 'In Progress', dot: 'bg-[#ff9500]' },
  { key: 'done', label: 'Done', dot: 'bg-[#34c759]' },
];
const PRIORITY = {
  low: 'bg-fill/10 text-haze',
  medium: 'bg-accent/10 text-accent',
  high: 'bg-[#ff375f]/10 text-[#ff375f]',
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [view, setView] = useState('board'); // 'board' | 'calendar'
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const loadTasks = useCallback(async () => {
    const t = await taskApi.byProject(projectId);
    setTasks(t.data);
  }, [projectId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // fire all three in parallel instead of sequential phases
      const [p, m, t] = await Promise.all([
        projectApi.get(projectId),
        projectApi.members(projectId),
        taskApi.byProject(projectId),
      ]);
      setProject(p.data);
      setMembers(m.data);
      setTasks(t.data);
      if (p.data.is_manager) {
        projectApi
          .listRequests(projectId)
          .then((r) => setRequestCount(r.data?.length || 0))
          .catch(() => setRequestCount(0));
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const requestJoin = async () => {
    setRequesting(true);
    try {
      await projectApi.requestJoin(projectId);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setRequesting(false);
    }
  };

  const moveTask = async (task, status) => {
    setTasks((prev) => prev.map((t) => (t.task_id === task.task_id ? { ...t, task_status: status } : t)));
    await taskApi.update(task.task_id, { status });
  };

  if (loading || !project)
    return (
      <div className="flex h-full items-center justify-center text-haze">
        <Spinner size={28} />
      </div>
    );

  // desktop shows chat as a side column; mobile uses a full-screen drawer
  const showSidePanel = isDesktop && showChat && project.is_member && project.project_chat_id;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fill/10 px-4 py-4 sm:px-8 sm:py-5">
        <div className="min-w-0">
          <Link
            to={`/clusters/${project.cluster_id}`}
            className="text-xs font-medium uppercase tracking-wide text-accent hover:underline"
          >
            ← {project.cluster_name}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{project.project_name}</h1>
            <span className="chip bg-fill/10 text-haze">
              {project.project_visibility === 'company' ? <Globe size={12} /> : <Lock size={12} />}
              {project.project_visibility === 'company' ? 'Workspace' : 'Members'}
            </span>
          </div>
          {project.project_description && (
            <p className="mt-0.5 max-w-2xl text-sm text-haze">{project.project_description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {project.is_member ? (
            <>
              {project.is_manager && (
                <button className="btn-secondary relative" onClick={() => setRequestsOpen(true)}>
                  <UserPlus size={15} /> Requests
                  {requestCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white">
                      {requestCount}
                    </span>
                  )}
                </button>
              )}
              {project.is_manager && (
                <button className="btn-secondary" onClick={() => setSettingsOpen(true)}>
                  <Settings size={15} /> Settings
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => (isDesktop ? setShowChat((s) => !s) : setChatDrawerOpen(true))}
              >
                <MessageSquare size={15} /> {isDesktop && showChat ? 'Hide chat' : 'Chat'}
              </button>
              <button className="btn-primary" onClick={() => setCreating(true)}>
                <Plus size={15} /> New task
              </button>
            </>
          ) : project.pending_request ? (
            <span className="chip bg-[#ff9500]/10 text-[#ff9500]">⏳ Request pending</span>
          ) : (
            <button className="btn-primary" onClick={requestJoin} disabled={requesting}>
              {requesting ? <Spinner size={16} /> : 'Request to join'}
            </button>
          )}
        </div>
      </header>

      {/* Body: board + chat. Grid tracks guarantee the chat panel can never
          overlap the board (each lives in its own column). */}
      <div
        className={`grid min-h-0 flex-1 overflow-hidden ${
          showSidePanel ? 'lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]' : 'grid-cols-1'
        }`}
      >
        <div className="min-w-0 overflow-x-auto overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
          {!project.is_member ? (
            <div className="mx-auto mt-16 max-w-md rounded-3xl border border-dashed border-fill/15 p-10 text-center text-haze">
              <div className="mb-2 text-4xl">🔒</div>
              {project.pending_request
                ? 'Your request to join is pending approval.'
                : 'Request to join this project to view its tasks and chat.'}
            </div>
          ) : (
            <>
              <div className="mb-5 inline-flex rounded-full bg-fill/5 p-1">
                {[
                  ['board', 'Board', LayoutGrid],
                  ['calendar', 'Calendar', CalendarDays],
                ].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      view === id ? 'bg-surface text-ink shadow-soft' : 'text-haze hover:text-ink'
                    }`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
              {view === 'calendar' ? (
                <TaskCalendar tasks={tasks} onTaskClick={setEditing} />
              ) : (
                <div className="flex gap-5">
                  {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.task_status === col.key);
                return (
                  <div key={col.key} className="flex w-[80vw] max-w-[20rem] shrink-0 flex-col sm:w-80">
                    <div className="mb-3 flex items-center gap-2 px-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                      <h3 className="text-sm font-semibold">{col.label}</h3>
                      <span className="text-xs text-haze">{colTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {colTasks.map((t) => (
                        <button
                          key={t.task_id}
                          onClick={() => setEditing(t)}
                          className="card w-full p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-snug">{t.task_name}</p>
                            <span className={`chip ${PRIORITY[t.task_priority]}`}>
                              {t.task_priority}
                            </span>
                          </div>
                          {t.task_description && (
                            <p className="mt-1 line-clamp-2 text-sm text-haze">
                              {t.task_description}
                            </p>
                          )}
                          {t.task_progress > 0 && (
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fill/10">
                              <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{ width: `${t.task_progress}%` }}
                              />
                            </div>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {(t.assignees || []).slice(0, 4).map((a) => (
                                <Avatar
                                  key={a.user_id}
                                  name={a.user_name}
                                  src={a.user_avatar_url}
                                  size={24}
                                  className="ring-2 ring-surface rounded-full"
                                />
                              ))}
                            </div>
                            {t.task_deadline && (
                              <span className="text-xs text-haze">
                                {new Date(t.task_deadline).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                      {colTasks.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-fill/15 py-6 text-center text-xs text-haze">
                          Nothing here
                        </div>
                      )}
                    </div>
                  </div>
                );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {showSidePanel && (
          <div className="hidden min-h-0 min-w-0 flex-col border-l border-fill/10 bg-surface lg:flex">
            <ChatPanel
              chatId={project.project_chat_id}
              title={`${project.project_name} · Chat`}
              subtitle={`${members.length} members`}
            />
          </div>
        )}
      </div>

      {/* Mobile / tablet: chat as a full-screen drawer */}
      {project.is_member && project.project_chat_id && (
        <ChatDrawer
          open={chatDrawerOpen && !isDesktop}
          onClose={() => setChatDrawerOpen(false)}
          chatId={project.project_chat_id}
          title={`${project.project_name} · Chat`}
          subtitle={`${members.length} members`}
        />
      )}

      {settingsOpen && (
        <ProjectSettings
          project={project}
          onClose={() => setSettingsOpen(false)}
          onChanged={load}
          onDeleted={() => navigate(`/clusters/${project.cluster_id}`)}
        />
      )}

      {requestsOpen && (
        <RequestsModal
          project={project}
          onClose={() => setRequestsOpen(false)}
          onChanged={load}
        />
      )}

      {creating && (
        <TaskModal
          members={members}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            loadTasks();
          }}
          projectId={projectId}
        />
      )}
      {editing && (
        <TaskModal
          task={editing}
          members={members}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadTasks();
          }}
          onMove={moveTask}
          projectId={projectId}
        />
      )}
    </div>
  );
}

function TaskModal({ task, members, onClose, onSaved, projectId }) {
  const editing = !!task;
  const [form, setForm] = useState({
    name: task?.task_name || '',
    description: task?.task_description || '',
    priority: task?.task_priority || 'medium',
    status: task?.task_status || 'todo',
    progress: task?.task_progress || 0,
    deadline: task?.task_deadline ? task.task_deadline.slice(0, 10) : '',
    assigneeIds: (task?.assignees || []).map((a) => a.user_id),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleAssignee = (id) =>
    set('assigneeIds', form.assigneeIds.includes(id)
      ? form.assigneeIds.filter((x) => x !== id)
      : [...form.assigneeIds, id]);

  const save = async () => {
    if (!form.name.trim()) return setError('Task name is required');
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await taskApi.update(task.task_id, {
          taskName: form.name.trim(),
          taskDescription: form.description,
          priority: form.priority,
          status: form.status,
          progress: Number(form.progress),
          deadline: form.deadline || null,
        });
        // reconcile assignees
        const current = new Set((task.assignees || []).map((a) => a.user_id));
        const next = new Set(form.assigneeIds);
        await Promise.all([
          ...[...next].filter((id) => !current.has(id)).map((id) => taskApi.assign(task.task_id, id)),
          ...[...current].filter((id) => !next.has(id)).map((id) => taskApi.unassign(task.task_id, id)),
        ]);
      } else {
        await taskApi.create({
          projectId,
          taskName: form.name.trim(),
          taskDescription: form.description,
          priority: form.priority,
          status: form.status,
          progress: Number(form.progress),
          deadline: form.deadline || null,
          assigneeIds: form.assigneeIds,
        });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await taskApi.remove(task.task_id);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'Edit task' : 'New task'}
      footer={
        <>
          {editing && (
            <button className="btn-ghost mr-auto text-[#ff375f]" onClick={remove} disabled={busy}>
              Delete
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? <Spinner size={16} /> : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <input
          autoFocus
          className="field"
          placeholder="Task name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <textarea
          className="field resize-none"
          rows={2}
          placeholder="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-haze">
            Priority
            <select
              className="field mt-1"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="text-xs font-medium text-haze">
            Status
            <select
              className="field mt-1"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="text-xs font-medium text-haze">
            Deadline
            <input
              type="date"
              className="field mt-1"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />
          </label>
          <label className="text-xs font-medium text-haze">
            Progress · {form.progress}%
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              className="mt-3 w-full accent-accent"
              value={form.progress}
              onChange={(e) => set('progress', e.target.value)}
            />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-haze">Assignees</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = form.assigneeIds.includes(m.user_id);
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => toggleAssignee(m.user_id)}
                  className={`flex items-center gap-2 rounded-full border px-2 py-1 text-sm transition-all ${
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-fill/15 text-ink/70 hover:bg-fill/5'
                  }`}
                >
                  <Avatar name={m.user_name} src={m.user_avatar_url} size={20} />
                  {m.user_name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-[#ff375f]">{error}</p>}
      </div>
    </Modal>
  );
}
