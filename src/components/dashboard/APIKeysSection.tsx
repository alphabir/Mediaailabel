import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Plus, Trash2, Shield, Eye, EyeOff, Clipboard, Check, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db, DBAPIKey } from '../../lib/supabaseClient';

interface APIKeysSectionProps {
  userId: string;
}

export default function APIKeysSection({ userId }: APIKeysSectionProps) {
  const [keys, setKeys] = useState<DBAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [latestCreatedToken, setLatestCreatedToken] = useState<string | null>(null);
  
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchKeys = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const all = await db.getAPIKeys(userId);
      setKeys(all);
    } catch {
      setErrorMessage('Could not load secure keys archive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchKeys();
    }
  }, [userId]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setErrorMessage('');
    setSuccessMessage('');
    setLatestCreatedToken(null);
    
    try {
      const created = await db.generateAPIKey(userId, keyName);
      if (created) {
        setKeys([created, ...keys]);
        setKeyName('');
        setLatestCreatedToken(created.token); // Display actual token ONLY once on creation!
        setSuccessMessage('Secure API key generated successfully!');
        
        // Hide key info notification banner after 10s
        setTimeout(() => setSuccessMessage(''), 8000);
      } else {
        setErrorMessage('Failed to archive secure token in database.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred generating encryption token.');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you serious? Revoking this API key immediately invalidates its associated bearer token from all processing request nodes! This action cannot be undone.')) return;

    try {
      const ok = await db.revokeAPIKey(id);
      if (ok) {
        setKeys(keys.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
        setSuccessMessage('Key credentials successfully revoked.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Database rejected key revocation request.');
      }
    } catch {
      setErrorMessage('Connection breakdown during revocation.');
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Key className="h-5 w-5 text-purple-400" />
            <span>API Token Management</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Generate and authorize cryptographic bearer API credentials to execute jobs programmatically.
          </p>
        </div>

        <button
          onClick={fetchKeys}
          className="flex items-center justify-center p-2 rounded-lg border border-purple-950/40 bg-slate-900/60 text-slate-400 hover:text-white transition"
          title="Refresh secure tokens list"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
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

      {/* Actual Created Key Modal Accent - MUST BE VISIBLE EXACTLY ONCE */}
      {latestCreatedToken && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 font-mono text-slate-100 space-y-3 shadow-2xl relative"
        >
          <div className="absolute top-2 right-2">
            <button 
              onClick={() => setLatestCreatedToken(null)}
              className="text-xxs border border-purple-904/30 px-2 py-0.5 rounded text-slate-400 hover:text-white"
            >
              Clear Notice
            </button>
          </div>

          <div className="flex items-center space-x-2 text-indigo-400">
            <Shield className="h-4.5 w-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-widest">Immediate Secret Credentials Reveal</h4>
          </div>

          <p className="text-[10px] text-slate-400">
            Copy this token now! Out of security measures, Supabase will hash this value. You will NOT be able to view it again after closing this panel.
          </p>

          <div className="flex items-center space-x-2 bg-slate-950/60 border border-purple-950/30 rounded-lg p-2.5">
            <input
              type="text"
              readOnly
              value={latestCreatedToken}
              className="flex-grow bg-transparent text-xxs text-slate-205 focus:outline-none select-all font-bold tracking-tight"
            />
            
            <button
              onClick={() => handleCopyToClipboard(latestCreatedToken, 'generated-new')}
              className="p-2 ml-2 rounded bg-purple-900/30 text-purple-305 border border-purple-800/10 hover:bg-purple-800/40 transition flex items-center space-x-1"
            >
              {copiedKeyId === 'generated-new' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Clipboard className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Copy secret</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Provision Form */}
        <div className="lg:col-span-5 bg-slate-900/40 p-5 rounded-xl border border-purple-950/30 font-mono flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-305 uppercase tracking-widest flex items-center space-x-1.5">
              <Plus className="h-4 w-4 text-purple-400" />
              <span>Provision API Bearer</span>
            </h3>

            <p className="text-xxs text-slate-450 leading-relaxed">
              Create a designated token scope. Give your key a distinctive label to trace usage triggers nicely from request log diagnostics.
            </p>

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div className="space-y-1.5 text-xxs">
                <label className="block text-slate-300 font-bold uppercase">Token Name / Label</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="E.g. Lambda Deployment Gateway"
                  required
                  className="w-full bg-slate-950 border border-purple-950/35 text-xs rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-600 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 py-3 text-xxs font-bold uppercase tracking-wider text-white hover:opacity-90 transition"
              >
                <span>Instantiate Key Row</span>
              </button>
            </form>
          </div>
        </div>

        {/* Existing Keys Table */}
        <div className="lg:col-span-7 bg-slate-900/20 p-5 rounded-xl border border-purple-950/20 font-mono">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5 mb-4">
            <Shield className="h-4 w-4 text-purple-450" />
            <span>Authorized Key Vault</span>
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="h-5.5 w-5.5 border-2 border-purple-650 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xxs text-slate-505">Verifying credentials against auth database...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-purple-950/15 bg-slate-950/10 rounded-lg">
              <Key className="h-6 w-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xxs text-slate-500">No active keys deployed in this sandbox.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div 
                  key={key.id}
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                    key.status === 'revoked' 
                      ? 'border-purple-950/10 bg-slate-950/20 opacity-55' 
                      : 'border-purple-950/25 bg-slate-950/40 hover:border-purple-900/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">{key.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        key.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/10'
                      }`}>
                        {key.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xxs">
                      <span className="text-slate-500 font-mono tracking-tight">{key.key_hint}</span>
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleCopyToClipboard(key.token || key.key_hint, key.id)}
                          className="hover:text-purple-400 text-slate-500 transition"
                          title="Copy active token identifier"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="h-3 w-3 text-emerald-405 animate-scale-up" />
                          ) : (
                            <Clipboard className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-600 font-mono">
                      Generated: {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {key.status === 'active' && (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="text-[10px] px-2.5 py-1 text-slate-500 hover:text-red-400 border border-purple-950/20 rounded hover:border-red-900/30 hover:bg-red-950/10 transition font-bold uppercase tracking-wide flex-shrink-0"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
