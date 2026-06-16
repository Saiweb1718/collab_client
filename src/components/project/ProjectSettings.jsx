import { useEffect, useState } from 'react';
import { projectApi, clusterApi } from '../../api/index.js';
import Avatar from '../ui/Avatar.jsx';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';

export default function ProjectSettings({ project, onClose, onChanged, onDeleted }) {
  const [tab, setTab] = useState('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: project.project_name,
    description: project.project_description || '',
    visibility: project.project_visibility,
    taskVisibility: project.project_task_visibility,
  });

  const [members, setMembers] = useState([]);
  const [clusterMembers, setClusterMembers] = useState([]);
  const [confirmName, setConfirmName] = useState('');

  const reload = async () => {
    const [m, cm] = await Promise.all([
      projectApi.members(project.project_id),
      clusterApi.members(project.cluster_id),
    ]);
    setMembers(m.data || []);
    setClusterMembers(cm.data || []);
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDetails = async () => {
    setBusy(true);
    setError('');
    try {
      await projectApi.update(project.project_id, {
        name: form.name,
        description: form.description,
        visibility: form.visibility,
        taskVisibility: form.taskVisibility,
      });
      await onChanged?.();
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const addMember = async (userId) => {
    await projectApi.addMember(project.project_id, userId);
    await reload();
    onChanged?.();
  };
  const removeMember = async (userId) => {
    await projectApi.removeMember(project.project_id, userId);
    await reload();
    onChanged?.();
  };
  const setRole = async (userId, role) => {
    await projectApi.setMemberRole(project.project_id, userId, role);
    await reload();
  };

  const del = async () => {
    setBusy(true);
    setError('');
    try {
      await projectApi.remove(project.project_id, confirmName);
      onDeleted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const memberIds = new Set(members.map((m) => m.user_id));
  const addable = clusterMembers.filter((c) => !memberIds.has(c.user_id));

  const TabBtn = ({ id, label, badge }) => (
    <button
      onClick={() => setTab(id)}
      className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition ${
        tab === id ? 'bg-accent text-white' : 'text-ink/70 hover:bg-fill/5'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="ml-1.5 rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold text-white">{badge}</span>
      )}
    </button>
  );

  return (
    <Modal open onClose={onClose} title="Project settings">
      <div className="mb-4 flex flex-wrap gap-1.5">
        <TabBtn id="details" label="Details" />
        <TabBtn id="visibility" label="Visibility" />
        <TabBtn id="members" label="Members" />
        <TabBtn id="danger" label="Danger" />
      </div>

      {tab === 'details' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-haze">Name</label>
            <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-haze">Description</label>
            <textarea
              className="field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={saveDetails} disabled={busy}>
              {busy ? <Spinner size={16} /> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'visibility' && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Who can see this project?</p>
            {[
              ['members', 'Members only', 'Only people added to the project can open it.'],
              ['company', 'Everyone in the workspace', 'Anyone in the company can find & request to join.'],
            ].map(([val, label, desc]) => (
              <label key={val} className="mb-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-fill/10 p-3 hover:bg-fill/5">
                <input
                  type="radio"
                  name="vis"
                  className="mt-1 accent-accent"
                  checked={form.visibility === val}
                  onChange={() => setForm({ ...form, visibility: val })}
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-haze">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Task visibility for members</p>
            {[
              ['all', 'All tasks', 'Every member sees all tasks in the project.'],
              ['assignee_only', 'Only their own', 'Members see only tasks assigned to them; managers see all.'],
            ].map(([val, label, desc]) => (
              <label key={val} className="mb-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-fill/10 p-3 hover:bg-fill/5">
                <input
                  type="radio"
                  name="tvis"
                  className="mt-1 accent-accent"
                  checked={form.taskVisibility === val}
                  onChange={() => setForm({ ...form, taskVisibility: val })}
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-haze">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={saveDetails} disabled={busy}>
              {busy ? <Spinner size={16} /> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Members ({members.length})</p>
            <div className="space-y-1">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-fill/5">
                  <Avatar name={m.user_name} src={m.user_avatar_url} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm">{m.user_name}</span>
                  <select
                    value={m.role}
                    onChange={(e) => setRole(m.user_id, e.target.value)}
                    className="rounded-lg border border-fill/10 bg-surface px-2 py-1 text-xs"
                  >
                    <option value="member">Member</option>
                    <option value="lead">Lead</option>
                  </select>
                  <button onClick={() => removeMember(m.user_id)} className="text-haze hover:text-[#ff3b30]" title="Remove">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Add from workspace</p>
            {addable.length === 0 ? (
              <p className="text-xs text-haze">Everyone is already a member.</p>
            ) : (
              <div className="space-y-1">
                {addable.map((c) => (
                  <div key={c.user_id} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-fill/5">
                    <Avatar name={c.user_name} src={c.user_avatar_url} size={32} />
                    <span className="min-w-0 flex-1 truncate text-sm">{c.user_name}</span>
                    <button className="btn-secondary !py-1 text-xs" onClick={() => addMember(c.user_id)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'danger' && (
        <div className="space-y-3">
          <p className="text-sm text-haze">
            This permanently deletes the project, its tasks, and chat. Type{' '}
            <span className="font-semibold text-ink">{project.project_name}</span> to confirm.
          </p>
          <input
            className="field"
            placeholder={project.project_name}
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
          <button
            className="btn-danger w-full"
            disabled={busy || confirmName !== project.project_name}
            onClick={del}
          >
            {busy ? <Spinner size={16} /> : 'Delete this project'}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[#ff375f]">{error}</p>}
    </Modal>
  );
}
