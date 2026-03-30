import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { authClient } from '../lib/auth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Plus, Trash2, Globe, Key, Save } from 'lucide-react';

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: '/login' });
  },
  component: SettingsPage,
});

const MODELS = {
  openai: [
    "gpt-5", "gpt-5-pro", "gpt-5-mini", 
    "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
    "gpt-image-1", "sora", "whisper",
    "gpt-oss-120b", "gpt-oss-20b",
    "gpt-4o", "gpt-4o-mini", "o3-mini"
  ],
  anthropic: [
    "claude-4.6-opus", "claude-4.6-sonnet",
    "claude-4.5-opus", "claude-4.5-sonnet", "claude-4.5-haiku",
    "claude-3-7-sonnet-latest", "claude-3-5-sonnet-latest"
  ],
  gemini: [
    "gemini-3.1-pro", "gemini-3-deep-think", "gemini-3-flash", "gemini-3-pro",
    "gemini-2.0-flash", "gemini-1.5-pro"
  ]
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleProvider, setNewRuleProvider] = useState('openai');

  // Provider config form state
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS.gemini[0]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['gateway-settings'],
    queryFn: async () => {
      // @ts-ignore
      const res = await client.api.settings.$get();
      return res.json();
    }
  });

  // Sync local state when settings load or provider changes
  useEffect(() => {
    if (settings?.providerConfigs?.[activeProvider]?.model) {
      setSelectedModel(settings.providerConfigs[activeProvider].model);
    } else {
      setSelectedModel(MODELS[activeProvider as keyof typeof MODELS][0]);
    }
  }, [settings, activeProvider]);

  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      // @ts-ignore
      await client.api.settings.$post({ json: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-settings'] });
      setApiKey(''); // Clear on success
      alert("Settings synchronized successfully.");
    }
  });

  const handleSaveProvider = () => {
    const currentConfigs = settings?.providerConfigs || {};
    updateSettings.mutate({
      providerConfigs: {
        ...currentConfigs,
        [activeProvider]: {
          model: selectedModel,
          apiKey: apiKey || "••••••••••••••••"
        }
      }
    });
  };

  const handleAddRule = () => {
    if (!newRulePattern) return;
    const currentRules = settings?.routingRules || {};
    updateSettings.mutate({
      routingRules: {
        ...currentRules,
        [newRulePattern]: newRuleProvider
      }
    });
    setNewRulePattern('');
  };

  const handleRemoveRule = (pattern: string) => {
    const currentRules = { ...settings?.routingRules };
    delete currentRules[pattern];
    updateSettings.mutate({ routingRules: currentRules });
  };

  if (isLoading) return <div className="p-20 text-center text-muted-foreground uppercase font-label tracking-widest text-xs">Loading_System_Configuration...</div>;

  return (
    <main className="p-8 pb-32 max-w-7xl mx-auto space-y-10 w-full">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1 font-bold">SYSTEM_ORCHESTRATION</span>
            <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-white mb-2 uppercase">GATEWAY_SETTINGS</h1>
            <p className="text-on-surface-variant font-body text-sm max-w-xl italic opacity-80 font-medium">Configure secure multi-provider routing, failover resiliency, and encrypted credential storage.</p>
          </div>
        </div>
      </header>

      {/* COMPREHENSIVE PROVIDER SECTION */}
      <section className="bg-surface-container-low border-l-2 border-primary rounded-lg shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-black/10">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tight text-white uppercase font-headline">Secure_Provider_Nodes</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-medium">Add and encrypt API keys for each downstream LLM provider. Keys are stored with AES-256-GCM encryption.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-white/5">
          {/* 1. Select Provider */}
          <div className="p-8 space-y-6">
            <label className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest block">1. Target_Provider</label>
            <div className="grid grid-cols-1 gap-2">
              {['gemini', 'openai', 'anthropic'].map(p => (
                <button 
                  key={p}
                  onClick={() => {
                    setActiveProvider(p);
                  }}
                  className={`p-4 rounded-xl border transition-all text-left group ${activeProvider === p ? 'bg-primary border-primary text-black' : 'bg-surface-container-lowest border-white/5 text-neutral-400 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase tracking-tight">{p}</span>
                    {settings?.providerConfigs?.[p] && (
                      <div className={`w-1.5 h-1.5 rounded-full ${activeProvider === p ? 'bg-black' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Configure Model & Key */}
          <div className="col-span-2 p-8 space-y-8 bg-black/5">
            <label className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest block">2. Node_Configuration ({activeProvider.toUpperCase()})</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <span className="text-[0.6rem] font-bold text-neutral-600 uppercase tracking-widest block ml-1">Default_Model</span>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 p-4 rounded-xl text-white outline-none focus:border-white/40 font-mono text-xs uppercase"
                >
                  {MODELS[activeProvider as keyof typeof MODELS].map(m => (
                    <option key={m} value={m}>{m.replace(/-/g, '_')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[0.6rem] font-bold text-neutral-600 uppercase tracking-widest block ml-1">Secure_API_Key</span>
                <div className="relative">
                  <input 
                    type="password"
                    placeholder={settings?.providerConfigs?.[activeProvider] ? "••••••••••••••••" : "PASTE_KEY_HERE"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-white/10 p-4 rounded-xl text-white outline-none focus:border-white/40 font-mono text-xs"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ShieldCheck className={`w-4 h-4 ${settings?.providerConfigs?.[activeProvider] ? 'text-primary' : 'text-neutral-700'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveProvider}
                disabled={updateSettings.isPending || (!apiKey && !settings?.providerConfigs?.[activeProvider])}
                className="bg-primary text-on-primary px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-200 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-30"
              >
                {updateSettings.isPending ? 'ENCRYPTING...' : <><Save className="w-4 h-4" /> <span>Sync_Node_State</span></>}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Routing Section */}
        <section className="bg-surface-container-low p-8 border-l-2 border-outline-variant rounded-lg shadow-2xl space-y-8">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tight text-white uppercase font-headline">Failover_Resiliency</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest">Global_Default_Provider</label>
              <select 
                value={settings?.defaultProvider}
                onChange={(e) => updateSettings.mutate({ defaultProvider: e.target.value })}
                className="w-full bg-surface-container-lowest border border-white/10 p-4 rounded-xl text-white outline-none focus:border-white/40 font-mono text-xs uppercase"
              >
                <option value="gemini">GOOGLE_GEMINI</option>
                <option value="openai">OPENAI</option>
                <option value="anthropic">ANTHROPIC</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest">Active_Failover_Strategy</label>
              <select 
                value={settings?.fallbackProvider}
                onChange={(e) => updateSettings.mutate({ fallbackProvider: e.target.value })}
                className="w-full bg-surface-container-lowest border border-white/10 p-4 rounded-xl text-white outline-none focus:border-white/40 font-mono text-xs uppercase"
              >
                <option value="openai">OPENAI_AUTOSCALE</option>
                <option value="gemini">GOOGLE_GEMINI_REDUNDANCY</option>
                <option value="anthropic">ANTHROPIC_SAFE_FAIL</option>
              </select>
            </div>
          </div>
        </section>

        {/* Custom Rules */}
        <section className="bg-surface-container-low p-8 border-l-2 border-outline-variant rounded-lg shadow-2xl space-y-8">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tight text-white uppercase font-headline">Heuristic_Routing</h3>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-surface-container-lowest border border-white/5 rounded-xl">
              <input 
                type="text"
                placeholder="MODEL_PREFIX (E.G. GPT-)"
                value={newRulePattern}
                onChange={(e) => setNewRulePattern(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent border-none p-3 text-white outline-none font-mono text-xs"
              />
              <select 
                value={newRuleProvider}
                onChange={(e) => setNewRuleProvider(e.target.value)}
                className="bg-surface-container-high border-none p-3 rounded-lg text-white outline-none font-mono text-xs"
              >
                <option value="openai">OPENAI</option>
                <option value="anthropic">ANTHROPIC</option>
                <option value="gemini">GEMINI</option>
              </select>
              <button 
                onClick={handleAddRule}
                disabled={!newRulePattern}
                className="p-3 bg-primary text-on-primary rounded-lg hover:bg-neutral-200 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5 font-black" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {Object.entries(settings?.routingRules || {}).map(([pattern, provider]: [string, any]) => (
                  <motion.div 
                    key={pattern}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-4 bg-surface-container-lowest border border-white/5 rounded-lg group hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[0.6rem] font-black px-2 py-1 bg-white text-black rounded-sm uppercase tracking-widest">{provider}</span>
                      <span className="font-mono text-[0.7rem] text-white opacity-80 font-bold tracking-tight">MATCH("{pattern}")</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveRule(pattern)}
                      className="p-2 text-neutral-600 hover:text-error transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-12 bg-surface-container-lowest p-6 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse"></span>
          <span className="font-label text-[0.65rem] text-white uppercase tracking-widest font-black tracking-[0.2em]">Cluster_Sync_Telemetry</span>
        </div>
        <div className="space-y-1 font-mono text-[0.65rem] text-neutral-500 uppercase leading-relaxed italic">
          <div className="flex gap-4"><span className="text-white opacity-40">STATE</span> Provider configurations migrated to encrypted database store.</div>
          <div className="flex gap-4"><span className="text-white opacity-40">READY</span> Dynamic model routing heuristics synchronized.</div>
        </div>
      </footer>
    </main>
  );
}
