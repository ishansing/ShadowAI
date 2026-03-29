import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { client } from '../lib/api';

export const Route = createFileRoute('/keys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const [keyName, setKeyName] = useState('');
  const queryClient = useQueryClient();

  const { data: keys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await client.api.keys.$get();
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
      </section>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="KEY_NAME_E.G._PROD_APP" 
          value={keyName}
          onChange={e => setKeyName(e.target.value)}
          className="flex-1 bg-surface-container-lowest text-white px-4 py-4 font-label text-sm border border-white/10 outline-none focus:border-white/40 placeholder:text-outline/50"
        />
        <button 
          onClick={() => createKey.mutate(keyName)}
          disabled={!keyName || createKey.isPending}
          className="bg-gradient-to-br from-white to-[#d4d4d4] text-on-primary py-4 px-8 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="font-label font-bold uppercase tracking-widest">{createKey.isPending ? 'GENERATING...' : 'GENERATE NEW KEY'}</span>
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">MANAGED_IDENTITIES</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {keys?.map((key: any) => (
            <div key={key.id} className="bg-surface-container-low p-5 relative overflow-hidden group border-l-2 border-primary hover:bg-[#201f1f] transition-colors">
              <div className="mb-4">
                <h3 className="font-headline text-lg font-bold text-primary mb-1">{key.name}</h3>
                <div className="flex items-center gap-2">
                  <code className="font-label text-[11px] bg-surface-container-lowest border border-white/5 px-2 py-1 text-on-surface-variant">{key.key}</code>
                  <button onClick={() => navigator.clipboard.writeText(key.key)} className="material-symbols-outlined text-[14px] text-outline cursor-pointer hover:text-white transition-colors">content_copy</button>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary">ACTIVE</span>
                  </div>
                  <div className="font-label text-[10px] text-on-surface-variant uppercase">CREATED: {new Date(key.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-label text-[10px] text-on-surface-variant mb-1 uppercase tracking-tighter">USAGE_24H</div>
                  <div className="flex gap-0.5 items-end h-6">
                    <div className="w-1 bg-outline-variant h-2"></div>
                    <div className="w-1 bg-outline-variant h-3"></div>
                    <div className="w-1 bg-primary h-5"></div>
                    <div className="w-1 bg-primary h-6"></div>
                    <div className="w-1 bg-outline-variant h-4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {keys?.length === 0 && (
            <div className="p-8 text-center text-outline font-label text-xs tracking-widest uppercase border border-dashed border-outline-variant/30">
               NO_KEYS_FOUND
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
