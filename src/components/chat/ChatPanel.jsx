import { useEffect, useRef, useState, useCallback } from 'react';
import { Smile, Paperclip, Send, Check, X, ChevronLeft } from 'lucide-react';
import { getSocket } from '../../lib/socket.js';
import { chatApi, uploadApi } from '../../api/index.js';
import { useAuth } from '../../xcontext/AuthContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import Avatar from '../ui/Avatar.jsx';
import Spinner from '../ui/Spinner.jsx';
import { dayLabel } from '../../lib/format.js';

let tempCounter = 0;
const EMOJIS = ['😀','😂','😍','😎','🥳','😅','😭','🤔','👍','👎','🙏','👏','🔥','🎉','❤️','💯','✅','🚀','👀','🙌','😴','🤝','💪','☕'];

export default function ChatPanel({ chatId, title, subtitle, headerRight, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [members, setMembers] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mention, setMention] = useState(null); // { query, items }
  const [attachment, setAttachment] = useState(null); // { url, type, name, uploading, progress }
  const [editing, setEditing] = useState(null); // message being edited

  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimeout = useRef(null);
  const sentTyping = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  // members for @mention autocomplete
  useEffect(() => {
    if (!chatId) return;
    chatApi.members(chatId).then((r) => setMembers(r.data || [])).catch(() => setMembers([]));
  }, [chatId]);

  // Load history + join the socket room whenever the chat changes.
  useEffect(() => {
    if (!chatId) return;
    let active = true;
    const socket = getSocket();
    setLoading(true);
    setMessages([]);
    setEditing(null);
    setAttachment(null);

    (async () => {
      try {
        const res = await chatApi.messages(chatId);
        if (!active) return;
        setMessages(res.data || []);
        scrollToBottom(false);
      } catch {
        /* surfaced as empty state */
      } finally {
        if (active) setLoading(false);
      }
    })();

    socket.emit('chat:join', { chatId });
    socket.emit('message:read', { chatId });
    chatApi.markRead(chatId).catch(() => {});

    const onNew = (msg) => {
      if (msg.message_chat_id !== chatId) return;
      setMessages((prev) => {
        if (msg.tempId) {
          const idx = prev.findIndex((m) => m._tempId === msg.tempId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = msg;
            return copy;
          }
        }
        if (prev.some((m) => m.message_id === msg.message_id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
      if (msg.sender_id !== user.user_id) socket.emit('message:read', { chatId });
    };

    const onUpdated = (msg) => {
      if (msg.message_chat_id !== chatId) return;
      setMessages((prev) => prev.map((m) => (m.message_id === msg.message_id ? msg : m)));
    };
    const onDeleted = ({ message_id, message_chat_id }) => {
      if (message_chat_id !== chatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === message_id
            ? { ...m, message_is_deleted: true, message_text: null, message_file_url: null }
            : m
        )
      );
    };
    const onRead = ({ chatId: cid, userId }) => {
      if (cid !== chatId || userId === user.user_id) return;
      // mark my messages as seen
      setMessages((prev) => prev.map((m) => (m.sender_id === user.user_id ? { ...m, seen: true } : m)));
    };

    const onTyping = ({ chatId: cid, userId, userName, isTyping }) => {
      if (cid !== chatId || userId === user.user_id) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = userName;
        else delete next[userId];
        return next;
      });
    };

    socket.on('message:new', onNew);
    socket.on('message:updated', onUpdated);
    socket.on('message:deleted', onDeleted);
    socket.on('message:read', onRead);
    socket.on('typing', onTyping);

    return () => {
      active = false;
      socket.emit('chat:leave', { chatId });
      socket.off('message:new', onNew);
      socket.off('message:updated', onUpdated);
      socket.off('message:deleted', onDeleted);
      socket.off('message:read', onRead);
      socket.off('typing', onTyping);
      setTypingUsers({});
    };
  }, [chatId, user.user_id, scrollToBottom]);

  const emitTyping = () => {
    const socket = getSocket();
    if (!sentTyping.current) {
      socket.emit('typing:start', { chatId });
      sentTyping.current = true;
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { chatId });
      sentTyping.current = false;
    }, 1500);
  };

  // ---- mention detection on input ----
  const onChangeText = (e) => {
    const val = e.target.value;
    setText(val);
    emitTyping();
    const caret = e.target.selectionStart ?? val.length;
    const upto = val.slice(0, caret);
    const m = upto.match(/@([\w]*)$/);
    if (m && members.length) {
      const q = m[1].toLowerCase();
      const items = members
        .filter((u) => u.user_id !== user.user_id && u.user_name.toLowerCase().includes(q))
        .slice(0, 6);
      setMention(items.length ? { query: m[1], items } : null);
    } else {
      setMention(null);
    }
  };

  const pickMention = (u) => {
    setText((prev) => prev.replace(/@([\w]*)$/, `@${u.user_name.replace(/\s+/g, '')} `));
    setMention(null);
    taRef.current?.focus();
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment({ name: file.name, uploading: true, progress: 0 });
    try {
      const { data } = await uploadApi.file(file, 'chat', (p) =>
        setAttachment((a) => (a ? { ...a, progress: p } : a))
      );
      setAttachment({ url: data.url, type: data.type, name: data.name, uploading: false });
    } catch (err) {
      setAttachment(null);
      alert(err.message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const computeMentionIds = (body) =>
    members
      .filter((u) => body.includes(`@${u.user_name.replace(/\s+/g, '')}`))
      .map((u) => u.user_id);

  const send = (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (editing) return saveEdit();
    if (!body && !attachment?.url) return;
    if (attachment?.uploading) return;

    const socket = getSocket();
    const tempId = `t${++tempCounter}`;
    const mentionIds = computeMentionIds(body);
    const optimistic = {
      _tempId: tempId,
      message_id: tempId,
      message_chat_id: chatId,
      message_text: body || null,
      message_file_url: attachment?.url || null,
      message_type: attachment?.type || 'text',
      message_time: new Date().toISOString(),
      sender_id: user.user_id,
      sender_name: user.user_name,
      sender_avatar: user.user_avatar_url,
      mentions: mentionIds,
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setAttachment(null);
    setMention(null);
    scrollToBottom();

    clearTimeout(typingTimeout.current);
    socket.emit('typing:stop', { chatId });
    sentTyping.current = false;

    socket.emit(
      'message:send',
      {
        chatId,
        text: body,
        fileUrl: optimistic.message_file_url,
        type: optimistic.message_type,
        mentionIds,
        tempId,
      },
      (resp) => {
        if (!resp?.ok) {
          setMessages((prev) =>
            prev.map((m) => (m._tempId === tempId ? { ...m, _pending: false, _failed: true } : m))
          );
        }
      }
    );
  };

  const startEdit = (m) => {
    setEditing(m);
    setText(m.message_text || '');
    setAttachment(null);
    setTimeout(() => taRef.current?.focus(), 30);
  };
  const cancelEdit = () => {
    setEditing(null);
    setText('');
  };
  const saveEdit = () => {
    const body = text.trim();
    if (!body) return;
    getSocket().emit('message:edit', { messageId: editing.message_id, text: body });
    setEditing(null);
    setText('');
  };
  const deleteMsg = (m) => {
    if (!confirm('Delete this message?')) return;
    getSocket().emit('message:delete', { messageId: m.message_id });
  };

  const onKeyDown = (e) => {
    if (mention && (e.key === 'Enter' || e.key === 'Tab') && mention.items[0]) {
      e.preventDefault();
      pickMention(mention.items[0]);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) send(e);
    if (e.key === 'Escape' && editing) cancelEdit();
  };

  const typingNames = Object.values(typingUsers);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-fill/10 px-3 py-3 sm:px-5">
        {onBack && (
          <button
            onClick={onBack}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/70 hover:bg-fill/10 lg:hidden"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="truncate text-xs text-haze">{subtitle}</p>}
        </div>
        {headerRight}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-haze"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-haze">
            <div className="mb-2 text-4xl">💬</div>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const mine = m.sender_id === user.user_id;
            const newDay = !prev || dayLabel(prev.message_time) !== dayLabel(m.message_time);
            const firstOfGroup = !prev || prev.sender_id !== m.sender_id || newDay;
            return (
              <div key={m.message_id}>
                {newDay && (
                  <div className="my-3 flex justify-center">
                    <span className="chip bg-fill/5 text-haze">{dayLabel(m.message_time)}</span>
                  </div>
                )}
                <MessageBubble
                  message={m}
                  mine={mine}
                  showAvatar={firstOfGroup}
                  showName={firstOfGroup && !mine}
                  onEdit={startEdit}
                  onDelete={deleteMsg}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Typing indicator */}
      <div className="h-5 px-6 text-xs text-haze">
        {typingNames.length > 0 &&
          `${typingNames.join(', ')} ${typingNames.length === 1 ? 'is' : 'are'} typing…`}
      </div>

      {/* Attachment preview / edit banner */}
      {editing && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-2xl bg-fill/5 px-3 py-2 text-sm">
          <span className="text-haze">Editing message…</span>
          <button onClick={cancelEdit} className="text-accent hover:underline">Cancel</button>
        </div>
      )}
      {attachment && (
        <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-fill/5 px-3 py-2 text-sm">
          {attachment.type === 'image' && attachment.url ? (
            <img src={attachment.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="text-lg">📎</span>
          )}
          <span className="flex-1 truncate">{attachment.name}</span>
          {attachment.uploading ? (
            <span className="text-haze">{attachment.progress}%</span>
          ) : (
            <button onClick={() => setAttachment(null)} className="text-haze hover:text-[#ff3b30]">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={send} className="relative flex items-end gap-2 px-4 pb-4">
        {/* mention dropdown */}
        {mention && (
          <div className="absolute bottom-[72px] left-4 z-20 w-60 overflow-hidden rounded-2xl border border-fill/10 bg-surface/95 shadow-lift backdrop-blur-xl">
            {mention.items.map((u) => (
              <button
                type="button"
                key={u.user_id}
                onClick={() => pickMention(u)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-fill/5"
              >
                <Avatar name={u.user_name} src={u.user_avatar_url} size={26} />
                <span className="truncate">{u.user_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* emoji popover */}
        {emojiOpen && (
          <div className="absolute bottom-[72px] left-4 z-20 grid w-64 grid-cols-8 gap-1 rounded-2xl border border-fill/10 bg-surface/95 p-2 shadow-lift backdrop-blur-xl">
            {EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => { setText((t) => t + em); setEmojiOpen(false); taRef.current?.focus(); }}
                className="rounded-lg p-1 text-xl hover:bg-fill/10"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => { setEmojiOpen((o) => !o); setMention(null); }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink/70 transition hover:bg-fill/10"
          title="Emoji"
        >
          <Smile size={20} />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink/70 transition hover:bg-fill/10"
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input ref={fileRef} type="file" hidden onChange={onPickFile} />

        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={onChangeText}
          onKeyDown={onKeyDown}
          placeholder={editing ? 'Edit message…' : 'Message'}
          className="field max-h-32 flex-1 resize-none rounded-3xl"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !attachment?.url) || attachment?.uploading}
          className="btn-primary aspect-square !px-0 !w-11 !h-11"
          aria-label="Send"
        >
          {editing ? <Check size={20} /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
