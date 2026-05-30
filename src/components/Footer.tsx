import { Terminal, Shield, FileText, CheckCircle } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  return (
    <footer className="border-t border-purple-950/20 bg-slate-950/60 transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/15">
                <Terminal className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Media<span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">Forge</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              SaaS-ready high-throughput serverless API for enterprise video trimming, transcoding, scene cuts, subtitle rendering, and boundary-box dataset annotations.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/20 w-fit px-2.5 py-1 rounded-full border border-emerald-900/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All systems fully operational</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono">API latency 18ms</span>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8 col-span-2">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-slate-200">Processing APIs</h3>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <button onClick={() => setCurrentPage('features')} className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Video Cutting & Merging
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('features')} className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Smart Scene Detection
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('features')} className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Dynamic Subtitles
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('features')} className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Video Transcoding engine
                    </button>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold tracking-wider text-slate-200">Developer Ecosystem</h3>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <button onClick={() => setCurrentPage('docs')} className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Interactive API Reference
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentPage('pricing')} className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Pay-As-You-Go Billing
                    </button>
                  </li>
                  <li>
                    <a href="#github-mock" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                      Webhooks & Events SDK
                    </a>
                  </li>
                  <li>
                    <a href="#terms-mock" className="text-sm text-slate-400 hover:text-purple-300 transition-colors flex items-center space-x-1">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Security & SLA</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-purple-950/20 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 MediaForge, Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#terms" className="hover:text-slate-350">Terms of Service</a>
            <a href="#privacy" className="hover:text-slate-350">Privacy Policy</a>
            <a href="#trust" className="hover:text-slate-350 flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>SOC2 Type II Certified</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
