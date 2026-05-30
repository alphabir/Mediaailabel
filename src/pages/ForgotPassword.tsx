import React, { useState } from 'react';
import { Mail, ArrowRight, Cpu, Database, CheckCircle, ShieldAlert } from 'lucide-react';
import { db, isSupabaseConfigured } from '../lib/supabaseClient';

interface ForgotPasswordProps {
  setCurrentPage: (page: string) => void;
}

export default function ForgotPassword({ setCurrentPage }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const { success, error } = await db.resetPassword(email.trim());
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      setSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing secure password recovery.');
      setLoading(false);
    }
  };

  return (
    <div id="forgot-password-view" className="bg-slate-950 min-h-screen py-20 flex flex-col justify-center relative">
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
              Recover API Passphrase
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Retrieve your sandbox auth keys or master login
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5 py-4">
              <div className="h-12 w-12 bg-purple-500/15 border border-purple-500/40 text-purple-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Reset Link Transmitted</h3>
                <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                  We have dispatched a magic recovery link to <span className="text-purple-300 font-bold underline">{email}</span>. Please click the link to configure your profile's new passphrase.
                </p>
                { !isSupabaseConfigured && (
                  <p className="text-[9px] text-amber-400 font-mono bg-amber-950/20 p-2 border border-amber-900/30 rounded mt-2">
                    Note: Sandbox LocalStorage simulation automatically resolves this request immediately. Typically you can now change password inside the settings.
                  </p>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage('login')}
                className="w-full py-2.5 bg-slate-950 border border-purple-950/40 text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider rounded-lg hover:text-white hover:bg-slate-900 transition"
              >
                Go back to Sign In
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5 font-mono text-xxs">
                <label className="block text-slate-300 font-bold uppercase">Account Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-950/40 text-xs rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                    placeholder="E.g. alexander@mediaforge.io"
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
                id="forgotpass-btn-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 py-2.5 text-xs font-bold font-mono uppercase tracking-wide text-white shadow hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Transmitting code...' : 'Transmit Recovery Code'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="mt-4 flex items-center justify-center space-x-2 rounded-lg bg-slate-950/60 p-2.5 border border-purple-950/25">
                <Database className="h-3.5 w-3.5 text-emerald-450 animate-pulse" />
                <span className="text-xxs font-mono text-slate-400">
                  Environment: <span className="text-emerald-400 font-bold">Connected to Supabase</span>
                </span>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="text-slate-400 hover:text-purple-300 transition font-mono text-xxs"
                >
                  Return to account login page
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
