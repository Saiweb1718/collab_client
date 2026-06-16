import ChatPanel from './ChatPanel.jsx';

// Right-hand slide-over containing a single chat.
export default function ChatDrawer({ open, onClose, chatId, title, subtitle }) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface/95 shadow-lift backdrop-blur-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <button onClick={onClose} className="btn-ghost !px-2 !py-1 text-haze" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1">
          {open && chatId && <ChatPanel chatId={chatId} title={title} subtitle={subtitle} />}
        </div>
      </div>
    </div>
  );
}
