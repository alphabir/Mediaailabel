import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Trash2, Cpu, AlertTriangle, Layers, Clock, CheckCircle2, RotateCw, RefreshCw, Folder } from 'lucide-react';
import { db, DBJob, DBProject, DBBilling } from '../../lib/supabaseClient';

interface ProcessingJobsSectionProps {
  userId: string;
  selectedProjectId?: string;
}

export default function ProcessingJobsSection({ userId, selectedProjectId }: ProcessingJobsSectionProps) {
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [billing, setBilling] = useState<DBBilling | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Job Form fields
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState('Video Transcode');
  const [targetProjectId, setTargetProjectId] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-progress simulation logic for any active/processing job in client view!
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [jobsList, projectsList, billingData] = await Promise.all([
        db.getJobs(userId),
        db.getProjects(userId),
        db.getBilling(userId)
      ]);
      setJobs(jobsList);
      setProjects(projectsList);
      setBilling(billingData);
      
      // Default project ID
      if (selectedProjectId) {
        setTargetProjectId(selectedProjectId);
      } else if (projectsList.length > 0) {
        setTargetProjectId(projectsList[0].id);
      }
    } catch (e) {
      setErrorMessage('Could not connect to database layers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, selectedProjectId]);

  // Background state polling mock: simulates task execution
  // If we have "Processing" or "Pending" jobs, let's step-increment their progress in the DB
  useEffect(() => {
    if (jobs.length === 0) return;

    const hasActiveJobs = jobs.some(j => j.status === 'Processing' || j.status === 'Pending');
    if (!hasActiveJobs) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    // Every 3 seconds, increment all processing jobs by 15-25%
    progressTimerRef.current = setInterval(async () => {
      let updatedAny = false;

      const nextJobs = await Promise.all(jobs.map(async (job) => {
        if (job.status === 'Pending') {
          updatedAny = true;
          const next = { ...job, status: 'Processing' as const, progress: 10 };
          await db.updateJob(job.id, { status: 'Processing', progress: 10 });
          return next;
        } else if (job.status === 'Processing') {
          updatedAny = true;
          const nextProgress = job.progress + Math.floor(Math.random() * 20) + 10;
          if (nextProgress >= 100) {
            // Completed!
            const finished = { ...job, status: 'Completed' as const, progress: 100 };
            await db.updateJob(job.id, { status: 'Completed', progress: 100 });
            return finished;
          } else {
            const progressing = { ...job, progress: nextProgress };
            await db.updateJob(job.id, { progress: nextProgress });
            return progressing;
          }
        }
        return job;
      }));

      if (updatedAny) {
        setJobs(nextJobs);
        // Refresh billing stats too (as jobs count increments)
        const updatedBill = await db.getBilling(userId);
        setBilling(updatedBill);
      }
    }, 2500);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [jobs, userId]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!jobName.trim()) {
      setErrorMessage('Please provide a meaningful name for this processing task.');
      return;
    }

    if (!targetProjectId) {
      setErrorMessage('Please assign this task to an active project workspace.');
      return;
    }

    // Check billing allowance
    if (billing && billing.usage_jobs_count >= billing.usage_jobs_limit) {
      setErrorMessage(`Billing Limit Refused: Your active '${billing.plan}' tier has exceeded the limit of ${billing.usage_jobs_limit} jobs. Register for a tier upgrade!`);
      return;
    }

    try {
      const created = await db.createJob(userId, targetProjectId, jobName, jobType);
      if (created) {
        setJobs([created, ...jobs]);
        setJobName('');
        setSuccessMessage(`Job scheduled: ${jobType} successfully dispatched to edge pipeline! 🛠️`);
        
        // Refresh billing indicator
        const b = await db.getBilling(userId);
        setBilling(b);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to queue job record in Supabase.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during database dispatch.');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      const ok = await db.deleteJob(id);
      if (ok) {
        setJobs(jobs.filter(j => j.id !== id));
      }
    } catch {
      setErrorMessage('Failed to delete job entry.');
    }
  };

  const handlePurgeCompleted = async () => {
    const toDelete = jobs.filter(j => j.status === 'Completed' || j.status === 'Failed');
    if (toDelete.length === 0) return;
    
    try {
      // Loop delete sequentially
      for (const j of toDelete) {
        await db.deleteJob(j.id);
      }
      setJobs(jobs.filter(j => j.status !== 'Completed' && j.status !== 'Failed'));
      setSuccessMessage('Cleared finished logs from session view.');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch {
      setErrorMessage('Failed to purge logs from DB.');
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : j.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-purple-400" />
            <span>Processing Jobs Controller</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Schedule and run serverless video transcoding, machine learning annotations, and tracking nodes.
          </p>
        </div>

        <div className="flex gap-2">
          {jobs.some(j => j.status === 'Completed' || j.status === 'Failed') && (
            <button
              onClick={handlePurgeCompleted}
              className="px-3 py-1.5 rounded-lg border border-red-950/40 bg-red-950/10 text-red-400 text-xxs font-mono font-bold uppercase transition hover:bg-red-950/30"
            >
              Clear Logs
            </button>
          )}

          <button
            onClick={fetchData}
            className="flex items-center justify-center p-2 rounded-lg border border-purple-950/40 bg-slate-900/60 text-slate-400 hover:text-white transition"
            title="Refresh logs state"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded border border-red-900/40 bg-red-950/20 text-red-400 text-xxs font-mono flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded border border-emerald-900/40 bg-emerald-950/20 text-emerald-450 text-xxs font-mono flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: Stats/Billing + Trigger form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scheduled form card (LHS) */}
        <div className="lg:col-span-7 bg-slate-900/50 p-5 rounded-xl border border-purple-950/35 font-mono">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1.5 mb-4">
            <Play className="h-4 w-4 text-purple-400 fill-purple-400/20" />
            <span>Dispatch Pipeline Workload</span>
          </h3>

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5 text-xxs">
                <label className="block text-slate-300 font-bold uppercase">Assign Project workspace</label>
                <div className="relative">
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-purple-950/35 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-purple-600 font-mono appearance-none"
                  >
                    <option value="">-- Choose Active Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-xxs">
                <label className="block text-slate-300 font-bold uppercase">Workload Node Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-950/35 text-xs rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-purple-600 font-mono"
                >
                  <option value="Video Transcode">Video Transcoding (H.264 MP4)</option>
                  <option value="Auto Labeler">Auto Annotation Pipeline (COCO/YOLO)</option>
                  <option value="Speech-to-Text">Speech-to-Text Generation (WebVTT)</option>
                  <option value="Object Tracking">Autonomous Obstacle Tracking Node</option>
                  <option value="Generative Scene synth">AI Scene Synthesizer (Gemini Proxy)</option>
                </select>
              </div>

            </div>

            <div className="space-y-1.5 text-xxs">
              <label className="block text-slate-300 font-bold uppercase">Job / File Name identifier</label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="E.g. processing_highway_dashcam_segment.mp4"
                required
                className="w-full bg-slate-950 border border-purple-950/35 text-xs rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 py-3 text-xxs font-bold uppercase tracking-wider text-white hover:opacity-90 transition shadow-lg shadow-purple-500/10"
            >
              <Sparkles className="h-4 w-4" />
              <span>Queue Job & Fire Worker</span>
            </button>
          </form>
        </div>

        {/* Resources Meter card (RHS) */}
        <div className="lg:col-span-5 bg-slate-900/30 p-5 rounded-xl border border-purple-950/20 font-mono flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Pipeline Consumption Gauge</span>
            </h3>

            {billing ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xxs">
                  <span className="text-slate-400">Database Account Plan:</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/30 border border-purple-900/40 text-purple-300 font-bold">{billing.plan} Tier</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xxs text-slate-450 font-bold">
                    <span>Active jobs quota:</span>
                    <span>{billing.usage_jobs_count} / {billing.usage_jobs_limit} jobs</span>
                  </div>
                  
                  {/* Gauge */}
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-purple-950/30">
                    <div 
                      className={`h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 ${
                        (billing.usage_jobs_count / billing.usage_jobs_limit) >= 0.8 ? 'from-amber-600 to-red-500' : ''
                      }`}
                      style={{ width: `${Math.min(100, (billing.usage_jobs_count / billing.usage_jobs_limit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">Resetting in 30 days</p>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-xxs text-slate-500 animate-pulse">Calculating resources limit...</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-purple-950/10 text-xxs text-slate-500 leading-relaxed">
            🌿 Every job runs serverless inside sandboxed containers. Once triggered, background workers simulate full transcoder compilation, automatically transitioning jobs from <span className="text-yellow-450">Pending</span> {'\u2192'} <span className="text-indigo-400">Processing</span> {'\u2192'} <span className="text-emerald-400">Completed</span>.
          </div>
        </div>

      </div>

      {/* Filters and List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3 font-mono">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search API worker lists..."
            className="w-full sm:max-w-xs bg-slate-900/40 border border-purple-950/25 text-xxs rounded-lg pl-3 pr-4 py-2 text-slate-300 focus:outline-none focus:border-purple-600/50"
          />

          <div className="flex gap-2 flex-wrap">
            {['all', 'processing', 'completed', 'pending', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
                  statusFilter === st 
                    ? 'border-purple-650 bg-purple-600/20 text-purple-300' 
                    : 'border-purple-950/20 bg-slate-900/10 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs list details */}
        {loading ? (
          <div className="text-center py-12 font-mono">
            <RotateCw className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-2" />
            <p className="text-xxs text-slate-500">Querying status from scheduler database...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-purple-950/10 rounded-xl bg-slate-900/5 font-mono">
            <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Active Jobs</h4>
            <p className="text-xxs text-slate-500 max-w-sm mx-auto mt-1 px-4">
              {searchTerm ? 'No jobs matched your current filter criteria.' : 'Create a workload above to watch jobs process and update in real-time.'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/25 rounded-xl border border-purple-950/20 overflow-hidden font-mono">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-purple-950/20 text-[10px] text-slate-450 uppercase tracking-widest font-bold">
                    <th className="p-4">Worker / Task Identifiers</th>
                    <th className="p-4">Linked Project</th>
                    <th className="p-4">Pipeline node</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Schedule Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/10 text-xxs">
                  {filteredJobs.map((job) => {
                    const linkedProj = projects.find(p => p.id === job.project_id);
                    return (
                      <tr 
                        key={job.id}
                        className="hover:bg-purple-950/10 transition group"
                      >
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-100 group-hover:text-purple-300 transition block">{job.name}</span>
                            <span className="text-[10px] text-slate-500 block">ID: {job.id.substring(0, 10)}...</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <Folder className="h-3.5 w-3.5 text-purple-405/60" />
                            <span>{linkedProj ? linkedProj.name : 'Unknown Workspace'}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-purple-950/30 text-slate-350">{job.type}</span>
                        </td>
                        <td className="p-4 w-44">
                          <div className="space-y-1.5">
                            <span className="text-slate-400 text-[10px] block">{job.progress}% Complete</span>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-purple-950/20">
                              <div 
                                className={`h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ${
                                  job.status === 'Completed' ? 'from-emerald-500 to-teal-400' : ''
                                }`} 
                                style={{ width: `${job.progress}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide text-[10px] ${
                            job.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/10' :
                            job.status === 'Processing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 animate-pulse' :
                            job.status === 'Failed' ? 'bg-red-500/10 text-red-450 border border-red-500/10' :
                            'bg-yellow-500/10 text-yellow-450 border border-yellow-500/10'
                          }`}>
                            <span>{job.status}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1 rounded hover:bg-red-950/30 hover:text-red-400 text-slate-500 transition border border-transparent hover:border-red-900/10"
                            title="Delete Task Row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
