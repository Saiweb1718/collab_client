import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { projectApi } from '../../api/index.js';
import Avatar from '../ui/Avatar.jsx';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';

export default function RequestsModal({ project, onClose, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const reload = async () => {
    try {
      const r = await projectApi.listRequests(project.project_id);
      setRequests(r.data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (requestId, decision) => {
    setBusyId(requestId);
    try {
      await projectApi.decideRequest(project.project_id, requestId, decision);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      await onChanged?.();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Join requests · ${project.project_name}`}>
      {loading ? (
        <div className="flex justify-center py-8 text-haze">
          <Spinner />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center text-haze">
          <UserPlus size={36} strokeWidth={1.5} className="mb-3" />
          <p className="text-sm">No pending requests right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.request_id} className="flex items-center gap-3 rounded-2xl border border-fill/10 p-3">
              <Avatar name={r.user_name} src={r.user_avatar_url} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.user_name}</p>
                {r.request_message ? (
                  <p className="truncate text-xs text-haze">{r.request_message}</p>
                ) : (
                  <p className="truncate text-xs text-haze">{r.user_email}</p>
                )}
              </div>
              <button
                className="btn-secondary !py-1.5 text-xs"
                disabled={busyId === r.request_id}
                onClick={() => decide(r.request_id, 'reject')}
              >
                Decline
              </button>
              <button
                className="btn-primary !py-1.5 text-xs"
                disabled={busyId === r.request_id}
                onClick={() => decide(r.request_id, 'approve')}
              >
                {busyId === r.request_id ? <Spinner size={14} /> : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
