import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { signUp, signIn } from '../store/appStore';
import { api, isApiMode, setApiToken } from '../services/api';
import { Eye, EyeOff, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { friendlyError } from '../utils/errors';

export function LoginPage() {
  const { setUser, setCurrentPage } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }

    setLoading(true);

    try {
      if (isApiMode()) {
        const res = await api.auth.signin({ email, password });
        setApiToken(res.token);
        setUser(res.user);
      } else {
        const result = signIn(email, password);
        if (!result.success || !result.user) {
          throw new Error(result.error || 'Login failed.');
        }
        setUser(result.user);
      }
      setCurrentPage('dashboard');
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 pt-16 pb-8">
      <SEO title="Sign In" description="Sign in to your Luminary account." noindex />
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
          <div className="mb-6 md:mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-accent-glow/20">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-1 tracking-tight">Welcome back</h1>
            <p className="text-sm text-secondary">Sign in to continue writing.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-border bg-surface mb-5 text-sm">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-secondary">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <FormField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-2.5 text-primary text-sm outline-none focus:border-accent/60 transition-colors pr-11 placeholder-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-pink-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-2xl transition-all duration-200 text-sm hover:shadow-lg hover:shadow-accent-glow/30"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-5">
            Don't have an account?{' '}
            <button onClick={() => setCurrentPage('signup')} className="text-accent hover:text-pink-400 font-medium transition-colors">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const { setUser, setCurrentPage } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email || !password || !confirm) {
      setError('Please fill in all fields.'); return;
    }
    if (!isValidEmail(email)) {
      setError('Only @gmail.com, @outlook.com, and @hotmail.com emails are allowed.'); return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.'); return;
    }
    if (strength.score < 2) {
      setError('Password is too weak. Use at least 8 characters with letters and numbers.'); return;
    }

    setLoading(true);

    try {
      if (isApiMode()) {
        const res = await api.auth.signup({ name: name.trim(), email, password });
        setApiToken(res.token);
        setUser(res.user);
      } else {
        const result = signUp(name.trim(), email, password);
        if (!result.success || !result.user) {
          throw new Error(result.error || 'Signup failed.');
        }
        setUser(result.user);
      }
      setCurrentPage('dashboard');
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 pt-16 pb-8">
      <SEO title="Sign Up" description="Create your Luminary account and start publishing." noindex />
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
          <div className="mb-6 md:mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-accent-glow/20">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-1 tracking-tight">Create your account</h1>
            <p className="text-sm text-secondary">Start publishing content that ranks.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-border bg-surface mb-5 text-sm">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-secondary">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <FormField label="Full name" type="text" value={name} onChange={setName} placeholder="Your Name" />
            <FormField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-2.5 text-primary text-sm outline-none focus:border-accent/60 transition-colors pr-11 placeholder-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score
                          ? strength.score <= 1 ? 'bg-red-500'
                            : strength.score <= 2 ? 'bg-secondary'
                            : strength.score <= 3 ? 'bg-accent'
                            : 'bg-emerald-500'
                          : 'bg-raised'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-secondary' : 'text-emerald-400'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <FormField label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" />

            <div className="text-xs text-secondary bg-canvas rounded-2xl p-4 border border-border">
              <p className="font-medium text-primary mb-2 flex items-center gap-1.5">
                <CheckCircle size={12} className="text-accent" />
                Publishing Standards
              </p>
              <ul className="space-y-1 text-secondary">
                <li>• All AI-generated content passes our 4-stage authenticity pipeline</li>
                <li>• Manual posts undergo fact-check validation before publishing</li>
                <li>• Content flagged for misinformation is quarantined, not published</li>
                <li>• Your account may be suspended for posting spam or plagiarized content</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-pink-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-2xl transition-all duration-200 text-sm hover:shadow-lg hover:shadow-accent-glow/30"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-5">
            Already have an account?{' '}
            <button onClick={() => setCurrentPage('login')} className="text-accent hover:text-pink-400 font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-canvas border border-border rounded-xl px-4 py-2.5 text-primary text-sm outline-none focus:border-accent/60 transition-colors placeholder-secondary/50"
      />
    </div>
  );
}

function isValidEmail(email: string): boolean {
  const match = email.toLowerCase().trim().match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return false;
  const allowed = ['gmail.com', 'outlook.com', 'hotmail.com'];
  return allowed.includes(match[1]);
}

function getPasswordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score = Math.min(4, score + 1);

  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score: Math.min(4, score), label: labels[Math.min(4, score)] || 'Weak' };
}
