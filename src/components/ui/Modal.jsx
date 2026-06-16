import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Portal to body so a backdrop-filter ancestor (e.g. the sidebar) can't trap
  // this fixed overlay inside its stacking/containing context.
  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md animate-pop-in rounded-3xl bg-surface/95 p-6 shadow-lift backdrop-blur-xl border border-fill/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink">{title}</h2>}
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
