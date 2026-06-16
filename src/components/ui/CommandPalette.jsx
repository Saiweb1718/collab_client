import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, MessageSquare } from 'lucide-react';
import { searchApi, chatApi } from '../../api/index.js';
import Avatar from './Avatar.jsx';
import Spinner from './Spinner.jsx';

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState({ projects: [], tasks: [], people: [], messages: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ('');
      setRes({ projects: [], tasks: [], people: [], messages: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setRes({ projects: [], tasks: [], people: [], messages: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchApi.global(q.trim());
        setRes(r.data);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  const go = (to) => {
    onClose();
    navigate(to);
  };
  const openPerson = async (userId) => {
    try {
      const r = await chatApi.openDirect(userId);
      go(`/messages?chat=${r.data.chat_id || r.data}`);
    } catch {
      go(`/profile/${userId}`);
    }
  };

  const Section = ({ title, children, show }) =>
    show ? (
      <div className="py-1">
        <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-haze">{title}</p>
        {children}
      </div>
    ) : null;

  const Row = ({ icon, label, sub, onClick }) => (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-fill/5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-fill/10 text-sm">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink">{label}</span>
        {sub && <span className="block truncate text-xs text-haze">{sub}</span>}
      </span>
    </button>
  );

  const empty =
    !res.projects.length && !res.tasks.length && !res.people.length && !res.messages.length;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-start justify-center p-4 pt-[12vh] animate-fade-in" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl animate-pop-in overflow-hidden rounded-3xl border border-fill/10 bg-surface/95 shadow-lift backdrop-blur-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-fill/10 px-4">
          <Search size={18} className="text-haze" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, tasks, people, messages…"
            className="w-full bg-transparent py-4 text-[15px] text-ink outline-none placeholder:text-haze"
          />
          {loading && <Spinner size={16} />}
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="px-4 py-8 text-center text-sm text-haze">Type at least 2 characters…</p>
          ) : empty && !loading ? (
            <p className="px-4 py-8 text-center text-sm text-haze">No results for “{q}”.</p>
          ) : (
            <>
              <Section title="Projects" show={res.projects.length > 0}>
                {res.projects.map((p) => (
                  <Row key={p.project_id} icon={<FolderKanban size={16} />} label={p.project_name} sub={p.cluster_name} onClick={() => go(`/projects/${p.project_id}`)} />
                ))}
              </Section>
              <Section title="Tasks" show={res.tasks.length > 0}>
                {res.tasks.map((t) => (
                  <Row key={t.task_id} icon={<CheckSquare size={16} />} label={t.task_name} sub={t.project_name} onClick={() => go(`/projects/${t.project_id}`)} />
                ))}
              </Section>
              <Section title="People" show={res.people.length > 0}>
                {res.people.map((u) => (
                  <Row
                    key={u.user_id}
                    icon={<Avatar name={u.user_name} src={u.user_avatar_url} size={28} />}
                    label={u.user_name}
                    sub={u.user_title || u.user_email}
                    onClick={() => openPerson(u.user_id)}
                  />
                ))}
              </Section>
              <Section title="Messages" show={res.messages.length > 0}>
                {res.messages.map((m) => (
                  <Row key={m.message_id} icon={<MessageSquare size={16} />} label={m.message_text} sub={`${m.sender_name}`} onClick={() => go('/messages')} />
                ))}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
