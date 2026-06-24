import { useState } from 'react';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { signUp, signIn } from '../store/appStore';
import { api, isApiMode, setApiToken } from '../services/api';
import { Eye, EyeOff, AlertCircle, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { friendlyError } from '../utils/errors';

// ──────────────────────────────────────────────
// LOGIN PAGE
// ──────────────────────────────────────────────
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
    await new Promise(r => setTimeout(r, 400));

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
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 pt-16">
      <SEO title="Sign In" description="Sign in to your Luminary account." noindex />
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <span className="text-canvas font-bold text-xl">L</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-2">Welcome back</h1>
            <p className="text-secondary">Sign in to continue writing.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface mb-6 text-sm">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-secondary">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <FormField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-primary text-sm outline-none focus:border-primary/60 transition-colors pr-12 placeholder-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-white disabled:opacity-60 text-canvas font-semibold py-3 rounded-xl transition-all duration-200 text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-6">
            Don't have an account?{' '}
            <button onClick={() => setCurrentPage('signup')} className="text-secondary hover:text-primary font-medium transition-colors">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// SIGNUP PAGE
// ──────────────────────────────────────────────
export function SignupPage() {
  const { setUser, setCurrentPage } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email || !password || !confirm) {
      setError('Please fill in all fields.'); return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.'); return;
    }
    if (strength.score < 2) {
      setError('Password is too weak. Use at least 8 characters with letters and numbers.'); return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

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
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="rounded-3xl border border-border bg-surface p-8">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <span className="text-canvas font-bold text-xl">L</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-2">Create your account</h1>
            <p className="text-secondary">Start publishing content that ranks.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface mb-6 text-sm">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-secondary">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <FormField label="Full name" type="text" value={name} onChange={setName} placeholder="Your Name" />
            <FormField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-primary text-sm outline-none focus:border-primary/60 transition-colors pr-12 placeholder-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
                            : strength.score <= 3 ? 'bg-primary'
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

            {/* Terms */}
            <div className="text-xs text-secondary bg-canvas rounded-xl p-4 border border-border">
              <p className="font-medium text-primary mb-2 flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-400" />
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
              className="w-full bg-primary hover:bg-white disabled:opacity-60 text-canvas font-semibold py-3 rounded-xl transition-all duration-200 text-sm"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-secondary mt-6">
            Already have an account?{' '}
            <button onClick={() => setCurrentPage('login')} className="text-secondary hover:text-primary font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function FormField({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-primary text-sm outline-none focus:border-primary/60 transition-colors placeholder-secondary/50"
      />
    </div>
  );
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
