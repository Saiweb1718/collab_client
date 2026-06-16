import { initials, gradientFor } from '../../lib/format.js';

export default function Avatar({ name = '', src, size = 40, online, className = '' }) {
  const dim = { width: size, height: size, fontSize: size * 0.4 };
  return (
    <div className={`relative shrink-0 ${className}`} style={dim}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover shadow-soft"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white shadow-soft"
          style={{ background: gradientFor(name), ...dim }}
        >
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full border-2 border-white transition-colors ${
            online ? 'bg-[#34c759]' : 'bg-haze/50'
          }`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
