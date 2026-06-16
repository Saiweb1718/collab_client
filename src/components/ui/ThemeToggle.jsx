import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../xcontext/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`grid h-9 w-9 place-items-center rounded-full text-ink/70 transition hover:bg-fill/10 ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
