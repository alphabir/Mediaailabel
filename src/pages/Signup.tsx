import React, { useState } from 'react';
import { Terminal, ArrowRight, Mail, Lock, User, Cpu, Database, Github, ShieldAlert, CheckCircle } from 'lucide-react';
import { db, isSupabaseConfigured } from '../lib/supabaseClient';

interface SignupProps {
  setCurrentPage: (page: string) => void;
  setUserLoggedIn: (b: boolean) => void;
}

export default function Signup({ setCurrentPage, setUserLoggedIn }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passphrases do not match. Please verify your passwords.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Passphrase must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await db.signUp(email, password, name);
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      
      if (isSupabaseConfigured) {
        // Real Supabase requires email verification by default
        setSuccess(true);
        setTimeout(() => {
          setCurrentPage('email-verification');
        }, 1500);
      } else {
        // Sandbox fallback does immediate login
        setUserLoggedIn(true);
        setCurrentPage('dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected registration error occurred.');
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await db.signInWithGoogle();
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      setUserLoggedIn(true);
      setCurrentPage('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div id="signup-view" className="bg-slate-950 min-h-screen py-20 flex flex-col justify-center relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[30%] w-[450px] h-[450px] rounded-full bg-purple-900/10 blur-[130px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/50 border border-purple-950/40 rounded-xl p-8 shadow-2xl backdrop-blur">
          
          {/* Logo element */}
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/15 animate-pulse">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-4">
              Create developer account
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Access AI vision layers & pipeline processing steps
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center py-6">
              <div className="h-12 w-12 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 animate-bounce" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Registered!</h3>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                We have generated your secure environment. Redirecting you to the verification center...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleAuthSubmit}>
              <div className="space-y-1.5 font-mono text-xxs">
                <label className="block text-slate-300 font-bold uppercase">Developer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                    placeholder="E.g. Alexander Forge"
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xxs">
                <label className="block text-slate-300 font-bold uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                    placeholder="dev@mediaforge.io"
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xxs">
                <label className="text-slate-300 font-bold uppercase block">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xxs">
                <label className="text-slate-300 font-bold uppercase block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                    placeholder="Repeat passphrase"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="text-red-400 text-xxs font-mono bg-red-950/20 p-2.5 rounded border border-red-900/30 flex items-start space-x-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                id="signup-btn-submit"
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 py-2.5 text-xs font-bold font-mono uppercase tracking-wide text-white shadow hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Initializing context...' : 'Generate New Sandbox'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {/* Social connection gateway */}
          <div className="mt-6 border-t border-purple-950/20 pt-6 space-y-4">
            <button
              id="signup-btn-google"
              onClick={handleGoogleConnect}
              className="w-full flex items-center justify-center space-x-2 rounded-lg border border-purple-950/30 bg-slate-100/5 text-slate-300 py-2.5 text-xs font-bold font-mono uppercase hover:bg-slate-900 transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.185 15.45 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.56-4.43 10.56-10.74 0-.725-.075-1.275-.165-1.985H12.24z"/>
              </svg>
              <span>Connect with Google</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-2 rounded-lg bg-slate-950/60 p-2.5 border border-purple-950/25">
            <Database className="h-3.5 w-3.5 text-emerald-450 animate-pulse" />
            <span className="text-xxs font-mono text-slate-400">
              Database: <span className="text-emerald-400 font-bold">Connected to Supabase</span>
            </span>
          </div>

          <div className="mt-6 text-center text-xs">
            <button
              id="signup-toggle-login"
              onClick={() => setCurrentPage('login')}
              className="text-slate-400 hover:text-purple-300 transition font-mono text-xxs"
            >
              Already have an API account? Sign In here
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
