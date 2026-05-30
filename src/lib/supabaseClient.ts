import { createClient } from '@supabase/supabase-js';

// Read values from Vite environment
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determine if real Supabase environment is correctly configured
export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Initialize the real custom Supabase client (only if credentials are correct)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * DATABASE TYPES & MODEL SCHEMAS
 */
export interface DBUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export interface DBProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'Active' | 'Paused' | 'Completed';
  created_at: string;
}

export interface DBJob {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  type: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  progress: number;
  duration: number; // in seconds
  created_at: string;
}

export interface DBAPIKey {
  id: string;
  user_id: string;
  name: string;
  key_hint: string;
  token: string;
  status: 'active' | 'revoked';
  last_used_at: string | null;
  created_at: string;
}

export interface DBBilling {
  id: string;
  user_id: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: string;
  current_period_end: string;
  usage_jobs_count: number;
  usage_jobs_limit: number;
  created_at: string;
}

export interface DBDataset {
  id: string;
  user_id: string;
  name: string;
  description: string;
  classes: string[];
  type: 'image' | 'video';
  created_at: string;
}

export interface DBDatasetItem {
  id: string;
  dataset_id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}

export interface DBAnnotation {
  id: string;
  item_id: string;
  class_name: string;
  type: 'bbox' | 'polygon' | 'segmentation';
  coordinates: any;
  created_at: string;
}

/**
 * CLIENT LAYER FOR MULTI-DB (MOCK FALLBACK & LIVE SUPABASE SYNC)
 */
class DatabaseService {
  /**
   * HELPERS FOR LOCAL STORAGE DATA STORE
   */
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(`mediaforge_db_${key}`);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`mediaforge_db_${key}`, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  // Active mock session id & email
  getMockSession(): { user: DBUser | null } {
    const active = this.getStorage<{ user: DBUser | null }>('session', { user: null });
    return active;
  }

  setMockSession(user: DBUser | null): void {
    this.setStorage('session', { user });
  }

  /**
   * INITIAL SEED DATA
   */
  seedMockDatabase(userId: string) {
    // 1. Projects seed
    const projects = this.getStorage<DBProject[]>('projects', []);
    if (projects.filter(p => p.user_id === userId).length === 0) {
      const dummyProjects: DBProject[] = [
        {
          id: 'proj-1',
          user_id: userId,
          name: 'Social Media Promos',
          description: 'Short dynamic visual clips for TikTok and Instagram reels.',
          status: 'Active',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'proj-2',
          user_id: userId,
          name: 'Developer Tutorial Series',
          description: 'Annotated source code step-by-steps and programming guides.',
          status: 'Completed',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      this.setStorage('projects', [...projects, ...dummyProjects]);
    }

    // 2. Jobs seed
    const jobs = this.getStorage<DBJob[]>('jobs', []);
    if (jobs.filter(j => j.user_id === userId).length === 0) {
      const dummyJobs: DBJob[] = [
        {
          id: 'job-1',
          user_id: userId,
          project_id: 'proj-1',
          name: 'Fast Cut Transcoder',
          type: 'Video Transcode',
          status: 'Completed',
          progress: 100,
          duration: 34,
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
        },
        {
          id: 'job-2',
          user_id: userId,
          project_id: 'proj-1',
          name: 'TikTok Video Auto annotation',
          type: 'Auto Labeler',
          status: 'Processing',
          progress: 45,
          duration: 120,
          created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
        }
      ];
      this.setStorage('jobs', [...jobs, ...dummyJobs]);
    }

    // 3. API Keys seed
    const keys = this.getStorage<DBAPIKey[]>('api_keys', []);
    if (keys.filter(k => k.user_id === userId).length === 0) {
      const dummyKeys: DBAPIKey[] = [
        {
          id: 'apikey-1',
          user_id: userId,
          name: 'Prod Pipeline Access',
          key_hint: 'mf_live_9fa8...d10e',
          token: 'mf_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
          status: 'active',
          last_used_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
        }
      ];
      this.setStorage('api_keys', [...keys, ...dummyKeys]);
    }

    // 4. Billing seed
    const billings = this.getStorage<DBBilling[]>('billing', []);
    if (billings.filter(b => b.user_id === userId).length === 0) {
      const defaultBilling: DBBilling = {
        id: 'bill-' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        plan: 'Free',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        usage_jobs_count: 2,
        usage_jobs_limit: 100,
        created_at: new Date().toISOString()
      };
      this.setStorage('billing', [...billings, defaultBilling]);
    }
  }

  /**
   * AUTH LAYER ORCHESTRATION
   */
  async signUp(email: string, pass: string, fullName: string): Promise<{ user: DBUser | null; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              full_name: fullName,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`
            }
          }
        });
        if (error) throw error;
        
        const returnUser: DBUser = {
          id: data.user?.id || '',
          email: data.user?.email || email,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
          created_at: new Date().toISOString()
        };
        return { user: returnUser, error: null };
      } catch (e: any) {
        return { user: null, error: new Error(e.message || 'Error creating live auth account') };
      }
    } else {
      // Mock signup flow
      const users = this.getStorage<DBUser[]>('users_list', []);
      if (users.some(u => u.email === email)) {
        return { user: null, error: new Error('An account with this email already exists') };
      }

      const newUser: DBUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 10),
        email,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
        created_at: new Date().toISOString()
      };

      this.setStorage('users_list', [...users, newUser]);
      this.setMockSession(newUser);
      this.seedMockDatabase(newUser.id);
      return { user: newUser, error: null };
    }
  }

  async signIn(email: string, pass: string): Promise<{ user: DBUser | null; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;

        // Fetch user metadata row from our public schema profile table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user?.id)
          .single();

        const returnUser: DBUser = {
          id: data.user?.id || '',
          email: data.user?.email || email,
          full_name: profile?.full_name || data.user?.user_metadata?.full_name || email.split('@')[0],
          avatar_url: profile?.avatar_url || data.user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          created_at: profile?.created_at || data.user?.created_at || new Date().toISOString()
        };

        return { user: returnUser, error: null };
      } catch (e: any) {
        return { user: null, error: new Error(e.message || 'Invalid credentials or connection parameters') };
      }
    } else {
      // Mock Sign In
      const users = this.getStorage<DBUser[]>('users_list', []);
      const matched = users.find(u => u.email === email);
      
      if (!matched) {
        // Fallback for demo: auto-register standard default seed user
        const demoUser: DBUser = {
          id: 'usr-demo',
          email: email,
          full_name: email.split('@')[0].toUpperCase(),
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          created_at: new Date().toISOString()
        };
        this.setStorage('users_list', [...users, demoUser]);
        this.setMockSession(demoUser);
        this.seedMockDatabase(demoUser.id);
        return { user: demoUser, error: null };
      }

      this.setMockSession(matched);
      this.seedMockDatabase(matched.id);
      return { user: matched, error: null };
    }
  }

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      this.setMockSession(null);
    }
  }

  async signInWithGoogle(): Promise<{ user: DBUser | null; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        // The callback/redirect will authenticate the session.
        return { user: null, error: null };
      } catch (e: any) {
        return { user: null, error: new Error(e.message || 'Google Auth failed') };
      }
    } else {
      // Mock Google Login
      const users = this.getStorage<DBUser[]>('users_list', []);
      const googleUser: DBUser = {
        id: 'usr-google',
        email: 'google-developer@mediaforge.io',
        full_name: 'Google Dev',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=google',
        created_at: new Date().toISOString()
      };
      if (!users.some(u => u.email === googleUser.email)) {
        this.setStorage('users_list', [...users, googleUser]);
      }
      this.setMockSession(googleUser);
      this.seedMockDatabase(googleUser.id);
      return { user: googleUser, error: null };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#update-password`,
        });
        if (error) throw error;
        // Also fire mock behavior in background so the console demonstrates it nicely
        return { success: true, error: null };
      } catch (e: any) {
        return { success: false, error: new Error(e.message || 'Reset password request failed') };
      }
    } else {
      console.log(`Mock password reset request triggered for address: ${email}`);
      return { success: true, error: null };
    }
  }

  async updatePassword(password: string): Promise<{ success: boolean; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return { success: true, error: null };
      } catch (e: any) {
        return { success: false, error: new Error(e.message || 'Update password failed') };
      }
    } else {
      console.log('Mock password update succeeded');
      return { success: true, error: null };
    }
  }

  async updateProfile(userId: string, fullName: string, avatarUrl: string): Promise<{ user: DBUser | null; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            avatar_url: avatarUrl
          }
        });
        if (authError) throw authError;

        // Optimistically attempt profile table modification
        try {
          await supabase
            .from('users')
            .update({
              full_name: fullName,
              avatar_url: avatarUrl
            })
            .eq('id', userId);
        } catch (dbErr) {
          console.warn('User profile table write failed (perhaps DB DDL not run yet):', dbErr);
        }

        const returnUser: DBUser = {
          id: userId,
          email: authData.user?.email || '',
          full_name: fullName,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString()
        };

        return { user: returnUser, error: null };
      } catch (e: any) {
        return { user: null, error: new Error(e.message || 'Error updating user profile') };
      }
    } else {
      const users = this.getStorage<DBUser[]>('users_list', []);
      const index = users.findIndex(u => u.id === userId);
      const updatedUser: DBUser = {
        id: userId,
        email: users[index]?.email || 'developer@mediaforge.io',
        full_name: fullName,
        avatar_url: avatarUrl,
        created_at: users[index]?.created_at || new Date().toISOString()
      };
      if (index !== -1) {
        users[index] = updatedUser;
        this.setStorage('users_list', users);
      } else {
        users.push(updatedUser);
        this.setStorage('users_list', users);
      }
      this.setMockSession(updatedUser);
      return { user: updatedUser, error: null };
    }
  }

  async getCurrentUser(): Promise<DBUser | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Select public profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`,
        created_at: profile?.created_at || user.created_at || new Date().toISOString()
      };
    } else {
      return this.getMockSession().user;
    }
  }

  /**
   * PROJECTS API LAYER
   */
  async getProjects(userId: string): Promise<DBProject[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Projects fetch error:', error);
        return [];
      }
      return data || [];
    } else {
      const all = this.getStorage<DBProject[]>('projects', []);
      return all.filter(p => p.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }

  async createProject(userId: string, name: string, description: string): Promise<DBProject | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name,
          description,
          status: 'Active'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Project creation error:', error);
        return null;
      }
      return data;
    } else {
      const all = this.getStorage<DBProject[]>('projects', []);
      const newProj: DBProject = {
        id: 'proj-' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        name,
        description,
        status: 'Active',
        created_at: new Date().toISOString()
      };
      this.setStorage('projects', [newProj, ...all]);
      return newProj;
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      return !error;
    } else {
      const all = this.getStorage<DBProject[]>('projects', []);
      const filtered = all.filter(p => p.id !== projectId);
      this.setStorage('projects', filtered);
      
      // Cascade delete jobs
      const jobs = this.getStorage<DBJob[]>('jobs', []);
      this.setStorage('jobs', jobs.filter(j => j.project_id !== projectId));
      return true;
    }
  }

  async updateProject(projectId: string, updates: Partial<DBProject>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
      return !error;
    } else {
      const all = this.getStorage<DBProject[]>('projects', []);
      const updated = all.map(p => p.id === projectId ? { ...p, ...updates } : p);
      this.setStorage('projects', updated);
      return true;
    }
  }

  /**
   * PROCESSING JOBS API LAYER
   */
  async getJobs(userId: string): Promise<DBJob[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Jobs fetch error:', error);
        return [];
      }
      return data || [];
    } else {
      const all = this.getStorage<DBJob[]>('jobs', []);
      return all.filter(j => j.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }

  async createJob(userId: string, projectId: string, name: string, type: string): Promise<DBJob | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: userId,
          project_id: projectId,
          name,
          type,
          status: 'Pending',
          progress: 0,
          duration: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error('Job creation error:', error);
        return null;
      }
      return data;
    } else {
      const all = this.getStorage<DBJob[]>('jobs', []);
      const newJob: DBJob = {
        id: 'job-' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        project_id: projectId,
        name,
        type,
        status: 'Pending',
        progress: 0,
        duration: Math.floor(Math.random() * 150) + 10,
        created_at: new Date().toISOString()
      };
      this.setStorage('jobs', [newJob, ...all]);

      // Trigger automatic increment to active jobs inside mock profile
      const billings = this.getStorage<DBBilling[]>('billing', []);
      const updatedBillings = billings.map(b => b.user_id === userId ? { ...b, usage_jobs_count: b.usage_jobs_count + 1 } : b);
      this.setStorage('billing', updatedBillings);

      return newJob;
    }
  }

  async deleteJob(jobId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      return !error;
    } else {
      const all = this.getStorage<DBJob[]>('jobs', []);
      this.setStorage('jobs', all.filter(j => j.id !== jobId));
      return true;
    }
  }

  async updateJob(jobId: string, updates: Partial<DBJob>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId);
      return !error;
    } else {
      const all = this.getStorage<DBJob[]>('jobs', []);
      const updated = all.map(j => j.id === jobId ? { ...j, ...updates } : j);
      this.setStorage('jobs', updated);
      return true;
    }
  }

  /**
   * API KEYS MANAGEMENT LAYER
   */
  async getAPIKeys(userId: string): Promise<DBAPIKey[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('API keys fetch error:', error);
        return [];
      }
      return data || [];
    } else {
      const all = this.getStorage<DBAPIKey[]>('api_keys', []);
      return all.filter(k => k.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }

  async generateAPIKey(userId: string, name: string): Promise<DBAPIKey | null> {
    const rawEntropy = Array.from({ length: 4 }, () => Math.floor(Math.random() * 0xffffffff));
    const tokenHash = rawEntropy.map(dec => dec.toString(16).padStart(8, '0')).join('');
    const fullToken = `mf_live_${tokenHash.substring(0, 24)}`;
    const hint = `mf_live_${tokenHash.substring(0, 4)}...${tokenHash.substring(20, 24)}`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key_hint: hint,
          token: fullToken,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.error('API key insertion error:', error);
        return null;
      }
      return data;
    } else {
      const all = this.getStorage<DBAPIKey[]>('api_keys', []);
      const newKey: DBAPIKey = {
        id: 'key-' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        name,
        key_hint: hint,
        token: fullToken,
        status: 'active',
        last_used_at: null,
        created_at: new Date().toISOString()
      };
      this.setStorage('api_keys', [newKey, ...all]);
      return newKey;
    }
  }

  async revokeAPIKey(keyId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId);
      return !error;
    } else {
      const all = this.getStorage<DBAPIKey[]>('api_keys', []);
      const updated = all.map(k => k.id === keyId ? { ...k, status: 'revoked' as const } : k);
      this.setStorage('api_keys', updated);
      return true;
    }
  }

  /**
   * BILLING API LAYER
   */
  async getBilling(userId: string): Promise<DBBilling | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('billing')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Billing fetch error:', error);
        return null;
      }
      
      if (!data) {
        // Create standard billing tier if somehow missing
        const { data: created } = await supabase
          .from('billing')
          .insert({
            user_id: userId,
            plan: 'Free',
            status: 'active',
            usage_jobs_count: 0,
            usage_jobs_limit: 100
          })
          .select()
          .single();
        return created;
      }
      return data;
    } else {
      const all = this.getStorage<DBBilling[]>('billing', []);
      const matched = all.find(b => b.user_id === userId);
      if (matched) return matched;

      const newBilling: DBBilling = {
        id: 'bill-' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        plan: 'Free',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        usage_jobs_count: 0,
        usage_jobs_limit: 100,
        created_at: new Date().toISOString()
      };
      this.setStorage('billing', [...all, newBilling]);
      return newBilling;
    }
  }

  async updateBillingPlan(userId: string, plan: 'Free' | 'Pro' | 'Enterprise'): Promise<DBBilling | null> {
    const limits = {
      Free: 100,
      Pro: 1500,
      Enterprise: 100000
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('billing')
        .update({
          plan,
          usage_jobs_limit: limits[plan]
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Billing update error:', error);
        return null;
      }
      return data;
    } else {
      const all = this.getStorage<DBBilling[]>('billing', []);
      const matched = all.find(b => b.user_id === userId);
      
      const updatedBilling: DBBilling = matched 
        ? { ...matched, plan, usage_jobs_limit: limits[plan] }
        : {
            id: 'bill-' + Math.random().toString(36).substring(2, 6),
            user_id: userId,
            plan,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            usage_jobs_count: 0,
            usage_jobs_limit: limits[plan],
            created_at: new Date().toISOString()
          };

      const rest = all.filter(b => b.user_id !== userId);
      this.setStorage('billing', [...rest, updatedBilling]);
      return updatedBilling;
    }
  }

  async uploadFile(userId: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop() || 'mp4';
      const fileName = `${userId}/${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
      
      if (onProgress) onProgress(10);
      const { data, error } = await supabase.storage
         .from('videos')
         .upload(fileName, file, {
           cacheControl: '365000',
           upsert: true
         });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(error.message || 'Storage uploading failed. Please make sure the "videos" bucket exists in your Supabase storage tab.');
      }

      if (onProgress) onProgress(100);
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      return publicUrl;
    } else {
      return new Promise((resolve) => {
        let pct = 0;
        const interval = setInterval(() => {
          pct += 20;
          if (onProgress) onProgress(Math.min(pct, 100));
          if (pct >= 100) {
            clearInterval(interval);
            const simulatedUrl = URL.createObjectURL(file);
            resolve(simulatedUrl);
          }
        }, 120);
      });
    }
  }

  // --- DATA LABELING CORE WORKSPACE OPERATIONS ---

  async getDatasets(userId: string): Promise<DBDataset[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('datasets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase datasets table error, falling back to LocalStorage:', err);
      }
    }
    
    const datasets = this.getStorage<DBDataset[]>('datasets', []);
    // Initial Seed for nice demo out-of-the-box experience
    if (datasets.filter(d => d.user_id === userId).length === 0) {
      const initialSeed: DBDataset[] = [
        {
          id: 'ds-traffic',
          user_id: userId,
          name: 'Traffic Monitoring Suite',
          description: 'Autonomous vehicle object detection for car, pedestrians, and bicycle signals.',
          classes: ['Car', 'Pedestrian', 'Bicycle', 'Traffic Light', 'Stop Sign'],
          type: 'image',
          created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'ds-manufacturing',
          user_id: userId,
          name: 'Conveyor Quality Control',
          description: 'Defect labeling on conveyor production lines.',
          classes: ['Defect', 'Minor Scratch', 'Perfect Specimen'],
          type: 'video',
          created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ];
      this.setStorage('datasets', initialSeed);
      return initialSeed;
    }
    return datasets.filter(d => d.user_id === userId);
  }

  async createDataset(userId: string, name: string, description: string, classes: string[], type: 'image' | 'video'): Promise<DBDataset> {
    const newDataset: DBDataset = {
      id: 'ds-' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      name,
      description,
      classes,
      type,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('datasets')
          .insert(newDataset)
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.warn('Supabase insert dataset failed, falling back to LocalStorage:', err);
      }
    }

    const datasets = this.getStorage<DBDataset[]>('datasets', []);
    this.setStorage('datasets', [...datasets, newDataset]);
    return newDataset;
  }

  async deleteDataset(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('datasets')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete dataset failed, falling back to LocalStorage:', err);
      }
    }

    const datasets = this.getStorage<DBDataset[]>('datasets', []);
    this.setStorage('datasets', datasets.filter(d => d.id !== id));
    
    // Cascading deletions of items and annotations
    const items = this.getStorage<DBDatasetItem[]>('dataset_items', []);
    const deletedItemIds = items.filter(it => it.dataset_id === id).map(it => it.id);
    this.setStorage('dataset_items', items.filter(it => it.dataset_id !== id));

    const annotations = this.getStorage<DBAnnotation[]>('annotations', []);
    this.setStorage('annotations', annotations.filter(ann => !deletedItemIds.includes(ann.item_id)));

    return true;
  }

  async getDatasetItems(datasetId: string): Promise<DBDatasetItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('dataset_items')
          .select('*')
          .eq('dataset_id', datasetId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase dataset_items table query failed, falling back to LocalStorage:', err);
      }
    }

    const items = this.getStorage<DBDatasetItem[]>('dataset_items', []);
    // Seed initial dataset items if needed to look beautiful right away
    if (items.filter(it => it.dataset_id === datasetId).length === 0) {
      let seeds: DBDatasetItem[] = [];
      if (datasetId === 'ds-traffic') {
        seeds = [
          {
            id: 'item-traff-1',
            dataset_id: 'ds-traffic',
            name: 'intersection_busy_noon.jpg',
            url: 'https://images.unsplash.com/photo-1494783367193-14bc9b40fc80?w=1200&auto=format&fit=crop&q=80',
            type: 'image',
            created_at: new Date(Date.now() - 2.5 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: 'item-traff-2',
            dataset_id: 'ds-traffic',
            name: 'highway_high_density_pass.jpg',
            url: 'https://images.unsplash.com/photo-1542204172-e7052809a850?w=1200&auto=format&fit=crop&q=80',
            type: 'image',
            created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
          }
        ];
        
        // Let's seed starting annotations in localStorage too!
        const initialAnns = this.getStorage<DBAnnotation[]>('annotations', []);
        if (initialAnns.filter(a => a.item_id === 'item-traff-1').length === 0) {
          const seedsAnns: DBAnnotation[] = [
            {
              id: 'ann-1',
              item_id: 'item-traff-1',
              class_name: 'Car',
              type: 'bbox',
              coordinates: { x: 30, y: 40, width: 25, height: 22 },
              created_at: new Date().toISOString()
            },
            {
              id: 'ann-2',
              item_id: 'item-traff-1',
              class_name: 'Pedestrian',
              type: 'polygon',
              coordinates: [
                { x: 74, y: 55 },
                { x: 80, y: 55 },
                { x: 82, y: 80 },
                { x: 73, y: 80 }
              ],
              created_at: new Date().toISOString()
            },
            {
              id: 'ann-3',
              item_id: 'item-traff-1',
              class_name: 'Traffic Light',
              type: 'segmentation',
              coordinates: [
                { x: 55, y: 15 },
                { x: 59, y: 15 },
                { x: 59, y: 28 },
                { x: 55, y: 28 }
              ],
              created_at: new Date().toISOString()
            }
          ];
          this.setStorage('annotations', [...initialAnns, ...seedsAnns]);
        }
      } else if (datasetId === 'ds-manufacturing') {
        seeds = [
          {
            id: 'item-manu-1',
            dataset_id: 'ds-manufacturing',
            name: 'robotic_assembly_arm.mp4',
            url: 'https://assets.mixkit.co/videos/preview/mixkit-mechanical-arm-of-an-assembly-robot-43187-large.mp4',
            type: 'video',
            created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
          }
        ];
      }
      if (seeds.length > 0) {
        this.setStorage('dataset_items', [...items, ...seeds]);
        return seeds;
      }
    }

    return items.filter(it => it.dataset_id === datasetId);
  }

  async addDatasetItem(datasetId: string, name: string, url: string, type: 'image' | 'video'): Promise<DBDatasetItem> {
    const nextItem: DBDatasetItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 10),
      dataset_id: datasetId,
      name,
      url,
      type,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('dataset_items')
          .insert(nextItem)
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.warn('Supabase insert dataset item failed, falling back to LocalStorage:', err);
      }
    }

    const items = this.getStorage<DBDatasetItem[]>('dataset_items', []);
    this.setStorage('dataset_items', [...items, nextItem]);
    return nextItem;
  }

  async deleteDatasetItem(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('dataset_items')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete database item failed, falling back to LocalStorage:', err);
      }
    }

    const items = this.getStorage<DBDatasetItem[]>('dataset_items', []);
    this.setStorage('dataset_items', items.filter(it => it.id !== id));

    const annotations = this.getStorage<DBAnnotation[]>('annotations', []);
    this.setStorage('annotations', annotations.filter(ann => ann.item_id !== id));
    return true;
  }

  async getItemAnnotations(itemId: string): Promise<DBAnnotation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('annotations')
          .select('*')
          .eq('item_id', itemId);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase annotations query failed, falling back to LocalStorage:', err);
      }
    }

    const annotations = this.getStorage<DBAnnotation[]>('annotations', []);
    return annotations.filter(ann => ann.item_id === itemId);
  }

  async saveItemAnnotations(itemId: string, annotations: DBAnnotation[]): Promise<DBAnnotation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Delete original annotations and write new set
        await supabase.from('annotations').delete().eq('item_id', itemId);
        if (annotations.length > 0) {
          const { data, error } = await supabase
            .from('annotations')
            .insert(annotations)
            .select();
          if (error) throw error;
          return data || [];
        }
        return [];
      } catch (err) {
        console.warn('Supabase save annotations replacement failed, falling back to LocalStorage:', err);
      }
    }

    const allAnnotations = this.getStorage<DBAnnotation[]>('annotations', []);
    const filtered = allAnnotations.filter(ann => ann.item_id !== itemId);
    const updated = [...filtered, ...annotations];
    this.setStorage('annotations', updated);
    return annotations;
  }
}

export const db = new DatabaseService();
