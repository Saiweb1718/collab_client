import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi, uploadApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Spinner from '../components/ui/Spinner.jsx';

function Toast({ msg, tone = 'ok' }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-lift ${
        tone === 'ok' ? 'bg-[#34c759]' : 'bg-[#ff3b30]'
      }`}
    >
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user, updateUser } = useAuth();
  const isSelf = !userId || userId === user.user_id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const flash = (msg, tone = 'ok') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  };

  // editable fields
  const [form, setForm] = useState({ name: '', title: '', bio: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // password
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = isSelf ? { data: user } : await userApi.get(userId);
        const p = isSelf ? { ...user, ...res.data } : res.data;
        setProfile(p);
        setForm({
          name: p.user_name || '',
          title: p.user_title || '',
          bio: p.user_bio || '',
          avatarUrl: p.user_avatar_url || '',
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.file(file, 'avatars');
      setForm((f) => ({ ...f, avatarUrl: data.url }));
      flash('Photo uploaded — remember to Save');
    } catch (err) {
      flash(err.message, 'err');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile({
        name: form.name,
        title: form.title,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
      });
      updateUser({
        user_name: data.user_name,
        user_title: data.user_title,
        user_bio: data.user_bio,
        user_avatar_url: data.user_avatar_url,
      });
      setProfile((p) => ({ ...p, ...data }));
      flash('Profile saved');
    } catch (err) {
      flash(err.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword) return flash('Fill both password fields', 'err');
    setPwBusy(true);
    try {
      await userApi.changePassword(pw);
      setPw({ currentPassword: '', newPassword: '' });
      flash('Password changed');
    } catch (err) {
      flash(err.message, 'err');
    } finally {
      setPwBusy(false);
    }
  };

  if (loading)
    return (
      <div className="grid h-full place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          {isSelf ? 'Your profile' : profile.user_name}
        </h1>

        {/* Identity card */}
        <div className="card mb-6 p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar name={form.name || profile.user_name} src={form.avatarUrl} size={88} />
              {isSelf && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-accent text-white shadow-soft transition hover:bg-accentDark"
                  title="Change photo"
                >
                  {uploading ? <Spinner size={14} /> : '✎'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold">{profile.user_name}</p>
              {profile.user_title && <p className="text-haze">{profile.user_title}</p>}
              <p className="text-sm text-haze">{profile.user_email}</p>
            </div>
          </div>
          {!isSelf && profile.user_bio && (
            <p className="mt-4 whitespace-pre-wrap text-[15px] text-ink/80">{profile.user_bio}</p>
          )}
        </div>

        {isSelf && (
          <>
            {/* Edit details */}
            <div className="card mb-6 p-6">
              <h2 className="mb-4 text-lg font-semibold">Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-haze">Full name</label>
                  <input
                    className="field"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-haze">Title / role</label>
                  <input
                    className="field"
                    placeholder="e.g. Product Manager"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-haze">About</label>
                  <textarea
                    className="field min-h-[90px] resize-y"
                    placeholder="A short bio…"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn-primary" onClick={save} disabled={saving}>
                  {saving ? <Spinner size={16} /> : 'Save changes'}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Password</h2>
              <div className="space-y-3">
                <input
                  type="password"
                  className="field"
                  placeholder="Current password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                />
                <input
                  type="password"
                  className="field"
                  placeholder="New password (min 6 chars)"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn-secondary" onClick={changePassword} disabled={pwBusy}>
                  {pwBusy ? <Spinner size={16} /> : 'Change password'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Toast msg={toast?.msg} tone={toast?.tone} />
    </div>
  );
}
