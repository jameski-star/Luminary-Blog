import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { getStoredUsers, saveUsers, setCurrentUser } from '../store/appStore';
import { User, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser, setCurrentPage } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <button onClick={() => setCurrentPage('login')} className="bg-[#FAFAFA] text-black font-semibold px-6 py-3 rounded-xl">Sign In</button>
      </div>
    );
  }

  const handleSave = () => {
    const updated = { ...user, name: name.trim() || user.name, bio: bio.trim() };
    const users = getStoredUsers();
    const newUsers = users.map(u => u.id === user.id ? updated : u);
    saveUsers(newUsers);
    setCurrentUser(updated);
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black pt-20">
      <SEO title={user.name} description="Your profile settings." noindex />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-[#FAFAFA] mb-8 flex items-center gap-3">
          <User size={24} className="text-[#A1A1AA]" />
          Your Profile
        </h1>

        <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-8">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-[#27272A]">
            <div className="w-20 h-20 rounded-2xl bg-[#FAFAFA] flex items-center justify-center text-3xl font-bold text-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FAFAFA]">{user.name}</h2>
              <p className="text-[#A1A1AA] text-sm">{user.email}</p>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black border border-[#27272A] rounded-xl px-4 py-3 text-[#FAFAFA] text-sm outline-none focus:border-[#FAFAFA]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell readers about yourself…"
                className="w-full bg-black border border-[#27272A] rounded-xl px-4 py-3 text-[#FAFAFA] text-sm outline-none focus:border-[#FAFAFA]/60 transition-colors resize-none placeholder-[#A1A1AA]/50"
              />
            </div>

            <div className="bg-black rounded-xl p-4 border border-[#27272A]">
              <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">Account Info</p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[#A1A1AA]">Email</p>
                  <p className="text-[#FAFAFA] mt-0.5 font-mono">{user.email}</p>
                </div>
                <div>
                  <p className="text-[#A1A1AA]">User ID</p>
                  <p className="text-[#FAFAFA] mt-0.5 font-mono truncate">{user.id}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                saved
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-[#FAFAFA] hover:bg-white text-black'
              }`}
            >
              {saved ? <><CheckCircle size={16} />Saved!</> : <><Save size={16} />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
