import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AtSign, CheckSquare, UserPlus, Check, X, Plus, MessageSquare } from 'lucide-react';
import { notificationApi } from '../../api/index.js';
import { getSocket } from '../../lib/socket.js';
import { relativeTime } from '../../lib/format.js';

const ICON = {
  mention: AtSign,
  assignment: CheckSquare,
  join_request: UserPlus,
  join_approved: Check,
  join_rejected: X,
  project_invite: Plus,
  message: MessageSquare,
};

// Where a notification should take you when clicked.
const targetFor = (n) => {
  if (n.notification_entity_type === 'project') return `/projects/${n.notification_entity_id}`;
  if (n.notification_entity_type === 'chat' || n.notification_type === 'mention')
    return n.notification_entity_id ? `/messages?chat=${n.notification_entity_id}` : '/messages';
  if (n.notification_type === 'assignment')
    return n.notification_entity_id ? `/tasks?task=${n.notification_entity_id}` : '/tasks';
  return null;
};

const PANEL_W = 320;

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const [list, count] = await Promise.all([
        notificationApi.list({ limit: 20 }),
        notificationApi.unreadCount(),
      ]);
      setItems(list.data || []);
      setUnread(count.data?.count || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refresh();
    const s = getSocket();
    const onNew = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 20));
      setUnread((u) => u + 1);
    };
    s.on('notification:new', onNew);
    return () => s.off('notification:new', onNew);
  }, []);

  // Anchor the fixed panel to the button, clamped inside the viewport so it's
  // never clipped (the bell lives in the left sidebar).
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - PANEL_W - 8);
    setCoords({ top: r.bottom + 8, left });
  };
  useLayoutEffect(() => {
    if (open) place();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open]);

  // close on outside click (button or panel are safe)
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const markAll = async () => {
    await notificationApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, notification_is_read: true })));
    setUnread(0);
  };

  const onItem = async (n) => {
    if (!n.notification_is_read) {
      notificationApi.markRead(n.notification_id).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) =>
        prev.map((x) => (x.notification_id === n.notification_id ? { ...x, notification_is_read: true } : x))
      );
    }
    const to = targetFor(n);
    setOpen(false);
    if (to) navigate(to);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink/70 transition hover:bg-fill/10"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: PANEL_W, zIndex: 70 }}
          className="animate-pop-in overflow-hidden rounded-3xl border border-fill/10 bg-surface/95 shadow-lift backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-fill/10 px-4 py-3">
            <span className="font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-haze">You're all caught up</p>
            ) : (
              items.map((n) => {
                const I = ICON[n.notification_type];
                return (
                  <button
                    key={n.notification_id}
                    onClick={() => onItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-fill/5 ${
                      n.notification_is_read ? '' : 'bg-accent/5'
                    }`}
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fill/10 text-ink/70">
                      {I ? <I size={14} /> : <span>•</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{n.notification_message}</span>
                      <span className="text-xs text-haze">{relativeTime(n.notification_created_at)}</span>
                    </span>
                    {!n.notification_is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
