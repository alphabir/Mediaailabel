import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Folder, ExternalLink, RefreshCw, Layers, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { db, DBProject } from '../../lib/supabaseClient';

interface ProjectsSectionProps {
  userId: string;
  onProjectSelected?: (projectId: string) => void;
}

export default function ProjectsSection({ userId, onProjectSelected }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const list = await db.getProjects(userId);
      setProjects(list);
    } catch (e) {
      setErrorMessage('Could not load projects from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const created = await db.createProject(userId, name, description);
      if (created) {
        setProjects([created, ...projects]);
        setName('');
        setDescription('');
        setIsCreating(false);
        setSuccessMessage('Project successfully created in database! ⚡');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to register project in Supabase.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing request.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also cascade delete all processing jobs!')) return;
    
    setErrorMessage('');
    try {
      const ok = await db.deleteProject(id);
      if (ok) {
        setProjects(projects.filter(p => p.id !== id));
      } else {
        setErrorMessage('Database refused to delete project.');
      }
    } catch (err) {
      setErrorMessage('Failed to communicate with database.');
    }
  };

  const handleToggleStatus = async (project: DBProject) => {
    const nextStatus = project.status === 'Active' ? 'Paused' : project.status === 'Paused' ? 'Completed' : 'Active';
    try {
      const ok = await db.updateProject(project.id, { status: nextStatus });
      if (ok) {
        setProjects(projects.map(p => p.id === project.id ? { ...p, status: nextStatus } : p));
      }
    } catch (err) {
      setErrorMessage('Failed to update project status.');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Folder className="h-5 w-5 text-purple-400" />
            <span>Developer Projects DB</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Build and manage segmented pipeline workspaces for your media nodes.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchProjects}
            className="flex items-center justify-center p-2 rounded-lg border border-purple-950/40 bg-slate-900/60 text-slate-400 hover:text-white transition"
            title="Refresh database entries"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 px-3.5 py-2 text-xxs font-bold font-mono uppercase tracking-wider text-white hover:opacity-90 shadow transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
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

      {/* Create Project Panel */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 p-5 rounded-lg border border-purple-950/30 font-mono"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1.5">
              <Plus className="h-4 w-4 text-purple-400" />
              <span>Provision Database Record</span>
            </h3>
            <button 
              onClick={() => setIsCreating(false)} 
              className="text-slate-400 hover:text-white text-xxs block border border-purple-950/35 px-2 py-0.5 rounded"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5 text-xxs">
              <label className="block text-slate-300 font-bold uppercase">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Autonomous Driving Datasets"
                required
                className="w-full bg-slate-950 border border-purple-950/35 text-xs rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
              />
            </div>

            <div className="space-y-1.5 text-xxs">
              <label className="block text-slate-300 font-bold uppercase">Pipeline Description / Annotations Goal</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. Auto label vehicles, track lanes, and output YOLO frames on high-speed dashcams."
                className="w-full bg-slate-950 border border-purple-950/35 text-xs rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-600 font-mono h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-1 border border-purple-500/20 rounded-lg bg-purple-900/30 hover:bg-purple-800/40 py-2.5 text-xxs font-bold uppercase tracking-widest text-purple-300 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Deploy Project Row</span>
            </button>
          </form>
        </motion.div>
      )}

      {/* Filter and search */}
      <div className="relative font-mono">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter workspace databases..."
          className="w-full bg-slate-900/40 border border-purple-950/20 text-xxs rounded-lg pl-3 pr-4 py-2.5 text-slate-300 focus:outline-none focus:border-purple-600/50"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 font-mono">
          <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xxs text-slate-400">Communicating with transactional endpoints...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-purple-950/20 rounded-xl bg-slate-900/10 font-mono">
          <Folder className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Projects Found</h4>
          <p className="text-xxs text-slate-500 max-w-sm mx-auto mt-1 px-4">
            {searchTerm ? 'No projects match your current filters.' : 'Your workspace list is currently empty. Provision a new project record using Supabase SQL Schema triggers above!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => (
            <motion.div
              key={proj.id}
              layoutId={`proj-${proj.id}`}
              className="bg-slate-900/30 border border-purple-950/25 rounded-xl p-5 hover:border-purple-800/30 transition flex flex-col justify-between group relative"
            >
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-950/40 border border-purple-900/30 flex items-center justify-center">
                      <Folder className="h-4.5 w-4.5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition line-clamp-1">{proj.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {proj.id.substring(0, 8)}...</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(proj)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wide ${
                      proj.status === 'Active' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/10' :
                      proj.status === 'Completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                    }`}
                  >
                    {proj.status}
                  </button>
                </div>

                <p className="text-xxs text-slate-400 min-h-8 font-mono leading-relaxed line-clamp-2">
                  {proj.description || 'No description provided for this media database workspace.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-purple-950/10 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-500">
                  {new Date(proj.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                
                <div className="flex items-center space-x-2">
                  {onProjectSelected && (
                    <button
                      onClick={() => onProjectSelected(proj.id)}
                      className="px-2 py-1 rounded bg-purple-950/30 hover:bg-purple-900/40 text-purple-350 border border-purple-900/20 font-bold uppercase tracking-wider flex items-center space-x-1"
                    >
                      <Play className="h-2.5 w-2.5" />
                      <span>Run Jobs</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1 rounded hover:bg-red-950/20 hover:text-red-400 text-slate-500 transition border border-transparent hover:border-red-900/20"
                    title="Delete project entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
