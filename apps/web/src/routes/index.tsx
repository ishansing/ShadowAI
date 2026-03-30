import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '../lib/auth';
import { client } from '../lib/api';
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: '/login' });
  },
  component: OverviewPage,
});

function OverviewPage() {
  const { data: logsResponse } = useQuery({
    queryKey: ['audit-logs-summary'],
    queryFn: async () => {
      // @ts-ignore
      const res = await client.api.logs.$get({ query: { limit: '100' } });
      return res.json();
    },
    refetchInterval: 5000,
  });

  const logs = (logsResponse as any)?.data || [];

  const { data: usageStats } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      // @ts-ignore
      const res = await client.api.stats.usage.$get();
      return res.json();
    },
    refetchInterval: 10000,
  });

  const { data: keys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      // @ts-ignore
      const res = await client.api.keys.$get();
      return res.json();
    }
  });

  const totalLogs = (logsResponse as any)?.pagination?.total || (Array.isArray(logs) ? logs.length : 0);
  const redactedLogs = Array.isArray(logs) ? logs.filter((l: any) => l.wasRedacted) : [];
  const activeKeys = (keys as any)?.length || 0;

  // Group data for the big traffic dynamics chart
  const trafficData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      volume: 0,
      violations: 0,
      volumePercent: 0,
      violationPercent: 0
    }));

    if (!logs) return buckets;

    const now = new Date();
    logs.forEach((log: any) => {
      const logDate = new Date(log.timestamp);
      const diffMs = now.getTime() - logDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours >= 0 && diffHours < 24) {
        const bucketIndex = 23 - diffHours;
        buckets[bucketIndex].volume += 1;
        if (log.wasRedacted) buckets[bucketIndex].violations += 1;
      }
    });

    const maxVolume = Math.max(...buckets.map(b => b.volume), 1);
    return buckets.map(b => ({
      ...b,
      volumePercent: (b.volume / maxVolume) * 100,
      violationPercent: (b.violations / maxVolume) * 100
    }));
  }, [logs]);

  const totalUsage = (usageStats as any)?.reduce((acc: number, s: any) => acc + (s.totalTokens || 0), 0) || 0;

  return (
    <main className="p-8 pb-32 max-w-7xl mx-auto space-y-10 w-full">
      <header>
        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-1 font-bold">SYSTEM_ORCHESTRATOR // STATUS: ONLINE</p>
        <h1 className="font-headline font-extrabold text-[3.5rem] leading-none tracking-tighter text-white">SYSTEM_OVERVIEW</h1>
      </header>

      {/* High-Level Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 border-l-2 border-primary rounded shadow-xl border border-white/5">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4 font-bold tracking-[0.2em]">TOTAL_INGESTION</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">{totalLogs}</div>
          <div className="font-label text-[0.625rem] text-primary/60 mt-2 font-bold tracking-widest">+12.4% CYCLE_ADJ</div>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-error rounded shadow-xl border border-white/5">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4 font-bold tracking-[0.2em]">LEAK_PREVENTION</div>
          <div className="mono-data text-3xl font-bold text-error tracking-tight">{redactedLogs.length}</div>
          <div className="font-label text-[0.625rem] text-error/60 mt-2 font-bold tracking-widest">THREAT_INTERCEPTED</div>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-outline-variant rounded shadow-xl border border-white/5">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4 font-bold tracking-[0.2em]">IDENTITIES</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">{activeKeys}</div>
          <div className="font-label text-[0.625rem] text-neutral-500 mt-2 font-bold tracking-widest">PROVISIONED_NODES</div>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-outline-variant rounded shadow-xl border border-white/5">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4 font-bold tracking-[0.2em]">LATENCY_MS</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">14.2</div>
          <div className="font-label text-[0.625rem] text-green-500/60 mt-2 font-bold tracking-widest">OPTIMAL_REACH</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cost Analytics */}
        <section className="lg:col-span-2 bg-surface-container-low border border-outline-variant/10 rounded-lg p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-headline font-bold text-xl text-white tracking-tight uppercase">Usage_&_Cost_Analytics</h3>
              <p className="font-label text-[0.625rem] text-neutral-500 uppercase tracking-widest font-bold">Token utilization trend across last 14 cycles</p>
            </div>
            <div className="text-right">
               <span className="font-label text-[0.625rem] text-primary/60 uppercase font-bold tracking-widest block">Est_Total_Cost</span>
               <span className="mono-data text-lg text-white font-bold tracking-tighter">
                 ${(totalUsage * 0.000002).toFixed(2)}
               </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(usageStats as any) || []}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0e0e0e', border: '1px solid #ffffff10', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalTokens" 
                  stroke="#ffffff" 
                  fillOpacity={1} 
                  fill="url(#colorTokens)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* System Stats */}
        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 border border-outline-variant/10 rounded-lg shadow-xl space-y-6">
            <h3 className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-6 font-bold">CLUSTER_RESOURCES</h3>
            <div className="space-y-6">
              <HealthItem label="GATEWAY_NODES" version="Active: 12" percent="99.9%" />
              <HealthItem label="REDIS_LATENCY" version="Local Proxy" percent="0.4ms" />
              <HealthItem label="DB_CONNECTIONS" version="Pooled" percent="STABLE" />
            </div>
          </div>

          <div className="bg-surface-container-highest p-6 relative overflow-hidden group border border-outline-variant/10 rounded-lg shadow-xl">
            <div className="relative z-10">
              <div className="font-label text-[0.625rem] text-primary tracking-widest uppercase mb-4 font-bold">SECURITY_THREAT_LEVEL</div>
              <div className="mono-data text-4xl font-black text-white italic">LOW</div>
              <p className="text-[0.65rem] text-white/60 mt-4 leading-relaxed uppercase font-medium">Internal scan complete. No unauthorized leaks detected in packet streams.</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <span className="material-symbols-outlined text-9xl">security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Dynamics */}
      <section className="bg-surface-container-low p-8 border border-outline-variant/10 rounded-lg shadow-2xl">
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-xl text-white tracking-tight uppercase">Realtime_Traffic_Dynamics</h3>
            <p className="font-label text-[0.625rem] text-neutral-500 uppercase tracking-widest font-bold">24-hour sliding window visualization</p>
          </div>
          <div className="flex gap-6 mono-data text-[0.65rem] font-bold text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white"></span> REQ_VOLUME
            </div>
            <div className="flex items-center gap-2 text-primary/40">
              <span className="w-2 h-2 bg-primary/40"></span> DLP_VIOLATIONS
            </div>
          </div>
        </div>
        
        <div className="h-48 flex items-end gap-1.5 overflow-hidden">
          {trafficData.map((data, i) => (
            <div 
              key={i} 
              className="flex-1 bg-surface-container-high hover:bg-surface-container-highest transition-all cursor-crosshair group relative min-w-[4px] rounded-t-sm" 
              style={{ height: `${Math.max(data.volumePercent, 5)}%` }}
            >
              <div 
                className="absolute bottom-0 left-0 w-full bg-primary/40 transition-all rounded-t-sm"
                style={{ height: `${(data.violations / (data.volume || 1)) * 100}%` }}
              />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-black z-20 whitespace-nowrap shadow-2xl rounded">
                VOL: {data.volume} | VIO: {data.violations}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6 font-label text-[0.6rem] text-neutral-600 tracking-[0.2em] font-bold uppercase">
          <span>24H_AGO</span>
          <span>18H_AGO</span>
          <span>12H_AGO</span>
          <span>6H_AGO</span>
          <span>CURRENT_TICK</span>
        </div>
      </section>

      {/* Recent PII Detections */}
      <div className="mt-8 bg-surface-container-low border border-outline-variant/10 rounded-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/10">
          <h3 className="font-headline font-bold text-white tracking-tight uppercase text-lg">REDACTION_STREAMS_LIVE</h3>
          <span className="font-label text-[10px] text-primary/40 font-black tracking-widest uppercase">Latest_Threat_Interceptions</span>
        </div>
        <div className="divide-y divide-white/5">
          {redactedLogs.slice(0, 5).map((log: any) => (
            <div key={log.id} className="grid grid-cols-1 md:grid-cols-4 p-6 hover:bg-[#2a2a2a] transition-colors items-center gap-4 group">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded bg-surface-container-highest border border-white/5 group-hover:border-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-neutral-500 group-hover:text-primary transition-colors">
                    {log.redactedFields.includes('API_KEY') ? 'vpn_key' : log.redactedFields.includes('EMAIL') ? 'mail' : 'lock_open'}
                  </span>
                </div>
                <div>
                  <div className="mono-data text-xs font-bold text-white truncate max-w-[150px] uppercase tracking-tighter">{log.redactedFields.join('_')}</div>
                  <div className="font-label text-[0.6rem] text-neutral-500 uppercase font-bold tracking-widest mt-0.5">TYPE: SEC_VIOLATION</div>
                </div>
              </div>
              <div className="mono-data text-[0.65rem] text-neutral-400 font-medium">
                {new Date(log.timestamp).toLocaleTimeString()} // {new Date(log.timestamp).toLocaleDateString()}
              </div>
              <div>
                <span className="px-2 py-1 bg-surface-container-highest font-label text-[0.6rem] text-white uppercase tracking-tighter border border-white/5 font-bold">Policy: GLOBAL_ENFORCE</span>
              </div>
              <div className="text-right">
                <Dialog>
                  <DialogTrigger>
                    <span className="font-label text-[0.65rem] text-white font-bold border-b border-white cursor-pointer uppercase hover:text-primary transition-colors hover:border-primary">VIEW_PAYLOAD</span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl bg-surface border-white/10 text-white shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline tracking-tight uppercase text-2xl font-black italic">INTERCEPTION_PAYLOAD</DialogTitle>
                    </DialogHeader>
                    <div className="mt-6 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-surface-container-low p-4 rounded border border-white/5">
                             <span className="text-[10px] font-label text-neutral-500 uppercase font-black block mb-1">Source_Identity</span>
                             <span className="text-sm font-mono text-white opacity-80">{log.userEmail}</span>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-white/5">
                             <span className="text-[10px] font-label text-neutral-500 uppercase font-black block mb-1">Token_Consumption</span>
                             <span className="text-sm font-mono text-white opacity-80">Σ {log.promptTokens + log.completionTokens} (P: {log.promptTokens} / C: {log.completionTokens})</span>
                          </div>
                       </div>
                       <div className="p-6 bg-surface-container-lowest border border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-neutral-300 shadow-inner rounded">
                         {log.prompt}
                       </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
          {redactedLogs.length === 0 && (
            <div className="p-20 text-center text-neutral-700 font-label text-xs tracking-widest font-black italic uppercase">Listening_For_Anomalies...</div>
          )}
        </div>
      </div>
    </main>
  );
}

function HealthItem({ label, version, percent }: { label: string, version: string, percent: string }) {
  return (
    <div className="flex justify-between items-center group/item">
      <div>
        <div className="text-sm font-bold text-white font-headline tracking-tight group-hover/item:text-primary transition-colors">{label}</div>
        <div className="mono-data text-[0.6rem] text-neutral-500 uppercase font-bold tracking-widest">{version}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="mono-data text-xs text-white font-black">{percent}</span>
        <div className="w-3 h-3 bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
      </div>
    </div>
  );
}
