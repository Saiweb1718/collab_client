import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Settings, MessageSquare, Plus, Lock, Globe, Copy, Check } from 'lucide-react';
import { clusterApi, projectApi } from '../api/index.js';
import { usePresence } from '../xcontext/PresenceContext.jsx';
import { getSocket } from '../lib/socket.js';
import Avatar from '../components/ui/Avatar.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ChatDrawer from '../components/chat/ChatDrawer.jsx';
import ClusterSettings from '../components/cluster/ClusterSettings.jsx';
import { gradientFor } from '../lib/format.js';

const ROLE_BADGE = {
  owner: 'bg-[#af52de]/15 text-[#af52de]',
  admin: 'bg-accent/10 text-accent',
};

export default function ClusterPage() {
  const { clusterId } = useParams();
  const navigate = useNavigate();
  const { online } = usePresence();
  const [cluster, setCluster] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', visibility: 'members', taskVisibility: 'all' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, p, m] = await Promise.all([
        clusterApi.get(clusterId),
        projectApi.byCluster(clusterId),
        clusterApi.members(clusterId),
      ]);
      setCluster(c.data);
      setProjects(p.data);
      setMembers(m.data);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterId]);

  // Refresh the project list when my membership changes in this workspace
  // (e.g. a join request was approved → a project flips from "pending" to open).
  useEffect(() => {
    const s = getSocket();
    const onMembership = (p) => {
      if (p?.clusterId === clusterId) load();
    };
    s.on('membership:changed', onMembership);
    return () => s.off('membership:changed', onMembership);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterId]);

  const copyCode = () => {
    navigator.clipboard?.writeText(cluster.cluster_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const createProject = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await projectApi.create({
        clusterId,
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
        taskVisibility: form.taskVisibility,
      });
      setCreating(false);
      setForm({ name: '', description: '', visibility: 'members', taskVisibility: 'all' });
      navigate(`/projects/${res.data.project_id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !cluster)
    return (
      <div className="flex h-full items-center justify-center text-haze">
        <Spinner size={28} />
      </div>
    );

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-3xl text-xl font-bold text-white shadow-soft sm:h-14 sm:w-14 sm:text-2xl"
            style={{ background: gradientFor(cluster.cluster_name) }}
          >
            {cluster.cluster_name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{cluster.cluster_name}</h1>
            <button
              onClick={copyCode}
              className="mt-1 inline-flex items-center gap-2 text-sm text-haze hover:text-ink"
              title="Copy invite code"
            >
              <span className="chip bg-fill/10 font-mono">{cluster.cluster_code}</span>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy invite code'}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {['owner', 'admin'].includes(cluster.userRole) && (
            <button className="btn-secondary" onClick={() => setSettingsOpen(true)}>
              <Settings size={15} /> Settings
            </button>
          )}
          <button className="btn-secondary" onClick={() => setChatOpen(true)}>
            <MessageSquare size={15} /> Company chat
          </button>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> New project
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        {/* Projects */}
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Projects</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={p.project_id}
                to={`/projects/${p.project_id}`}
                className="card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <h3 className="font-semibold tracking-tight">{p.project_name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-haze">
                  {p.project_description || 'No description'}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-haze">
                  <span>👥 {p.member_count}</span>
                  <span>✓ {p.task_count} tasks</span>
                  <span title={p.project_visibility === 'company' ? 'Visible to workspace' : 'Members only'}>
                    {p.project_visibility === 'company' ? <Globe size={13} /> : <Lock size={13} />}
                  </span>
                  {!p.is_member &&
                    (p.pending_request ? (
                      <span className="chip ml-auto bg-[#ff9500]/10 text-[#ff9500]">Pending</span>
                    ) : (
                      <span className="chip ml-auto bg-accent/10 text-accent">Request to join</span>
                    ))}
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-fill/15 p-8 text-center text-sm text-haze">
                No projects yet. Create the first one.
              </div>
            )}
          </div>
        </section>

        {/* Members */}
        <aside>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Members <span className="text-sm font-normal text-haze">{members.length}</span>
          </h2>
          <div className="card divide-y divide-fill/10">
            {members.map((m) => (
              <Link
                to={`/profile/${m.user_id}`}
                key={m.user_id}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-fill/5"
              >
                <Avatar
                  name={m.user_name}
                  src={m.user_avatar_url}
                  size={36}
                  online={online.has(m.user_id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.user_name}</p>
                  <p className="truncate text-xs text-haze">{m.user_title || m.user_email}</p>
                </div>
                {ROLE_BADGE[m.role] && (
                  <span className={`chip ${ROLE_BADGE[m.role]} capitalize`}>{m.role}</span>
                )}
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        chatId={cluster.cluster_company_chat_id}
        title={`${cluster.cluster_name} · Company chat`}
        subtitle={`${members.length} members`}
      />

      {settingsOpen && (
        <ClusterSettings
          cluster={cluster}
          onClose={() => setSettingsOpen(false)}
          onChanged={load}
          onDeleted={() => navigate('/')}
        />
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New project"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={createProject} disabled={busy}>
              {busy ? <Spinner size={16} /> : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            autoFocus
            className="field"
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className="field resize-none"
            rows={3}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-haze">
              Visibility
              <select
                className="field mt-1"
                value={form.visibility}
                onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
              >
                <option value="members">Members only</option>
                <option value="company">Whole workspace</option>
              </select>
            </label>
            <label className="text-xs font-medium text-haze">
              Task visibility
              <select
                className="field mt-1"
                value={form.taskVisibility}
                onChange={(e) => setForm((f) => ({ ...f, taskVisibility: e.target.value }))}
              >
                <option value="all">All tasks</option>
                <option value="assignee_only">Only own tasks</option>
              </select>
            </label>
          </div>
          {error && <p className="text-sm text-[#ff375f]">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
