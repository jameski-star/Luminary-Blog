import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { api, isApiMode } from '../services/api';
import { getStoredUsers, saveUsers, setCurrentUser } from '../store/appStore';
import { User, Save, CheckCircle, Shield, Crown, Camera } from 'lucide-react';
import { useConfirm } from '../components/Modal';

export default function ProfilePage() {
  const { user, setUser, setCurrentPage } = useApp();
  const { confirm, ConfirmDialog } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center pt-16">
        <button onClick={() => setCurrentPage('login')} className="bg-primary text-canvas font-semibold px-6 py-3 rounded-xl">Sign In</button>
      </div>
    );
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let avatarUrl = avatarPreview;

    if (avatarFile && isApiMode()) {
      const reader = new FileReader();
      avatarUrl = await new Promise<string>(resolve => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(avatarFile);
      });
    }

    try {
      if (isApiMode()) {
        const res = await api.auth.updateProfile({
          name: name.trim() || user.name,
          bio: bio.trim(),
          avatar: avatarUrl !== user.avatar ? avatarUrl : undefined,
        });
        setUser(res.user);
      } else {
        const updated = {
          ...user,
          name: name.trim() || user.name,
          bio: bio.trim(),
          avatar: avatarFile ? avatarUrl : avatarPreview || user.avatar,
        };
        const users = getStoredUsers();
        saveUsers(users.map(u => u.id === user.id ? updated : u));
        setCurrentUser(updated);
        setUser(updated);
      }
      setAvatarFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pt-20">
      <SEO title={user.name} description="Your profile settings." noindex />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-primary mb-8 flex items-center gap-3">
          <User size={24} className="text-secondary" />
          Your Profile
        </h1>

        <div className="rounded-3xl border border-border bg-surface p-8">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-bold text-canvas overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={18} className="text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-primary">{user.name}</h2>
                {user.role === 'admin' && (
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
                )}
              </div>
              <p className="text-secondary text-sm">{user.email}</p>
              <p className="text-xs text-secondary mt-1">
                Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell readers about yourself…"
                className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none placeholder-secondary/50"
              />
            </div>

            <div className="bg-canvas rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Account Info</p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-secondary">Email</p>
                  <p className="text-primary mt-0.5 font-mono">{user.email}</p>
                </div>
                <div>
                  <p className="text-secondary">Role</p>
                  <p className="text-primary mt-0.5 font-mono capitalize">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Admin Recovery */}
            {user.role !== 'admin' && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-start gap-2.5 text-amber-400 text-xs">
                  <Crown size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Need Admin Access?</p>
                    <p>If you lost your admin account, go to the Admin Panel (requires existing admin) to promote this account, or check your database directly.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                saved
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : saving
                  ? 'bg-primary/50 text-canvas cursor-not-allowed'
                  : 'bg-primary text-canvas hover:bg-white'
              }`}
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-canvas border-t-transparent rounded-full animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle size={16} />Saved!</>
              ) : (
                <><Save size={16} />Save Changes</>
              )}
            </button>
          </div>
        </div>
        <ConfirmDialog />
      </div>
    </div>
  );
}
