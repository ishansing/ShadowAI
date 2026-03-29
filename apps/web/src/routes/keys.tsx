// apps/web/src/routes/keys.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { client } from '../lib/api';
import { motion } from 'framer-motion';
import { Key, Plus, Copy, Check, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/keys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const [keyName, setKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await client.api.keys.$get();
      if (!res.ok) throw new Error('Failed to fetch keys');
      return await res.json();
    }
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const res = await client.api.keys.$post({ json: { name } });
      if (!res.ok) throw new Error('Failed to create key');
      return await res.json();
    },
    onSuccess: () => {
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <header className="space-y-1 text-center md:text-left">
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">Virtual API Keys</h2>
        <p className="text-muted-foreground text-lg">Generate secure credentials for programmatic access to the AI gateway.</p>
      </header>

      <section className="bg-card p-8 border border-border rounded-3xl shadow-xl shadow-black/20">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">Key Name</label>
            <input
              type="text"
              placeholder="e.g. Cursor IDE, Production Backend"
              className="w-full bg-secondary/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-medium"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />
          </div>
          <button 
            onClick={() => createKey.mutate(keyName)}
            disabled={!keyName || createKey.isPending}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {createKey.isPending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Generate Key</span>
              </>
            )}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
           <div className="p-20 text-center text-muted-foreground">Loading active keys...</div>
        ) : keys?.map((key: any, index: number) => (
          <motion.div 
            key={key.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-foreground/20 transition-all gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Key className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{key.name}</h4>
                <p className="text-sm text-muted-foreground">Created {new Date(key.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-secondary/50 px-4 py-3 rounded-xl border border-border font-mono text-sm max-w-xs md:max-w-md overflow-hidden">
                <span className="truncate">{key.key}</span>
                <button 
                  onClick={() => copyToClipboard(key.key, key.id)}
                  className="hover:text-primary transition-colors flex-shrink-0"
                >
                  {copiedId === key.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
        {!isLoading && keys?.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed border-border rounded-3xl">
             <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
             <p className="text-muted-foreground font-medium text-lg">No programmatic keys active.</p>
          </div>
        )}
      </div>
    </div>
  );
}
