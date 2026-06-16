import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../xcontext/AuthContext.jsx';
import AuthShell from './AuthLayout.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start collaborating in minutes.">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="animate-slide-up rounded-2xl bg-[#ff375f]/10 px-4 py-3 text-sm text-[#ff375f]">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
          <input required className="field" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <input type="email" required className="field" value={form.email} onChange={set('email')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Confirm</label>
            <input
              type="password"
              required
              className="field"
              value={form.confirm}
              onChange={set('confirm')}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner size={18} /> : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-haze">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
