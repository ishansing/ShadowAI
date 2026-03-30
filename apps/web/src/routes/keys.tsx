import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { client } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/keys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const [keyName, setKeyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await client.api.keys.$get();
      return res.json();
    }
  });

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.api.logs.$get();
      return res.json();
    }
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const res = await client.api.keys.$post({ json: { name } });
      return res.json();
    },
    onSuccess: () => {
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.keys[':id'].$delete({ param: { id } });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const filteredKeys = useMemo(() => {
    return keys?.filter((k: any) => 
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      k.key.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [keys, searchQuery]);

  const exportMetrics = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ keys, logs_summary: (logs as any)?.pagination?.total || 0 }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "shadow_api_keys_metrics.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const totalVolume = (logs as any)?.pagination?.total || (logs as any)?.data?.length || 0;
  const totalInterceptions = (logs as any)?.data?.filter((l: any) => l.wasRedacted).length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 w-full">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[0.6875rem] font-label text-neutral-500 uppercase tracking-widest">Authentication</span>
            <div className="h-px w-8 bg-neutral-800"></div>
          </div>
          <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-white">VIRTUAL_KEYS</h1>
          <p className="text-sm text-on-surface-variant max-w-md font-body leading-relaxed">
            Manage granular access tokens for proxying LLM requests. Use these keys to enforce rate limits and DLP policies at the edge.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportMetrics}
            className="px-6 py-3 border border-outline-variant/30 text-primary font-label text-[0.7rem] font-bold tracking-widest hover:bg-surface-container-high transition-all uppercase"
          >
            EXPORT_METRICS
          </button>
        </div>
      </section>

      {/* Usage Overview Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 flex flex-col justify-between h-40 group hover:bg-[#201f1f] transition-colors border border-white/5">
          <span className="text-[0.6rem] font-label text-neutral-500 tracking-[0.3em] uppercase font-bold">Total Active Keys</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-headline font-black text-white">{keys?.length || 0}</span>
            <span className="text-[0.6rem] font-label text-white/40 tracking-widest">/ 50 LIMIT</span>
          </div>
          <div className="w-full bg-surface-container-lowest h-1">
            <div className="bg-primary h-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ width: `${((keys?.length || 0) / 50) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 flex flex-col justify-between h-40 group hover:bg-[#201f1f] transition-colors border border-white/5">
          <span className="text-[0.6rem] font-label text-neutral-500 tracking-[0.3em] uppercase font-bold">Request Volume</span>
          <span className="text-4xl font-headline font-black text-white">{totalVolume}</span>
          <div className="flex gap-1 items-end h-8">
            {[2, 6, 3, 8, 5, 3].map((h, i) => (
              <div key={i} className={`w-2 bg-neutral-800 h-${h} group-hover:bg-primary/40 transition-all`}></div>
            ))}
            <div className="w-2 bg-primary h-8 shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 flex flex-col justify-between h-40 group hover:bg-[#201f1f] transition-colors border border-white/5">
          <span className="text-[0.6rem] font-label text-neutral-500 tracking-[0.3em] uppercase font-bold">DLP Interceptions</span>
          <span className="text-4xl font-headline font-black text-white">{totalInterceptions}</span>
          <span className="text-[0.6rem] font-label text-error tracking-widest uppercase font-bold">PROACTIVE_PROTECTION_ACTIVE</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
          <input 
            type="text" 
            placeholder="SEARCH_BY_NAME_OR_KEY_HEX..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest text-white pl-12 pr-4 py-4 font-label text-sm border border-white/10 outline-none focus:border-white/40 placeholder:text-outline/50 rounded-lg"
          />
        </div>
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="NEW_IDENTITY_NAME..." 
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            className="flex-1 bg-surface-container-lowest text-white px-4 py-4 font-label text-sm border border-white/10 outline-none focus:border-white/40 placeholder:text-outline/50 rounded-lg"
          />
          <button 
            onClick={() => createKey.mutate(keyName)}
            disabled={!keyName || createKey.isPending}
            className="bg-gradient-to-br from-white to-[#d4d4d4] text-on-primary py-4 px-8 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100 disabled:opacity-50 font-bold uppercase tracking-widest text-xs"
          >
            {createKey.isPending ? 'GENERATING...' : 'GENERATE_KEY'}
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">MANAGED_IDENTITIES</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredKeys.map((key: any) => (
              <motion.div 
                key={key.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-low p-5 relative overflow-hidden group border-l-2 border-primary hover:bg-[#201f1f] transition-colors rounded-lg border border-white/5"
              >
                <div className="mb-4">
                  <h3 className="font-headline text-lg font-bold text-primary mb-1">{key.name}</h3>
                  <div className="flex items-center gap-2">
                    <code className="font-label text-[11px] bg-surface-container-lowest border border-white/5 px-2 py-1 text-on-surface-variant rounded">{key.key}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(key.key);
                        alert("Key copied to clipboard");
                      }} 
                      className="material-symbols-outlined text-[14px] text-outline cursor-pointer hover:text-white transition-colors"
                    >
                      content_copy
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
                      <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">ACTIVE_NODE</span>
                    </div>
                    <div className="font-label text-[10px] text-on-surface-variant uppercase font-medium">CREATED: {new Date(key.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="font-label text-[10px] text-on-surface-variant mb-1 uppercase tracking-tighter">NODE_TRAFFIC</div>
                      <div className="flex gap-0.5 items-end h-6">
                        <div className="w-1 bg-outline-variant h-2"></div>
                        <div className="w-1 bg-outline-variant h-3"></div>
                        <div className="w-1 bg-primary h-5 shadow-[0_0_5px_rgba(255,255,255,0.2)]"></div>
                        <div className="w-1 bg-primary h-6 shadow-[0_0_5px_rgba(255,255,255,0.2)]"></div>
                        <div className="w-1 bg-outline-variant h-4"></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm("Are you sure? This will immediately terminate all sessions using this key.")) {
                          revokeKey.mutate(key.id);
                        }
                      }}
                      disabled={revokeKey.isPending}
                      className="p-3 rounded-lg bg-error-container/10 text-error hover:bg-error-container/20 transition-all opacity-0 group-hover:opacity-100 border border-error/10 disabled:opacity-50"
                      title="Revoke Key"
                    >
                      <span className="material-symbols-outlined">delete_forever</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!isLoading && filteredKeys.length === 0 && (
            <div className="p-20 text-center border border-dashed border-white/10 rounded-lg">
              <span className="font-label text-sm text-neutral-600 uppercase tracking-[0.2em]">No identities found</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
