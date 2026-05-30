import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Folder, Key, User, Activity, LogOut, LayoutDashboard, Database, RefreshCw, Terminal, Sparkles, Shield, Bookmark, Video, UploadCloud
} from 'lucide-react';
import { db, DBUser, isSupabaseConfigured } from '../lib/supabaseClient';

// Sub-page imports
import DashboardOverview from '../components/dashboard/DashboardOverview';
import VideoProcessingSection from '../components/dashboard/VideoProcessingSection';
import DataLabelingSection from '../components/dashboard/DataLabelingSection';
import ProjectsSection from '../components/dashboard/ProjectsSection';
import ProcessingJobsSection from '../components/dashboard/ProcessingJobsSection';
import APIKeysSection from '../components/dashboard/APIKeysSection';
import AccountSection from '../components/dashboard/AccountSection';
import VideoUploadCenter from '../components/dashboard/VideoUploadCenter';

interface DashboardProps {
  setUserLoggedIn?: (b: boolean) => void;
  setCurrentPage?: (page: string) => void;
}

type TabType = 'analytics' | 'video-upload' | 'video-processor' | 'labeler' | 'projects' | 'jobs' | 'keys' | 'account';

export default function Dashboard({ setUserLoggedIn, setCurrentPage }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const active = await db.getCurrentUser();
      if (active) {
        setUser(active);
      } else {
        // Fallback default for demo sandbox consistency
        setUser({
          id: 'usr-demo-alex',
          email: 'developer@mediaforge.io',
          full_name: 'ALEXANDER FORGE',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alexander',
          created_at: new Date().toISOString()
        });
      }
    } catch {
      console.error('Error loading current auth scopes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleSignout = async () => {
    await db.signOut();
    if (setUserLoggedIn && setCurrentPage) {
      setUserLoggedIn(false);
      setCurrentPage('home');
    } else {
      window.location.reload();
    }
  };

  const handleNavigateToJobWithProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('jobs');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center space-y-4 font-mono text-slate-100">
        <Cpu className="h-8 w-8 text-purple-500 animate-spin" />
        <p className="text-xs text-slate-400">Restoring microservice session states...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Sidebar background neon glow */}
      <div className="absolute top-[30%] left-[5%] w-[320px] h-[320px] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Side Navigation panel */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-purple-950/20 backdrop-blur-xl p-5 flex flex-col justify-between font-mono gap-6 flex-shrink-0">
        <div className="space-y-6">
          
          {/* Console Header */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow shadow-purple-500/10">
              <Cpu className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase">MediaForge</h1>
              <p className="text-[10px] text-slate-500">API Console v3.1</p>
            </div>
          </div>

          {/* Database active indicator */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-purple-950/15 flex items-center space-x-2">
            <Database className={`h-3.5 w-3.5 ${isSupabaseConfigured ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <div className="text-[9px]">
              <span className="text-slate-500 block uppercase font-bold">Connected db:</span>
              <span className="text-emerald-450 font-bold">
                Connected to Supabase
              </span>
            </div>
          </div>

          {/* Navigation link arrays */}
          <nav className="space-y-1.5 pt-2">
            {[
              { id: 'analytics', label: 'Console Overview', icon: LayoutDashboard },
              { id: 'video-upload', label: 'Video Upload Center', icon: UploadCloud },
              { id: 'video-processor', label: 'Video Studio', icon: Video },
              { id: 'labeler', label: 'Dataset Labeler', icon: Database },
              { id: 'projects', label: 'Pipeline Projects', icon: Folder },
              { id: 'jobs', label: 'Processing Jobs', icon: Cpu },
              { id: 'keys', label: 'API Credentials', icon: Key },
              { id: 'account', label: 'Account Systems', icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    if (tab.id !== 'jobs') {
                      setSelectedProjectId(undefined); // Clear direct links when switching manually
                    }
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xxs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    isActive 
                      ? 'bg-gradient-to-tr from-purple-900/30 to-indigo-900/20 text-purple-300 border border-purple-900/30 font-extrabold shadow shadow-purple-500/5' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* User context footer block */}
        {user && (
          <div className="mt-8 border-t border-purple-950/15 pt-4 space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <img 
                src={user.avatar_url} 
                alt={user.full_name} 
                className="h-8 w-8 rounded-lg border border-purple-950/30 bg-slate-950 p-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-slate-200 block truncate leading-tight uppercase">{user.full_name}</span>
                <span className="text-[9px] text-slate-500 block truncate font-mono">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleSignout}
              className="w-full flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-red-950/20 px-3 py-2 border border-purple-950/25 hover:border-red-900/30 text-slate-400 hover:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Disconnect Session</span>
            </button>
          </div>
        )}

      </aside>

      {/* Main dashboard body workspace (RHS) */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto h-[100vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {activeTab === 'analytics' && (
              <DashboardOverview 
                userId={user?.id || 'usr-demo'} 
                onNavigateToTab={(tab) => {
                  setActiveTab(tab as any);
                  if (tab !== 'jobs') setSelectedProjectId(undefined);
                }} 
              />
            )}

            {activeTab === 'video-upload' && (
              <VideoUploadCenter 
                userId={user?.id || 'usr-demo'} 
              />
            )}

            {activeTab === 'video-processor' && (
              <VideoProcessingSection 
                userId={user?.id || 'usr-demo'} 
              />
            )}

            {activeTab === 'labeler' && (
              <DataLabelingSection 
                userId={user?.id || 'usr-demo'} 
              />
            )}
            
            {activeTab === 'projects' && (
              <ProjectsSection 
                userId={user?.id || 'usr-demo'} 
                onProjectSelected={handleNavigateToJobWithProject}
              />
            )}

            {activeTab === 'jobs' && (
              <ProcessingJobsSection 
                userId={user?.id || 'usr-demo'} 
                selectedProjectId={selectedProjectId}
              />
            )}

            {activeTab === 'keys' && (
              <APIKeysSection 
                userId={user?.id || 'usr-demo'} 
              />
            )}

            {activeTab === 'account' && user && (
              <AccountSection 
                user={user} 
                onRefreshUser={fetchCurrentUser} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
