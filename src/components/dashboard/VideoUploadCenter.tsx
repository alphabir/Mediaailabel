import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, FileVideo, Cpu, CheckCircle2, AlertTriangle, 
  Trash2, Loader, Play, Clock, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { db, DBProcessingJob } from '../../lib/supabaseClient';

interface VideoUploadCenterProps {
  userId: string;
}

export default function VideoUploadCenter({ userId }: VideoUploadCenterProps) {
  const [uploads, setUploads] = useState<DBProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  
  // Active playing video modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoName, setPreviewVideoName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const list = await db.getProcessingJobs(userId);
      setUploads(list);
    } catch (err) {
      console.error('Error fetching processing jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUploads();
    }
  }, [userId]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadVideoFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload Logic validating MP4, MOV, AVI extensions
  const uploadVideoFile = async (file: File) => {
    setUploadError('');
    setUploadStatus('uploading');
    setUploadProgress(10);

    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    
    // Strict requirement validation: MP4, MOV, AVI
    const allowedExtensions = ['mp4', 'mov', 'avi'];
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setUploadStatus('error');
      setUploadError('Invalid format: Only MP4, MOV, and AVI containers are supported.');
      return;
    }

    try {
      // 1. Upload in Supabase Storage
      const publicUrl = await db.uploadFile(userId, file, (pct) => {
        setUploadProgress(Math.max(10, pct));
      });

      // 2. Create the postgres record inside processing_jobs
      const createdRecord = await db.createProcessingJob(
        userId, 
        fileName, 
        formatBytes(file.size), 
        publicUrl
      );

      if (createdRecord) {
        setUploads(prev => [createdRecord, ...prev]);
        setUploadStatus('success');
        setUploadProgress(100);

        // Periodically remove success notification state
        setTimeout(() => setUploadStatus('idle'), 3000);

        // 3. Kick off live multi-stage job status orchestration
        simulateJobLifecycle(createdRecord.id);
      } else {
        throw new Error('Could not insert record key in Supabase database.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      setUploadError(err.message || 'Supabase upload/save transaction aborted.');
    }
  };

  // Automated Multi-stage status transition engine (Pending -> Processing -> Completed)
  // This updates BOTH the Supabase PostgreSQL table online AND our React client state!
  const simulateJobLifecycle = (jobId: string) => {
    // 1. Pending -> Processing (triggers after 3 seconds)
    setTimeout(async () => {
      await db.updateProcessingJob(jobId, { status: 'Processing' });
      setUploads(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'Processing' as const } : job
      ));

      // 2. Processing -> Completed (triggers after another 5 seconds)
      setTimeout(async () => {
        await db.updateProcessingJob(jobId, { status: 'Completed' });
        setUploads(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'Completed' as const } : job
        ));
      }, 5000);

    }, 3000);
  };

  const handleDeleteJob = async (id: string) => {
    try {
      const ok = await db.deleteProcessingJob(id);
      if (ok) {
        setUploads(prev => prev.filter(job => job.id !== id));
      }
    } catch (err) {
      console.error('Delete job failure', err);
    }
  };

  return (
    <div className="space-y-6 font-mono max-w-6xl mx-auto pb-12">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-950/15 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <UploadCloud className="h-5.5 w-5.5 text-purple-400" />
            <span>Video Upload Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Securely upload MP4, MOV, and AVI containers directly to Cloud Storage buckets and track automated ingest pipelines.
          </p>
        </div>

        <button
          onClick={fetchUploads}
          className="flex items-center space-x-1.5 border border-purple-950/50 hover:border-purple-500 bg-slate-900/60 px-3 py-1.5 rounded-lg text-xxs font-bold text-slate-400 hover:text-purple-300 transition"
          title="Reload active queue listings"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Statuses</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LHS File Dropper Block */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-5 space-y-4">
            <span className="text-xxs font-bold uppercase tracking-widest text-slate-405 flex items-center space-x-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Direct Audio/Video Ingestion Portal</span>
            </span>

            {/* Drag Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-10 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-purple-500 bg-purple-950/10 shadow-md shadow-purple-500/5'
                  : 'border-purple-950/25 hover:border-purple-800/40 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
                className="hidden"
              />

              <div className="h-12 w-12 rounded-full bg-purple-950/30 flex items-center justify-center border border-purple-900/20 text-purple-400">
                {uploadStatus === 'uploading' ? (
                  <Loader className="h-5 w-5 animate-spin text-purple-400" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-200 font-bold">
                  {uploadStatus === 'uploading' ? 'Publishing stream payload...' : 'Drag & drop media source here'}
                </p>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                  Accepts standard <span className="text-purple-300 font-bold">MP4</span>, <span className="text-purple-300 font-bold">MOV</span>, and <span className="text-purple-300 font-bold">AVI</span> file wrappers.
                </p>
              </div>

              {uploadStatus === 'uploading' && (
                <div className="w-48 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                  <span className="text-[9px] text-slate-500 font-mono block mt-1">{uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* Messages/Status Output */}
            {uploadError && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-xxs flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-emerald-400 text-xxs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 animate-ping" />
                <span>Media wrapper uploaded successfully! Pipeline active.</span>
              </div>
            )}
          </div>

          {/* Quick guide card */}
          <div className="bg-slate-900/10 p-5 border border-purple-950/5 rounded-xl font-sans space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center space-x-1.5">
              <Cpu className="h-4 w-4 text-purple-400" />
              <span>Real-Time Processing Spec</span>
            </h4>
            <p className="text-xxs text-slate-405 leading-relaxed">
              Once files compile and upload, background automation seeds their active job state on row triggers. The status naturally updates from <span className="text-purple-300 font-bold">Pending</span> {'\u2192'} <span className="text-amber-300 font-bold animate-pulse">Processing</span> {'\u2192'} <span className="text-emerald-300 font-bold">Completed</span> asynchronously.
            </p>
          </div>
        </div>

        {/* RHS Video Archival List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-5 space-y-4">
            <span className="text-xxs font-bold uppercase tracking-widest text-slate-405 flex items-center space-x-1.5">
              <FileVideo className="h-4 w-4 text-purple-400" />
              <span>Uploaded Media Archives</span>
            </span>

            {loading ? (
              <div className="text-center py-16">
                <Loader className="h-6 w-6 text-purple-600 animate-spin mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 font-mono">Syncing file records...</span>
              </div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-purple-950/15 rounded-xl bg-slate-950/20">
                <FileVideo className="h-8 w-8 text-slate-650 mx-auto mb-2.5" />
                <h4 className="text-xs font-bold text-slate-400 uppercase">Archive Empty</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                  Drop files on the upload panel to see video jobs logged into your cloud storage and database tables!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {uploads.map((job) => {
                  const isCompleted = job.status === 'Completed';
                  const isProcessing = job.status === 'Processing';
                  const isPending = job.status === 'Pending';
                  
                  return (
                    <div
                      key={job.id}
                      className={`bg-slate-950/50 rounded-lg p-3.5 border transition duration-150 flex flex-col space-y-3 ${
                        isProcessing 
                          ? 'border-amber-500/30 bg-amber-500/5' 
                          : isCompleted 
                          ? 'border-emerald-500/10' 
                          : 'border-purple-950/15'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className={`h-9.5 w-9.5 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                              : isProcessing 
                              ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' 
                              : 'bg-purple-950/20 border-purple-900/30 text-purple-400'
                          }`}>
                            <FileVideo className="h-4.5 w-4.5" />
                          </div>

                          <div className="overflow-hidden">
                            <h4 className="text-xxs font-bold text-slate-100 truncate pr-2 uppercase" title={job.file_name}>
                              {job.file_name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Size: {job.file_size} • Uploaded: {new Date(job.created_at || job.uploaded_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {/* Status Label badge */}
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 border ${
                          isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400'
                            : isProcessing
                            ? 'bg-amber-500/10 border-amber-500/10 text-amber-400 animate-pulse'
                            : isPending
                            ? 'bg-purple-500/10 border-purple-500/10 text-purple-400'
                            : 'bg-red-500/10 border-red-500/10 text-red-500'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      {/* Interactive Controls block */}
                      <div className="flex items-center justify-between border-t border-purple-950/10 pt-2.5">
                        <div className="flex items-center space-x-2">
                          {isCompleted && job.url ? (
                            <button
                              onClick={() => {
                                setPreviewVideoUrl(job.url);
                                setPreviewVideoName(job.file_name);
                              }}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-purple-900/35 border border-purple-800/40 hover:bg-purple-800/45 text-[10px] text-purple-300 font-extrabold transition cursor-pointer"
                            >
                              <Play className="h-3 w-3 text-purple-400" />
                              <span>Preview Clip</span>
                            </button>
                          ) : (
                            <div className="flex items-center text-[9px] text-slate-500 space-x-1.5">
                              <Loader className="h-3 w-3 animate-spin text-purple-500" />
                              <span>Worker is parsing video container headers...</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-950/25 transition border border-transparent hover:border-red-950/15"
                          title="Purge record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Interactive Preview Dialog Modal */}
      <AnimatePresence>
        {previewVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setPreviewVideoUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-purple-900/40 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full"
            >
              <div className="bg-slate-950/80 px-4 py-3 border-b border-purple-950/20 flex justify-between items-center">
                <span className="text-xxs font-bold text-slate-205 flex items-center space-x-2">
                  <Play className="h-4 w-4 text-purple-400" />
                  <span className="truncate max-w-sm uppercase">{previewVideoName}</span>
                </span>
                <button
                  onClick={() => setPreviewVideoUrl(null)}
                  className="text-xs text-slate-500 hover:text-white transition uppercase font-bold"
                >
                  Close
                </button>
              </div>

              <div className="bg-black p-2 aspect-video flex items-center justify-center">
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  className="max-h-[380px] w-full object-contain"
                />
              </div>

              <div className="bg-slate-950/50 p-3 flex justify-between items-center border-t border-purple-950/10">
                <span className="text-[9px] text-slate-500 font-mono">Stream URL: {previewVideoUrl.substring(0, 48)}...</span>
                <a
                  href={previewVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[9px] text-white font-extrabold transition uppercase"
                >
                  Open Direct Link
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
