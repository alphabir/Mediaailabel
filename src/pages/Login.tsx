import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Cpu, Database, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { db, isSupabaseConfigured } from '../lib/supabaseClient';

interface LoginProps {
  setCurrentPage: (page: string) => void;
  setUserLoggedIn: (b: boolean) => void;
}

export default function Login({ setCurrentPage, setUserLoggedIn }: LoginProps) {
  const [email, setEmail] = useState('developer@mediaforge.io');
  const [password, setPassword] = useState('password123'); // Preset for instant local testing
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Checking for hash redirect or hash actions
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetFinished, setResetFinished] = useState(false);

  useEffect(() => {
    // Detect if this is a password reset callback
    if (window.location.hash.includes('update-password') || window.location.href.includes('type=recovery')) {
      setIsResettingPassword(true);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { user, error } = await db.signIn(email, password);
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setUserLoggedIn(true);
      setCurrentPage('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected login authentication error occurred.');
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { user, error } = await db.signInWithGoogle();
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      setUserLoggedIn(true);
      setCurrentPage('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Auth flow error.');
      setLoading(false);
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passphrases do not match. Please verify your entries.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Passphrase must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await db.updatePassword(newPassword);
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      setResetFinished(true);
      setLoading(false);
      setTimeout(() => {
        setIsResettingPassword(false);
        setResetFinished(false);
        setNewPassword('');
        setConfirmNewPassword('');
        // Clean URL hashes
        if (history.pushState) {
          history.pushState("", document.title, window.location.pathname + window.location.search);
        } else {
          window.location.hash = "";
        }
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update passphrase.');
      setLoading(false);
    }
  };

  return (
    <div id="login-view" className="bg-slate-950 min-h-screen py-20 flex flex-col justify-center relative font-mono">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[30%] w-[450px] h-[450px] rounded-full bg-purple-900/10 blur-[130px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/50 border border-purple-950/40 rounded-xl p-8 shadow-2xl backdrop-blur">
          
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/15">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-4">
              {isResettingPassword ? 'Configure New Password' : 'Log in to developer console'}
            </h2>
            <p className="text-xs text-slate-400">
              {isResettingPassword ? 'Session Auth recovery protocol active' : 'Authorize MediaForge core API session'}
            </p>
          </div>

          {isResettingPassword ? (
            /* PASSPHRASE RESET MODE */
            resetFinished ? (
              <div className="text-center py-6 space-y-4">
                <div className="h-10 w-10 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-5.5 w-5.5 animate-bounce" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Passphrase Restured</h3>
                <p className="text-[11px] text-slate-300">
                  Your security passphrase has been safely rotated. Redirecting to standard login credentials panel...
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleUpdatePasswordSubmit}>
                <div className="space-y-1.5 font-mono text-xxs">
                  <label className="block text-slate-300 font-bold uppercase">New Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min. 6 alphanumeric"
                      className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xxs">
                  <label className="block text-slate-300 font-bold uppercase">Repeat New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      placeholder="Repeat passphrase"
                      className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-red-400 text-xxs font-mono bg-red-950/20 p-2.5 rounded border border-red-900/30">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-650 py-2.5 text-xs font-bold font-mono uppercase tracking-wide text-white shadow hover:scale-[1.01] transition-all"
                >
                  <span>{loading ? 'Overwriting database...' : 'Confirm Password Update'}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsResettingPassword(false)}
                  className="w-full py-2 border border-purple-950/20 text-[10px] text-slate-450 uppercase rounded-lg hover:text-white"
                >
                  Cancel Recovery
                </button>
              </form>
            )
          ) : (
            /* STANDARD LOGIN MODE */
            <>
              <form className="space-y-5" onSubmit={handleAuthSubmit}>
                <div className="space-y-1.5 font-mono text-xxs">
                  <label className="block text-slate-300 font-bold uppercase">API Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-600 font-mono"
                      placeholder="developer@mediaforge.io"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xxs">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-bold uppercase">Pass Phrase</label>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('forgot-password')}
                      className="text-purple-400 hover:text-purple-305 hover:underline"
                    >
                      Recover?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-600 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-red-400 text-xxs font-mono bg-red-950/20 p-2.5 rounded border border-red-900/30">
                    {errorMessage}
                  </p>
                )}

                <button
                  id="login-btn-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 py-2.5 text-xs font-bold font-mono uppercase tracking-wide text-white shadow hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  <span>{loading ? 'Initializing Session context...' : 'Authorize API session'}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              {/* Third party gateway mockup */}
              <div className="mt-6 border-t border-purple-950/20 pt-6">
                <button
                  id="login-btn-google"
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
                  id="login-toggle-signup"
                  onClick={() => setCurrentPage('signup')}
                  className="text-slate-400 hover:text-purple-300 transition font-mono text-xxs block mx-auto underline"
                >
                  New Developer? Create Sandbox account
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
