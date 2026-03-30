import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { authClient } from '../lib/auth';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Server, Plus, Trash2, Globe } from 'lucide-react';

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: '/login' });
  },
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleProvider, setNewRuleProvider] = useState('openai');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['gateway-settings'],
    queryFn: async () => {
      const res = await client.api.settings.$get();
      return res.json();
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      await client.api.settings.$post({ json: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-settings'] });
    }
  });

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
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">SYSTEM_ORCHESTRATION</span>
            <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-white mb-2 uppercase">GATEWAY_SETTINGS</h1>
            <p className="text-on-surface-variant font-body text-sm max-w-xl">Configure multi-provider routing, failover resiliency, and global model defaults for the edge proxy nodes.</p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-surface-container-low px-4 py-2 border border-outline-variant/20 rounded">
              <span className="font-label text-[0.6rem] text-neutral-500 block uppercase font-bold tracking-tighter">Active_Rules</span>
              <span className="mono-data text-xl font-bold text-white tracking-tighter">{Object.keys(settings?.routingRules || {}).length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Provider Defaults */}
        <section className="bg-surface-container-low p-8 border-l-2 border-primary rounded-lg shadow-2xl space-y-8">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tighter text-white uppercase font-headline">Provider_Defaults</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest">Primary_Provider_Node</label>
              <div className="relative">
                <select 
                  value={settings?.defaultProvider}
                  onChange={(e) => updateSettings.mutate({ defaultProvider: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-white/10 p-4 rounded-lg text-white appearance-none focus:border-white/40 outline-none font-mono text-sm tracking-tight cursor-pointer"
                >
                  <option value="gemini">GOOGLE_GEMINI_2.5_FLASH</option>
                  <option value="openai">OPENAI_GPT_4O</option>
                  <option value="anthropic">ANTHROPIC_CLAUDE_3.5_SONNET</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <span className="material-symbols-outlined text-sm">unfold_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-widest">Failover_Resiliency_Node</label>
              <div className="relative">
                <select 
                  value={settings?.fallbackProvider}
                  onChange={(e) => updateSettings.mutate({ fallbackProvider: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-white/10 p-4 rounded-lg text-white appearance-none focus:border-white/40 outline-none font-mono text-sm tracking-tight cursor-pointer"
                >
                  <option value="openai">OPENAI_GPT_4O_MINI</option>
                  <option value="gemini">GOOGLE_GEMINI_1.5_FLASH</option>
                  <option value="anthropic">ANTHROPIC_CLAUDE_3_HAIKU</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <span className="material-symbols-outlined text-sm">unfold_more</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-surface-container-lowest rounded-lg border border-white/5 flex items-start gap-4 shadow-inner">
            <div className="p-2 rounded bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed italic font-medium">
              Dynamic failover is active. If the primary provider returns a 4xx/5xx status, the gateway will automatically reroute to the failover node within 200ms.
            </p>
          </div>
        </section>

        {/* Custom Routing Rules */}
        <section className="bg-surface-container-low p-8 border-l-2 border-outline-variant rounded-lg shadow-2xl space-y-8">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tighter text-white uppercase font-headline">Routing_Rules</h3>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-surface-container-lowest border border-white/5 rounded-xl shadow-inner">
              <input 
                type="text"
                placeholder="MODEL_PREFIX (E.G. CLAUDE-)"
                value={newRulePattern}
                onChange={(e) => setNewRulePattern(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent border-none p-3 text-white outline-none font-mono text-xs placeholder:text-neutral-700"
              />
              <select 
                value={newRuleProvider}
                onChange={(e) => setNewRuleProvider(e.target.value)}
                className="bg-surface-container-high border-none p-3 rounded-lg text-white outline-none font-mono text-xs cursor-pointer"
              >
                <option value="openai">OPENAI</option>
                <option value="anthropic">ANTHROPIC</option>
                <option value="gemini">GEMINI</option>
              </select>
              <button 
                onClick={handleAddRule}
                disabled={!newRulePattern}
                className="p-3 bg-primary text-on-primary rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-30 disabled:grayscale active:scale-95"
              >
                <Plus className="w-5 h-5 font-black" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-60 hide-scrollbar pr-2">
              <AnimatePresence mode="popLayout">
                {Object.entries(settings?.routingRules || {}).map(([pattern, provider]: [string, any]) => (
                  <motion.div 
                    key={pattern}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-4 bg-surface-container-lowest border border-white/5 rounded-lg group hover:border-white/20 transition-all shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[0.6rem] font-black px-2 py-1 bg-white text-black rounded-sm uppercase tracking-widest">{provider}</span>
                      <span className="font-mono text-[0.7rem] text-white opacity-80 font-bold tracking-tight">CONTAINS("{pattern}")</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveRule(pattern)}
                      className="p-2 text-neutral-600 hover:text-error hover:bg-error/10 rounded-md transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-error/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {Object.keys(settings?.routingRules || {}).length === 0 && (
                <div className="p-12 text-center border border-dashed border-white/5 rounded-lg bg-black/10">
                  <p className="text-[0.65rem] text-neutral-600 uppercase tracking-[0.3em] font-black font-label opacity-50 italic">No_Custom_Heuristics_Active</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-12 bg-surface-container-lowest p-6 border border-white/5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse"></span>
          <span className="font-label text-[0.65rem] text-white uppercase tracking-widest font-black">Cluster_Configuration_Stream</span>
        </div>
        <div className="space-y-1 font-mono text-[0.65rem] text-neutral-500 uppercase leading-relaxed italic">
          <div className="flex gap-4"><span className="text-white opacity-40">SYSTEM</span> Load balancer weightings synchronized across proxy nodes.</div>
          <div className="flex gap-4"><span className="text-white opacity-40">READY</span> Dynamic failover heartbeat verified for all primary providers.</div>
        </div>
      </footer>
    </main>
  );
}
