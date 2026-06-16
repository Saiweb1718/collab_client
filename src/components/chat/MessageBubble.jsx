import { useState } from 'react';
import { MoreHorizontal, Check, CheckCheck, Paperclip } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { timeShort } from '../../lib/format.js';

// Highlight @mentions (a leading @ followed by a non-space run).
function renderText(text, mine) {
  if (!text) return null;
  const parts = text.split(/(@[^\s@]+)/g);
  return parts.map((p, i) =>
    p.startsWith('@') ? (
      <span key={i} className={`font-semibold ${mine ? 'text-white' : 'text-accent'}`}>
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function Attachment({ url, type, mine }) {
  if (!url) return null;
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img src={url} alt="attachment" className="mb-1 max-h-64 w-auto rounded-2xl object-cover" loading="lazy" />
      </a>
    );
  }
  const fileName = decodeURIComponent(url.split('/').pop() || 'file').replace(/^[0-9a-f-]+-/, '');
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mb-1 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-white/20' : 'bg-fill/5'}`}
    >
      <Paperclip size={16} className="shrink-0" />
      <span className="truncate">{fileName}</span>
    </a>
  );
}

export default function MessageBubble({ message, mine, showAvatar, showName, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false);
  const pending = message._pending;
  const failed = message._failed;
  const deleted = message.message_is_deleted;

  return (
    <div className={`group flex w-full gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 shrink-0">
        {!mine && showAvatar && <Avatar name={message.sender_name} src={message.sender_avatar} size={32} />}
      </div>

      <div className={`relative flex max-w-[72%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
        {!mine && showName && (
          <span className="mb-0.5 px-1 text-xs font-medium text-haze">{message.sender_name}</span>
        )}

        <div className={`flex items-center gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
          {mine && !deleted && !pending && (onEdit || onDelete) && (
            <div className="relative opacity-0 transition group-hover:opacity-100">
              <button
                onClick={() => setMenu((m) => !m)}
                className="grid h-6 w-6 place-items-center rounded-full text-haze hover:bg-fill/10"
              >
                <MoreHorizontal size={16} />
              </button>
              {menu && (
                <div className="absolute right-0 top-7 z-10 w-28 overflow-hidden rounded-xl border border-fill/10 bg-surface/95 shadow-lift backdrop-blur-xl">
                  {message.message_type === 'text' && onEdit && (
                    <button
                      onClick={() => { setMenu(false); onEdit(message); }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-fill/5"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => { setMenu(false); onDelete?.(message); }}
                    className="block w-full px-3 py-2 text-left text-sm text-[#ff3b30] hover:bg-fill/5"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className={`animate-bubble-in rounded-3xl px-4 py-2 text-[15px] leading-relaxed shadow-soft ${
              mine ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md bg-surface text-ink border border-fill/10'
            } ${pending ? 'opacity-60' : ''} ${failed ? '!bg-[#ff375f] text-white' : ''}`}
          >
            {deleted ? (
              <span className="italic opacity-70">🚫 This message was deleted</span>
            ) : (
              <>
                <Attachment url={message.message_file_url} type={message.message_type} mine={mine} />
                {message.message_text && (
                  <span className="whitespace-pre-wrap break-words">{renderText(message.message_text, mine)}</span>
                )}
              </>
            )}
          </div>
        </div>

        <span className={`mt-0.5 flex items-center gap-1 px-1 text-[11px] text-haze ${mine ? 'flex-row-reverse' : ''}`}>
          {failed ? 'Failed to send' : pending ? 'Sending…' : (
            <>
              {timeShort(message.message_time)}
              {message.message_is_edited && !deleted && <span className="opacity-70">· edited</span>}
              {mine && !deleted && (
                <span className={message.seen ? 'text-accent' : 'text-haze'}>
                  {message.seen ? <CheckCheck size={14} /> : <Check size={14} />}
                </span>
              )}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
