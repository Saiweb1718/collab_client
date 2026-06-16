import { useEffect, useState } from 'react';
import { clusterApi } from '../../api/index.js';
import { useAuth } from '../../xcontext/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', member: 'Member' };

export default function ClusterSettings({ cluster, onClose, onChanged, onDeleted }) {
  const { user } = useAuth();
  const isOwner = cluster.userRole === 'owner';
  const [tab, setTab] = useState('details');
  const [name, setName] = useState(cluster.cluster_name);
  const [members, setMembers] = useState([]);
  const [confirmName, setConfirmName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    const m = await clusterApi.members(cluster.cluster_id);
    setMembers(m.data || []);
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveName = async () => {
    setBusy(true);
    setError('');
    try {
      await clusterApi.update(cluster.cluster_id, { name });
      await onChanged?.();
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn) => {
    setError('');
    try {
      await fn();
      await reload();
      onChanged?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const del = async () => {
    setBusy(true);
    setError('');
    try {
      await clusterApi.remove(cluster.cluster_id, confirmName);
      onDeleted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        tab === id ? 'bg-accent text-white' : 'text-ink/70 hover:bg-fill/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal open onClose={onClose} title="Workspace settings">
      <div className="mb-4 flex flex-wrap gap-1.5">
        <TabBtn id="details" label="Details" />
        <TabBtn id="members" label="Members" />
        {isOwner && <TabBtn id="danger" label="Danger" />}
      </div>

      {tab === 'details' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-haze">Workspace name</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm text-haze">
            Invite code: <span className="chip bg-fill/10 font-mono">{cluster.cluster_code}</span>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={saveName} disabled={busy}>
              {busy ? <Spinner size={16} /> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-1">
          {members.map((m) => {
            const isSelf = m.user_id === user.user_id;
            const canManage = !isSelf && m.role !== 'owner';
            return (
              <div key={m.user_id} className="flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-fill/5">
                <Avatar name={m.user_name} src={m.user_avatar_url} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.user_name}</p>
                  <p className="truncate text-xs text-haze">{ROLE_LABEL[m.role]}</p>
                </div>
                {canManage && (
                  <>
                    {m.role === 'member' ? (
                      <button className="btn-secondary !py-1 text-xs" onClick={() => act(() => clusterApi.setRole(cluster.cluster_id, m.user_id, 'admin'))}>
                        Make admin
                      </button>
                    ) : (
                      <button className="btn-secondary !py-1 text-xs" onClick={() => act(() => clusterApi.setRole(cluster.cluster_id, m.user_id, 'member'))}>
                        Remove admin
                      </button>
                    )}
                    {isOwner && (
                      <button
                        className="btn-secondary !py-1 text-xs"
                        title="Transfer ownership"
                        onClick={() => confirm(`Make ${m.user_name} the new owner? You'll become an admin.`) && act(() => clusterApi.transferOwnership(cluster.cluster_id, m.user_id))}
                      >
                        👑
                      </button>
                    )}
                    <button className="text-haze hover:text-[#ff3b30]" title="Remove" onClick={() => confirm(`Remove ${m.user_name}?`) && act(() => clusterApi.removeMember(cluster.cluster_id, m.user_id))}>
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'danger' && isOwner && (
        <div className="space-y-3">
          <p className="text-sm text-haze">
            Deleting the workspace removes all its projects, tasks, and chats for everyone. Type{' '}
            <span className="font-semibold text-ink">{cluster.cluster_name}</span> to confirm.
          </p>
          <input
            className="field"
            placeholder={cluster.cluster_name}
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
          <button className="btn-danger w-full" disabled={busy || confirmName !== cluster.cluster_name} onClick={del}>
            {busy ? <Spinner size={16} /> : 'Delete this workspace'}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[#ff375f]">{error}</p>}
    </Modal>
  );
}
