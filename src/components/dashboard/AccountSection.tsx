import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Database, Shield, CheckCircle2, Bookmark, Flame, CreditCard, Sparkles, Clipboard, Check, HelpCircle, ArrowRight } from 'lucide-react';
import { db, DBUser, DBBilling, isSupabaseConfigured } from '../../lib/supabaseClient';

interface AccountSectionProps {
  user: DBUser;
  onRefreshUser: () => void;
}

export default function AccountSection({ user, onRefreshUser }: AccountSectionProps) {
  const [billing, setBilling] = useState<DBBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.full_name);
  const [editAvatar, setEditAvatar] = useState(user.avatar_url);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password editing state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  useEffect(() => {
    setEditName(user.full_name);
    setEditAvatar(user.avatar_url);
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg('');
    try {
      const { user: updated, error } = await db.updateProfile(user.id, editName, editAvatar);
      if (error) {
        setProfileMsg(`Error: ${error.message}`);
        setUpdatingProfile(false);
        return;
      }
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 2000);
      onRefreshUser();
      setIsEditing(false);
    } catch (err: any) {
      setProfileMsg(`Error: ${err.message}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassSuccessMsg('Passphrase must be ≥ 6 chars');
      return;
    }
    setPassLoading(true);
    setPassSuccessMsg('');
    try {
      const { success, error } = await db.updatePassword(newPassword);
      if (error) {
        setPassSuccessMsg(`Error: ${error.message}`);
        setPassLoading(false);
        return;
      }
      setPassSuccessMsg('Passphrase updated successfully!');
      setNewPassword('');
      setTimeout(() => {
        setPassSuccessMsg('');
        setIsChangingPass(false);
      }, 2000);
    } catch (err: any) {
      setPassSuccessMsg(`Error: ${err.message}`);
    } finally {
      setPassLoading(false);
    }
  };

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const b = await db.getBilling(user.id);
      setBilling(b);
    } catch {
      console.error('Billing sync failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBilling();
    }
  }, [user]);

  const handleUpdatePlan = async (plan: 'Free' | 'Pro' | 'Enterprise') => {
    setUpdatingPlan(plan);
    try {
      const updated = await db.updateBillingPlan(user.id, plan);
      if (updated) {
        setBilling(updated);
      }
    } catch (err) {
      console.error('Plan upgrade failed', err);
    } finally {
      setUpdatingPlan(null);
    }
  };

  const handleCopySql = () => {
    const ddl = `-- Run this in your Supabase SQL Editor:
-- Create public user profile
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;
create policy "Users own profile select" on public.users for select using (auth.uid() = id);

-- Create billing table
create table public.billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  plan text default 'Free' check (plan in ('Free', 'Pro', 'Enterprise')),
  status text default 'active',
  current_period_end timestamp with time zone default (now() + interval '30 days'),
  usage_jobs_count integer default 0,
  usage_jobs_limit integer default 100
);

alter table public.billing enable row level security;
create policy "Users own billing select" on public.billing for select using (auth.uid() = user_id);

-- Create projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'Active' check (status in ('Active', 'Paused', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;
create policy "Users own projects manage" on public.projects for all using (auth.uid() = user_id);

-- Create jobs
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Completed', 'Failed')),
  progress integer default 0,
  duration integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.jobs enable row level security;
create policy "Users own jobs manage" on public.jobs for all using (auth.uid() = user_id);

-- Create api_keys
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  key_hint text not null,
  token text not null,
  status text default 'active'
);

alter table public.api_keys enable row level security;
create policy "Users own keys manage" on public.api_keys for all using (auth.uid() = user_id);

-- Profile triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), '');
  insert into public.billing (user_id, plan, usage_jobs_count, usage_jobs_limit)
  values (new.id, 'Free', 0, 100);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create vision datasets
create table public.datasets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  classes text[] default '{}',
  type text default 'image' check (type in ('image', 'video')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.datasets enable row level security;
create policy "Users own datasets manage" on public.datasets for all using (auth.uid() = user_id);

-- Create dataset items (images/videos)
create table public.dataset_items (
  id uuid default gen_random_uuid() primary key,
  dataset_id uuid references public.datasets(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text default 'image' check (type in ('image', 'video')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.dataset_items enable row level security;
create policy "Users manage items on personal datasets" on public.dataset_items for all using (
  exists (
    select 1 from public.datasets 
    where datasets.id = dataset_id and datasets.user_id = auth.uid()
  )
);

-- Create image/frame annotations
create table public.annotations (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.dataset_items(id) on delete cascade not null,
  class_name text not null,
  type text not null check (type in ('bbox', 'polygon', 'segmentation')),
  coordinates jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.annotations enable row level security;
create policy "Users manage annotations on personal assets" on public.annotations for all using (
  exists (
    select 1 from public.dataset_items
    join public.datasets on datasets.id = dataset_items.dataset_id
    where dataset_items.id = item_id and datasets.user_id = auth.uid()
  )
);`;

    navigator.clipboard.writeText(ddl);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(`VITE_SUPABASE_URL="YOUR_SUPABASE_URL"\nVITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"`);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <User className="h-5 w-5 text-purple-400" />
          <span>Developer Account Console</span>
        </h2>
        <p className="text-xs text-slate-405 font-mono mt-1">
          Review active profile scopes, plan billing, and connect live Supabase cloud instances.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Card Summary */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-purple-950/25 rounded-xl p-5 font-mono text-center space-y-4">
          {!isEditing ? (
            <>
              <div className="relative inline-block mx-auto">
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name}
                  className="h-20 w-20 rounded-xl border border-purple-950/40 bg-slate-950 p-1 mx-auto"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-lg bg-purple-600 flex items-center justify-center border border-slate-900 text-white font-bold text-[10px]">
                  Dev
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">{user.full_name}</h3>
                <p className="text-[10px] text-slate-500 font-mono select-all text-xs">{user.email}</p>
              </div>

              <div className="flex justify-center space-x-2 pt-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1.5 border border-purple-900/40 hover:bg-purple-950/20 text-purple-300 rounded-lg text-[9px] uppercase font-bold transition flex items-center space-x-1"
                >
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setIsChangingPass(!isChangingPass)}
                  className="px-2.5 py-1.5 border border-purple-900/40 hover:bg-purple-950/20 text-purple-305 rounded-lg text-[9px] uppercase font-bold transition flex items-center space-x-1"
                >
                  <span>Set Password</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-left">
              <span className="text-[10px] font-bold text-purple-405 block uppercase tracking-wider">Update Profile</span>
              
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase block">Developer Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-purple-950/40 text-[11px] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase block">Avatar Image (Seed URL)</label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-purple-950/40 text-[11px] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setEditAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=dev_${Math.floor(Math.random() * 10000)}`)}
                  className="text-[9px] text-indigo-400 hover:underline block pt-0.5"
                >
                  🎲 Randomize Avatar Seed
                </button>
              </div>

              {profileMsg && <p className="text-[10px] text-purple-300 font-mono">{profileMsg}</p>}

              <div className="flex gap-2 pt-1 border-t border-purple-950/10">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="flex-1 bg-gradient-to-tr from-purple-600 to-indigo-650 py-1.5 rounded text-[9px] font-bold text-white uppercase"
                >
                  {updatingProfile ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-950 border border-purple-950/20 text-slate-400 text-[9px] font-bold py-1.5 rounded hover:text-white uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isChangingPass && !isEditing && (
            <form onSubmit={handleUpdatePass} className="space-y-3 pt-3 border-t border-purple-950/15 text-left">
              <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wider">Configure Password Settings</span>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full bg-slate-950 border border-purple-950/40 text-[11px] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>

              {passSuccessMsg && <p className="text-[10px] text-amber-400 font-mono">{passSuccessMsg}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex-1 bg-gradient-to-tr from-purple-800 to-indigo-800 text-white hover:bg-purple-900/10 py-1.5 rounded text-[9px] font-bold uppercase"
                >
                  {passLoading ? 'Saving...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="flex-1 bg-slate-950 border border-purple-950/20 text-slate-400 text-[9px] font-bold py-1.5 rounded hover:text-white uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-purple-950/15 pt-4 text-left text-xxs text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>Account ID:</span>
              <span className="text-slate-300 font-bold select-all">{user.id.substring(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Member Since:</span>
              <span className="text-slate-305">
                {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-950/40 p-2 border border-purple-950/10 rounded mt-2">
              <span className="text-[10px] font-bold">SQL RLS Status:</span>
              <span className="text-emerald-450 text-[10px] uppercase font-bold flex items-center space-x-1">
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Plan Billing Card */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-purple-950/20 rounded-xl p-5 font-mono space-y-5">
          <div className="flex items-center space-x-2 border-b border-purple-950/10 pb-3">
            <CreditCard className="h-4.5 w-4.5 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-205">Pipeline Account Plans (Billing)</h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="h-6 w-6 border border-purple-650 border-t-transparent animate-spin rounded-full mx-auto" strokeWidth={2} />
              <p className="text-xxs text-slate-505 mt-2">Loading bills...</p>
            </div>
          ) : billing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Plans Grid */}
                {[
                  { name: 'Free', price: '$0', limit: 100, desc: 'Ideal for client sandbox building' },
                  { name: 'Pro', price: '$29', limit: 1500, desc: 'Accelerated ML annotation cores' },
                  { name: 'Enterprise', price: '$149', limit: 100000, desc: 'High concurrency batch nodes' }
                ].map((plan) => {
                  const isActive = billing.plan === plan.name;
                  return (
                    <div 
                      key={plan.name}
                      className={`p-4 rounded-lg border flex flex-col justify-between space-y-3 relative overflow-hidden transition ${
                        isActive 
                          ? 'border-purple-605 bg-purple-950/15 shadow-md shadow-purple-500/5' 
                          : 'border-purple-950/15 bg-slate-950/10 hover:border-purple-900/20'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-purple-600 text-[8px] font-bold text-white px-2 py-0.5 rounded-bl uppercase tracking-wide">
                          Current
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">{plan.name} Plan</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold text-white">{plan.price}</span>
                          <span className="text-[9px] text-slate-500">/mo</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono leading-relaxed">{plan.desc}</p>
                      </div>

                      <div className="space-y-3.5 pt-2 border-t border-purple-950/5">
                        <div className="text-[9px] text-slate-455">
                          Limit Checklist: <strong className="text-slate-300 font-bold">{plan.limit.toLocaleString()} jobs</strong>
                        </div>

                        <button
                          disabled={isActive || updatingPlan !== null}
                          onClick={() => handleUpdatePlan(plan.name as any)}
                          className={`w-full py-1 rounded text-[10px] font-bold font-mono uppercase transition ${
                            isActive 
                              ? 'bg-purple-950/10 text-purple-400 border border-purple-900/25 cursor-not-allowed' 
                              : 'bg-purple-900/30 text-purple-305 border border-purple-800/10 hover:bg-purple-800/40'
                          }`}
                        >
                          {updatingPlan === plan.name ? 'Refactoring...' : isActive ? 'Active Billing' : 'Equip Plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          ) : null}
        </div>

      </div>

      {/* Database Connection Instructions Cards - SUPABASE CONNECTIVITY */}
      <div className="bg-slate-900/30 border border-purple-950/20 rounded-xl p-5 font-mono space-y-5">
        <div className="flex items-center justify-between border-b border-purple-950/10 pb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Database className="h-4.5 w-4.5 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-205">Connect Live Supabase Database</span>
          </div>

          <span className={`text-xxs px-2.5 py-0.5 rounded-full border font-bold ${
            isSupabaseConfigured 
              ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-450 animate-pulse' 
              : 'bg-amber-500/10 border-amber-500/10 text-amber-400'
          }`}>
            Status: {isSupabaseConfigured ? 'LIVE CONNECTION ONLINE ⚡' : 'SANDBOX SIMULATOR ACTIVE 🛠️'}
          </span>
        </div>

        <p className="text-xxs text-slate-400 leading-relaxed font-mono">
          Ready to scale? Connect your actual free Supabase Cloud SQL DB in under 2 minutes. Doing so transfers all projects, processing logs, API certificates, and tiers from Sandbox storage directly to database tables!
        </p>

        <div className="space-y-4">
          
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="h-5 w-5 rounded bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 text-xxs font-bold">1</span>
              <h4 className="text-xxs font-bold uppercase text-slate-200">Execute DDL in Supabase SQL Editor</h4>
            </div>
            
            <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
              Open your Supabase Workspace, navigate to the <strong className="text-slate-300">SQL Editor</strong> tab on the sidebar, and paste the following transactional table, triggers, and policy structures.
            </p>

            <div className="pl-7">
              <button
                onClick={() => setShowSql(!showSql)}
                className="text-xxs flex items-center space-x-1 border border-purple-905/30 bg-slate-950 px-3 py-1.5 rounded hover:bg-slate-900 transition text-slate-300"
              >
                <span>{showSql ? 'Collapse Schema script' : 'Expand SQL schema codes'}</span>
                <ArrowRight className={`h-3 w-3 transition-transform ${showSql ? 'rotate-90' : ''}`} />
              </button>

              {showSql && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 relative"
                >
                  <pre className="p-4 rounded-lg bg-slate-950 border border-purple-950/40 text-[9px] text-slate-405 overflow-x-auto max-h-56 leading-relaxed select-all">
                    {`-- Create user profile matching credentials
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Complete source tables mapped in public/schema
-- View complete schema details in the root file '/supabase_schema.sql' anytime.`}
                  </pre>
                  
                  <button
                    onClick={handleCopySql}
                    className="absolute top-2 right-2 text-[10px] bg-purple-900/40 px-2 py-1 rounded hover:bg-purple-800 border border-purple-800/20 text-white flex items-center space-x-1"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied SQL!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3 w-3" />
                        <span>Copy Complete DDL</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="h-5 w-5 rounded bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 text-xxs font-bold">2</span>
              <h4 className="text-xxs font-bold uppercase text-slate-200">Inject Config Variables via Secrets Panel</h4>
            </div>

            <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">
              Copy the environment parameters below. Open your AI Studio <strong className="text-slate-303">Project Settings / Secrets</strong> panel, and declare these keys so our gateway connects to your database!
            </p>

            <div className="pl-7 relative max-w-sm">
              <pre className="p-3.5 rounded bg-slate-950 border border-purple-950/30 text-[10px] text-purple-305 flex justify-between items-center">
                <span>
                  VITE_SUPABASE_URL="..."<br/>
                  VITE_SUPABASE_ANON_KEY="..."
                </span>
                <button
                  onClick={handleCopyEnv}
                  className="p-1.5 rounded transition text-slate-500 hover:text-white"
                  title="Copy environment variables template"
                >
                  {copiedEnv ? (
                    <Check className="h-4 w-4 text-emerald-450" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </button>
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
