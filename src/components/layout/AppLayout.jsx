import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Hexagon } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import NotificationsBell from '../ui/NotificationsBell.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { PresenceProvider } from '../../xcontext/PresenceContext.jsx';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <PresenceProvider>
      <div className="flex h-[100dvh] w-screen overflow-hidden bg-canvas">
        {/* backdrop behind the mobile drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* mobile top bar */}
          <header className="flex items-center gap-2 border-b border-fill/10 bg-surface/70 px-3 py-2 backdrop-blur-xl lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink/80 transition hover:bg-fill/10"
              title="Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-accent text-white">
                <Hexagon size={14} fill="currentColor" />
              </div>
              <span className="font-semibold tracking-tight">Collab</span>
            </div>
            <div className="ml-auto flex items-center">
              <NotificationsBell />
              <ThemeToggle />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </PresenceProvider>
  );
}
