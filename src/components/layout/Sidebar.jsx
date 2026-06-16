import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  ListChecks,
  Search,
  Plus,
  LogOut,
  Hexagon,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { clusterApi, chatApi } from '../../api/index.js';
import { useAuth } from '../../xcontext/AuthContext.jsx';
import { getSocket } from '../../lib/socket.js';
import { useIsDesktop } from '../../lib/useMediaQuery.js';
import Avatar from '../ui/Avatar.jsx';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import NotificationsBell from '../ui/NotificationsBell.jsx';
import CommandPalette from '../ui/CommandPalette.jsx';
import { gradientFor } from '../../lib/format.js';

const NavItem = ({ to, icon: Icon, label, rail, badge }) => (
  <NavLink
    to={to}
    end
    title={rail ? label : undefined}
    className={({ isActive }) =>
      `relative flex items-center rounded-2xl text-sm font-medium transition-all duration-200 ${
        rail ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
      } ${isActive ? 'bg-accent text-white shadow-soft' : 'text-ink/80 hover:bg-fill/5'}`
    }
  >
    <span className="relative">
      <Icon size={19} />
      {badge > 0 && rail && (
        <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-[#ff3b30] ring-2 ring-surface" />
      )}
    </span>
    {!rail && <span className="flex-1">{label}</span>}
    {!rail && badge > 0 && (
      <span className="grid min-w-[18px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

const ROLE_DOT = { owner: 'bg-[#af52de]', admin: 'bg-accent' };

function ClusterGroup({ label, items, rail }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      {!rail && (
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-haze">
          {label} <span className="text-haze/70">{items.length}</span>
        </p>
      )}
      {items.map((c) => (
        <NavLink
          key={c.cluster_id}
          to={`/clusters/${c.cluster_id}`}
          title={rail ? `${c.cluster_name} · ${c.userRole}` : undefined}
          className={({ isActive }) =>
            `flex items-center rounded-2xl transition-all duration-200 ${
              rail ? 'justify-center px-0 py-1.5' : 'gap-3 px-3 py-2'
            } ${isActive ? 'bg-fill/10' : 'hover:bg-fill/5'}`
          }
        >
          <div className="relative">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold text-white shadow-soft"
              style={{ background: gradientFor(c.cluster_name) }}
            >
              {c.cluster_name[0]?.toUpperCase()}
            </div>
            {ROLE_DOT[c.userRole] && (
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${ROLE_DOT[c.userRole]}`} />
            )}
          </div>
          {!rail && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{c.cluster_name}</p>
              <p className="truncate text-xs text-haze">{c.memberCount} members</p>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'join'
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('collab-sidebar') === '1');

  // The icon-rail only applies on desktop; the mobile drawer is always full width.
  const rail = collapsed && isDesktop;

  useEffect(() => {
    localStorage.setItem('collab-sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  const load = async () => {
    try {
      const res = await clusterApi.list();
      setClusters(res.data || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  // live unread-message count for the Messages nav badge (lightweight COUNT)
  const refreshUnread = () => chatApi.unreadCount().then((r) => setUnreadMsgs(r.data?.count || 0)).catch(() => {});
  useEffect(() => {
    refreshUnread();
    const s = getSocket();
    const onChange = () => refreshUnread();
    s.on('chat:updated', onChange);
    s.on('message:new', onChange);
    return () => {
      s.off('chat:updated', onChange);
      s.off('message:new', onChange);
    };
  }, []);
  useEffect(() => {
    refreshUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ⌘K / Ctrl+K opens the command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = async () => {
    if (!value.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res =
        modal === 'create' ? await clusterApi.create(value.trim()) : await clusterApi.join(value.trim());
      await load();
      navigate(`/clusters/${res.data.cluster_id}`);
      setModal(null);
      setValue('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-72 flex-col border-r border-fill/10 bg-surface/95 backdrop-blur-xl transition-transform duration-300
                  lg:static lg:z-auto lg:h-full lg:bg-surface/60 lg:transition-[width]
                  ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                  ${rail ? 'lg:w-[76px]' : 'lg:w-72'}`}
    >
      {/* Brand + collapse/close */}
      <div className={`flex items-center pt-5 pb-3 ${rail ? 'flex-col gap-2 px-2' : 'justify-between px-5'}`}>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-accent text-white shadow-soft">
            <Hexagon size={18} fill="currentColor" />
          </div>
          {!rail && <span className="text-[17px] font-semibold tracking-tight">Collab</span>}
        </div>
        {/* desktop collapse */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-fill/10 lg:grid"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {/* mobile close */}
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-fill/10 lg:hidden"
          title="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {!rail && (
        <div className="flex items-center justify-end gap-1 px-4 pb-1">
          <NotificationsBell />
          <ThemeToggle />
        </div>
      )}

      {/* Search */}
      <div className="px-3 pb-1">
        {rail ? (
          <button
            onClick={() => setPaletteOpen(true)}
            title="Search (⌘K)"
            className="mx-auto grid h-10 w-10 place-items-center rounded-2xl border border-fill/10 bg-fill/5 text-haze transition hover:bg-fill/10"
          >
            <Search size={18} />
          </button>
        ) : (
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-2xl border border-fill/10 bg-fill/5 px-3 py-2 text-sm text-haze transition hover:bg-fill/10"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden rounded-md border border-fill/10 px-1.5 py-0.5 text-[10px] font-medium sm:inline">⌘K</kbd>
          </button>
        )}
      </div>

      <nav className="mt-2 space-y-1 px-3">
        <NavItem to="/" icon={Home} label="Home" rail={rail} />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" rail={rail} badge={unreadMsgs} />
        <NavItem to="/tasks" icon={ListChecks} label="My Tasks" rail={rail} />
      </nav>

      <div className={`mt-4 flex-1 space-y-1 overflow-y-auto ${rail ? 'px-2' : 'px-3'}`}>
        {loading ? (
          <div className="flex justify-center py-6 text-haze">
            <Spinner />
          </div>
        ) : clusters.length === 0 ? (
          !rail && <p className="px-3 py-4 text-xs text-haze">No workspaces yet.</p>
        ) : (
          <>
            <ClusterGroup label="Owned & admin" items={clusters.filter((c) => ['owner', 'admin'].includes(c.userRole))} rail={rail} />
            <ClusterGroup label="Member of" items={clusters.filter((c) => !['owner', 'admin'].includes(c.userRole))} rail={rail} />
          </>
        )}
      </div>

      <div className={`space-y-2 py-3 ${rail ? 'px-2' : 'px-3'}`}>
        {rail ? (
          <>
            <button
              className="mx-auto grid h-10 w-10 place-items-center rounded-2xl text-ink/70 transition hover:bg-fill/10"
              onClick={() => setModal('create')}
              title="Create workspace"
            >
              <Plus size={20} />
            </button>
            <div className="flex justify-center gap-1">
              <NotificationsBell />
              <ThemeToggle />
            </div>
            <button onClick={() => navigate('/profile')} className="mx-auto block" title={user.user_name}>
              <Avatar name={user.user_name} src={user.user_avatar_url} size={36} />
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 !py-2 text-xs" onClick={() => setModal('create')}>
                <Plus size={14} /> Create
              </button>
              <button className="btn-secondary flex-1 !py-2 text-xs" onClick={() => setModal('join')}>
                Join
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-fill/5 px-3 py-2">
              <button
                onClick={() => navigate('/profile')}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                title="View profile"
              >
                <Avatar name={user.user_name} src={user.user_avatar_url} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.user_name}</p>
                  <p className="truncate text-xs text-haze">{user.user_email}</p>
                </div>
              </button>
              <button onClick={logout} title="Sign out" className="grid h-8 w-8 place-items-center rounded-full text-haze hover:bg-fill/10">
                <LogOut size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => {
          setModal(null);
          setError('');
          setValue('');
        }}
        title={modal === 'create' ? 'Create a workspace' : 'Join a workspace'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy ? <Spinner size={16} /> : modal === 'create' ? 'Create' : 'Join'}
            </button>
          </>
        }
      >
        <input
          autoFocus
          className="field"
          placeholder={modal === 'create' ? 'Workspace name' : 'Invite code (e.g. A1B2C3D4)'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {error && <p className="mt-2 text-sm text-[#ff375f]">{error}</p>}
      </Modal>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </aside>
  );
}
