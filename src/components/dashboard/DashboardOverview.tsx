import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Folder, Cpu, Key, CreditCard, Layers, Activity, RefreshCw, Clock, CheckCircle, Database } from 'lucide-react';
import { db, DBProject, DBJob, DBAPIKey, DBBilling, isSupabaseConfigured } from '../../lib/supabaseClient';

interface DashboardOverviewProps {
  userId: string;
  onNavigateToTab: (tab: 'analytics' | 'video-processor' | 'labeler' | 'projects' | 'jobs' | 'keys' | 'account') => void;
}

export default function DashboardOverview({ userId, onNavigateToTab }: DashboardOverviewProps) {
  const [projectsCount, setProjectsCount] = useState(0);
  const [jobsList, setJobsList] = useState<DBJob[]>([]);
  const [keysCount, setKeysCount] = useState(0);
  const [billing, setBilling] = useState<DBBilling | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [projectsList, jobs, apiKeys, billingData] = await Promise.all([
        db.getProjects(userId),
        db.getJobs(userId),
        db.getAPIKeys(userId),
        db.getBilling(userId)
      ]);
      setProjectsCount(projectsList.length);
      setJobsList(jobs);
      setKeysCount(apiKeys.filter(k => k.status === 'active').length);
      setBilling(billingData);
    } catch {
      console.error('Error fetching analytics overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  // Aggregate jobs for graph visualization
  const completedCount = jobsList.filter(j => j.status === 'Completed').length;
  const processingCount = jobsList.filter(j => j.status === 'Processing').length;
  const pendingCount = jobsList.filter(j => j.status === 'Pending').length;
  const totalCount = jobsList.length;

  return (
    <div className="space-y-6 font-mono">
      {/* Introduction banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-950/15 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <span>Developer Overview Deck</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status updates synced with your active database stack.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center justify-center p-2 rounded-lg border border-purple-950/40 bg-slate-900/60 text-slate-400 hover:text-white transition"
          title="Refresh statistics overview"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xxs text-slate-500">Compiling statistics cards...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Projects Stats */}
            <div 
              onClick={() => onNavigateToTab('projects')}
              className="bg-slate-900/40 border border-purple-950/25 p-5 rounded-xl hover:border-purple-600/35 hover:bg-slate-900/60 transition cursor-pointer flex justify-between items-start"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider block">Total Projects</span>
                <span className="text-2xl font-bold text-white block">{projectsCount}</span>
                <span className="text-[9px] text-purple-400 block hover:underline">Manage workspaces →</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-950/30 border border-purple-900/20 flex items-center justify-center text-purple-400">
                <Folder className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Jobs Stats */}
            <div 
              onClick={() => onNavigateToTab('jobs')}
              className="bg-slate-900/40 border border-purple-950/25 p-5 rounded-xl hover:border-purple-600/35 hover:bg-slate-900/60 transition cursor-pointer flex justify-between items-start"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider block">Dispatched Jobs</span>
                <span className="text-2xl font-bold text-white block">{jobsList.length}</span>
                <span className="text-[9px] text-purple-400 block hover:underline">Monitor queues →</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-indigo-950/30 border border-indigo-900/20 flex items-center justify-center text-indigo-400">
                <Cpu className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* API Keys Stats */}
            <div 
              onClick={() => onNavigateToTab('keys')}
              className="bg-slate-900/40 border border-purple-950/25 p-5 rounded-xl hover:border-purple-600/35 hover:bg-slate-900/60 transition cursor-pointer flex justify-between items-start"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider block">Active API Keys</span>
                <span className="text-2xl font-bold text-white block">{keysCount}</span>
                <span className="text-[9px] text-purple-400 block hover:underline">Rotate keys →</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-950/30 border border-purple-900/20 flex items-center justify-center text-purple-440">
                <Key className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Billing Stats */}
            <div 
              onClick={() => onNavigateToTab('account')}
              className="bg-slate-900/40 border border-purple-950/25 p-5 rounded-xl hover:border-purple-600/35 hover:bg-slate-900/60 transition cursor-pointer flex justify-between items-start"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider block">Current Plan</span>
                <span className="text-xl font-bold text-slate-100 uppercase tracking-tight block">{billing ? billing.plan : 'Free'} Tier</span>
                <span className="text-[9px] text-purple-400 block hover:underline">Upgrade credentials →</span>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-950/30 border border-emerald-900/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Micro visualizer chart for status */}
            <div className="lg:col-span-6 bg-slate-900/30 p-5 rounded-xl border border-purple-950/20 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1.5">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Job Queues Distribution</span>
                </h3>
                <p className="text-[10px] text-slate-500">Visualization of current asynchronous processing status ratios.</p>
              </div>

              {totalCount === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center text-center text-xxs text-slate-500 bg-slate-950/30 rounded border border-purple-950/5 p-4">
                  <span>No data in transaction table.</span>
                  <span>Dispatched jobs will occupy this metrics chart!</span>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {/* CSS Visual percentage bars */}
                  {[
                    { label: 'Completed Tasks', count: completedCount, color: 'bg-emerald-450 text-emerald-400' },
                    { label: 'Active Processing', count: processingCount, color: 'bg-indigo-400 text-indigo-400' },
                    { label: 'Pending Queue', count: pendingCount, color: 'bg-yellow-450 text-yellow-400' }
                  ].map((item) => {
                    const percentage = Math.round((item.count / totalCount) * 100) || 0;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between items-center text-xxs">
                          <span className="text-slate-400 font-bold">{item.label}</span>
                          <span className="font-bold text-slate-300">{item.count} ({percentage}%)</span>
                        </div>
                        
                        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-purple-950/15">
                          <div 
                            className={`h-full ${item.color.split(' ')[0]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="text-[10px] text-slate-500 bg-slate-950/50 p-2.5 rounded border border-purple-950/20">
                📊 Total tracked jobs inside transactional index: <strong>{totalCount} units</strong>.
              </div>
            </div>

            {/* DB Configuration Guide Showcase */}
            <div className="lg:col-span-6 bg-slate-900/30 p-5 rounded-xl border border-purple-950/20 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1.5">
                    <Database className="h-4 w-4 text-purple-400" />
                    <span>Database Engine Specs</span>
                  </h3>
                  
                  <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                </div>

                <div className="space-y-3 pt-1 text-xxs text-slate-450 leading-relaxed font-mono">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px]">ACTIVE CORE CONNECTS:</span>
                    {isSupabaseConfigured ? (
                      <span className="text-emerald-400 font-bold block">LIVE PG SQL SUPABASE CLIENT</span>
                    ) : (
                      <span className="text-amber-400 font-bold block">CLIENT-SIDE LOCALSTORAGE SANDBOX</span>
                    )}
                  </div>

                  <p>
                    The client has built-in dual synchronization. It queries live PostgreSQL on Supabase Cloud if environment secrets are present, or falls back transparently to a sandbox state processor if none are configured.
                  </p>

                  <p className="border-t border-purple-950/10 pt-3">
                    Navigate to <strong className="text-slate-300">Account Console</strong> tab to copy the full auto-generating SQL DDL file to initialize your Supabase bucket project rules!
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('account')}
                className="w-full mt-4 flex items-center justify-center space-x-1.5 border border-purple-500/20 rounded-lg bg-purple-900/20 hover:bg-purple-800/20 py-2 text-xxs font-bold uppercase tracking-wider text-purple-300 transition"
              >
                <span>Review Integration SQL Guide</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
