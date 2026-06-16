import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi, userApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePresence } from '../context/PresenceContext.jsx';
import { getSocket } from '../lib/socket.js';
import { useIsDesktop } from '../lib/useMediaQuery.js';
import Avatar from '../components/ui/Avatar.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import { FolderKanban, Building2, Plus, MessageSquare } from 'lucide-react';
import { relativeTime, gradientFor } from '../lib/format.js';

const TYPE_ICON = { project: FolderKanban, company: Building2 };

export default function MessagesPage() {
  const { user } = useAuth();
  const { online } = usePresence();
  const isDesktop = useIsDesktop();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const deepChat = searchParams.get('chat');

  const load = useCallback(
    async (preferId) => {
      const res = await chatApi.list();
      setChats(res.data || []);
      setLoading(false);
      // On desktop, auto-open the first chat. On mobile, keep the list visible
      // until the user taps a conversation.
      setActiveId((cur) => preferId || cur || (isDesktop ? res.data?.[0]?.chat_id : null) || null);
    },
    [isDesktop]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Deep link: /messages?chat=<id>
  useEffect(() => {
    if (deepChat) {
      setActiveId(deepChat);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepChat]);

  // Live-refresh the list as messages arrive anywhere.
  useEffect(() => {
    const socket = getSocket();
    const onUpdate = () => load();
    socket.on('chat:updated', onUpdate);
    return () => socket.off('chat:updated', onUpdate);
  }, [load]);

  const active = chats.find((c) => c.chat_id === activeId);

  const openChat = (id) => {
    setActiveId(id);
    setChats((prev) => prev.map((c) => (c.chat_id === id ? { ...c, unread_count: 0 } : c)));
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Chat list — full width on mobile; hidden once a chat is open */}
      <div
        className={`w-full shrink-0 flex-col border-r border-fill/10 bg-surface/40 backdrop-blur-xl lg:flex lg:w-80 ${
          activeId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
          <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => setNewOpen(true)}>
            <Plus size={15} /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loading ? (
            <div className="flex justify-center py-8 text-haze">
              <Spinner />
            </div>
          ) : chats.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-haze">
              No conversations yet. Start a new message.
            </p>
          ) : (
            chats.map((c) => {
              const isDirect = c.chat_type === 'direct';
              const activeRow = c.chat_id === activeId;
              return (
                <button
                  key={c.chat_id}
                  onClick={() => openChat(c.chat_id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                    activeRow ? 'bg-accent/10' : 'hover:bg-fill/5'
                  }`}
                >
                  {isDirect ? (
                    <Avatar
                      name={c.title}
                      src={c.direct_avatar_url}
                      size={42}
                      online={online.has(c.direct_user_id)}
                    />
                  ) : (
                    <div
                      className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full text-white shadow-soft"
                      style={{ background: gradientFor(c.title || 'chat') }}
                    >
                      {(() => {
                        const I = TYPE_ICON[c.chat_type];
                        return I ? <I size={20} /> : null;
                      })()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.title || 'Conversation'}</p>
                      <span className="shrink-0 text-[11px] text-haze">
                        {relativeTime(c.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-haze">
                        {c.last_message_text || 'No messages yet'}
                      </p>
                      {c.unread_count > 0 && !activeRow && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active conversation — full screen on mobile, with a back button */}
      <div className={`min-w-0 flex-1 bg-surface/30 backdrop-blur-xl ${activeId ? '' : 'hidden lg:block'}`}>
        {active ? (
          <ChatPanel
            key={active.chat_id}
            chatId={active.chat_id}
            onBack={() => setActiveId(null)}
            title={active.title || 'Conversation'}
            subtitle={
              active.chat_type === 'direct'
                ? online.has(active.direct_user_id)
                  ? 'Active now'
                  : 'Offline'
                : active.chat_type === 'company'
                  ? 'Company chat'
                  : 'Project chat'
            }
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-haze">
            <MessageSquare size={48} strokeWidth={1.5} className="mb-3" />
            <p>Select a conversation</p>
          </div>
        )}
      </div>

      {newOpen && (
        <NewMessageModal
          onClose={() => setNewOpen(false)}
          onPicked={async (u) => {
            const res = await chatApi.openDirect(u.user_id);
            setNewOpen(false);
            await load();
            openChat(res.data.chat_id);
          }}
        />
      )}
    </div>
  );
}

function NewMessageModal({ onClose, onPicked }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await userApi.search(q.trim());
        setResults(res.data || []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <Modal open onClose={onClose} title="New message">
      <input
        autoFocus
        className="field"
        placeholder="Search people by name or email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-4 text-haze">
            <Spinner size={18} />
          </div>
        )}
        {!loading &&
          results.map((u) => (
            <button
              key={u.user_id}
              onClick={() => onPicked(u)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-fill/5"
            >
              <Avatar name={u.user_name} src={u.user_avatar_url} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.user_name}</p>
                <p className="truncate text-xs text-haze">{u.user_email}</p>
              </div>
            </button>
          ))}
        {!loading && q.trim().length >= 2 && results.length === 0 && (
          <p className="py-4 text-center text-sm text-haze">No people found</p>
        )}
      </div>
    </Modal>
  );
}
