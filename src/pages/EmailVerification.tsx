import React, { useState } from 'react';
import { Mail, CheckCircle2, Cpu, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface EmailVerificationProps {
  setCurrentPage: (page: string) => void;
}

export default function EmailVerification({ setCurrentPage }: EmailVerificationProps) {
  const [resending, setResending] = useState(false);
  const [sentMsg, setSentMsg] = useState(false);

  const handleResend = () => {
    setResending(true);
    setSentMsg(false);
    setTimeout(() => {
      setResending(false);
      setSentMsg(true);
    }, 1200);
  };

  return (
    <div id="email-verification-view" className="bg-slate-950 min-h-screen py-20 flex flex-col justify-center relative font-mono">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[30%] w-[450px] h-[450px] rounded-full bg-purple-900/10 blur-[130px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/50 border border-purple-950/40 rounded-xl p-8 shadow-2xl backdrop-blur space-y-6">
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/15">
              <Mail className="h-6 w-6 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-4 uppercase">
              Verify Your Email
            </h2>
            <p className="text-xs text-slate-400">
              Complete your deployment security protocol
            </p>
          </div>

          <div className="bg-slate-950/70 border border-purple-950/30 rounded-xl p-5 space-y-4">
            <div className="flex space-x-3 items-start">
              <CheckCircle2 className="h-4.5 w-4.5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verification dispatched</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  We have successfully generated and sent a custom verification email containing a security login token.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 items-start">
              <HelpCircle className="h-4.5 w-4.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Next deployment steps</h4>
                <p className="text-[10px] text-slate-405 leading-relaxed">
                  Please click the link inside your client's inbox to verify your identity. Once confirmed, return to this tab to access the core console modules.
                </p>
              </div>
            </div>
          </div>

          {sentMsg && (
            <p className="text-[10px] text-center text-emerald-400 bg-emerald-950/10 p-2.5 rounded border border-emerald-900/20">
              A fresh security verification token has been routed to your email inbox!
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCurrentPage('login')}
              className="flex-1 flex items-center justify-center space-x-1.5 border border-purple-950/40 hover:bg-slate-900 bg-slate-950/40 text-slate-300 hover:text-white px-3 py-2.5 rounded-lg text-xxs font-bold uppercase transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sign In page</span>
            </button>

            <button
              onClick={handleResend}
              disabled={resending}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-tr from-purple-800 to-indigo-805 text-white hover:from-purple-700 hover:to-indigo-700 px-3 py-2.5 rounded-lg text-xxs font-bold uppercase transition disabled:opacity-50"
            >
              {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span>Resend Email</span>
            </button>
          </div>

          <p className="text-[9px] text-zinc-500 text-center leading-relaxed font-mono pt-2">
            Having trouble? Verify your spam mailbox or request developer technical support at connectapp464@gmail.com.
          </p>

        </div>
      </div>
    </div>
  );
}
