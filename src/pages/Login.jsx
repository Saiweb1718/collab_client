import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../xcontext/AuthContext.jsx';
import AuthShell from './AuthLayout.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your workspaces.">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="animate-slide-up rounded-2xl bg-[#ff375f]/10 px-4 py-3 text-sm text-[#ff375f]">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <input type="email" required className="field" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            required
            className="field"
            value={form.password}
            onChange={set('password')}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-haze">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
