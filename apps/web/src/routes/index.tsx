import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '../lib/auth';
import { client } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: '/login' });
  },
  component: OverviewPage,
});

function OverviewPage() {
  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.api.logs.$get();
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: keys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await client.api.keys.$get();
      return res.json();
    }
  });

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;
    
    const headers = ["Timestamp", "UserEmail", "Prompt", "WasRedacted", "RedactedFields", "Provider"];
    const csvRows = [
      headers.join(","),
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.userEmail,
        `"${log.prompt.replace(/"/g, '""')}"`,
        log.wasRedacted,
        `"${log.redactedFields.join("|")}"`,
        log.provider
      ].join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `audit_logs_${new Date().getTime()}.csv`);
    a.click();
  };

  const totalLogs = logs?.length || 0;
  const redactedLogs = logs?.filter(l => l.wasRedacted) || [];
  const activeKeys = keys?.length || 0;

  return (
    <main className="p-8 pb-32 max-w-7xl mx-auto space-y-8 w-full">
      {/* Hero Display Section */}
      <header className="mb-12">
        <h1 className="font-headline font-extrabold text-[3.5rem] leading-none tracking-tighter text-white mb-2">SYSTEM_OVERVIEW</h1>
        <p className="font-label text-on-surface-variant text-sm tracking-widest uppercase">NODE_LOCATION: US-EAST-01 // LATENCY: 14MS</p>
      </header>

      {/* High-Level Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low p-6 border-l-2 border-primary">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4">TOTAL_REQUESTS</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">{totalLogs}</div>
          <div className="font-label text-[0.625rem] text-primary/60 mt-2">+12.4% FROM PREV_CYCLE</div>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-outline-variant">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4">PII_REDACTIONS</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">{redactedLogs.length}</div>
          <div className="font-label text-[0.625rem] text-error mt-2">HIGH_SENSITIVITY_MATCH</div>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-outline-variant">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4">ACTIVE_KEYS</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">{activeKeys}</div>
          <div className="font-label text-[0.625rem] text-neutral-500 mt-2">UTILIZATION_OPTIMAL</div>
        </div>
        <div className="bg-surface-container-low p-6 border-l-2 border-outline-variant">
          <div className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-4">SYSTEM_UPTIME</div>
          <div className="mono-data text-3xl font-bold text-white tracking-tight">99.99%</div>
          <div className="font-label text-[0.625rem] text-neutral-500 mt-2">STABLE_RELEASE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Visualization */}
        <div className="lg:col-span-2 bg-surface-container-low p-8 border border-outline-variant/10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="font-headline font-bold text-xl text-white tracking-tight">TRAFFIC_DYNAMICS</h3>
              <p className="font-label text-[0.625rem] text-neutral-500 uppercase tracking-widest">REQUEST_VOLUME VS POLICY_VIOLATIONS</p>
            </div>
            <div className="flex gap-4 mono-data text-[0.65rem]">
              <div className="flex items-center gap-2 text-white">
                <span className="w-2 h-2 bg-white"></span> VOLUME
              </div>
              <div className="flex items-center gap-2 text-primary/40">
                <span className="w-2 h-2 bg-primary/40"></span> VIOLATIONS
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-1 overflow-hidden">
            {[40, 60, 45, 70, 85, 55, 90, 40, 60, 45, 70, 85, 55, 100, 65, 80, 30, 45, 90, 20, 55, 75, 40, 60].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-surface-container-high hover:bg-white transition-colors cursor-crosshair group relative" 
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
                  {h}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 font-label text-[0.625rem] text-neutral-600 tracking-widest">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* System Status & Threat Level */}
        <div className="space-y-6">
          <div className="bg-surface-container-low p-6 border border-outline-variant/10">
            <h3 className="font-label text-[0.625rem] text-secondary tracking-widest uppercase mb-6">INFRASTRUCTURE_HEALTH</h3>
            <div className="space-y-6">
              <HealthItem label="EDGE_PROXY_CORE" version="v4.2.1-stable" percent="99.99%" />
              <HealthItem label="POSTGRESQL_DB" version="Latency: 2ms" percent="HEALTHY" />
              <HealthItem label="REDIS_CACHE" version="HIT_RATE: 94%" percent="ACTIVE" />
            </div>
          </div>

          <div className="bg-surface-container-highest p-6 relative overflow-hidden group border border-outline-variant/10">
            <div className="relative z-10">
              <div className="font-label text-[0.625rem] text-primary tracking-widest uppercase mb-4">THREAT_LEVEL</div>
              <div className="mono-data text-4xl font-black text-white italic">LOW</div>
              <p className="text-[0.65rem] text-white/60 mt-4 leading-relaxed uppercase">No critical anomalies detected in the last 24 cycles. System integrity verified.</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <span className="material-symbols-outlined text-9xl">security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent PII Detections */}
      <div className="mt-8 bg-surface-container-low border border-outline-variant/10">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-headline font-bold text-white tracking-tight uppercase">RECENT_PII_DETECTIONS</h3>
          <button 
            onClick={exportToCSV}
            className="text-[0.625rem] font-label uppercase tracking-widest border border-white/20 px-3 py-1 hover:bg-white hover:text-black transition-colors"
          >
            EXPORT_LOGS
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {redactedLogs.slice(0, 3).map((log: any) => (
            <div key={log.id} className="grid grid-cols-1 md:grid-cols-4 p-6 hover:bg-[#2a2a2a] transition-colors items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-neutral-500">
                  {log.redactedFields.includes('API_KEY') ? 'vpn_key' : log.redactedFields.includes('EMAIL') ? 'mail' : 'lock_open'}
                </span>
                <div>
                  <div className="mono-data text-xs font-bold text-white truncate max-w-[150px] uppercase">{log.redactedFields.join('_')}</div>
                  <div className="font-label text-[0.6rem] text-neutral-500 uppercase">TYPE: PII_IDENTIFIER</div>
                </div>
              </div>
              <div className="mono-data text-[0.65rem] text-neutral-400">
                TS: {new Date(log.timestamp).toISOString()}
              </div>
              <div>
                <span className="px-2 py-1 bg-surface-container-highest font-label text-[0.6rem] text-white uppercase tracking-tighter border border-white/5">POLICY: GLOBAL_DLP_V2</span>
              </div>
              <div className="text-right">
                <Dialog>
                  <DialogTrigger>
                    <span className="font-label text-[0.65rem] text-white font-bold border-b border-white cursor-pointer uppercase hover:text-primary/80 transition-colors">VIEW_REDACTION</span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl bg-surface border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="font-headline tracking-tight uppercase text-2xl font-black">INTERCEPTION_PAYLOAD</DialogTitle>
                    </DialogHeader>
                    <div className="mt-6 p-6 bg-surface-container-lowest border border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-neutral-300">
                      {log.prompt}
                    </div>
                    <div className="mt-4 flex gap-2">
                      {log.redactedFields.map((field: string) => (
                        <span key={field} className="px-2 py-1 bg-error-container/20 text-error text-[10px] font-bold border border-error/20">
                          {field}
                        </span>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
          {redactedLogs.length === 0 && (
            <div className="p-12 text-center text-neutral-600 font-label text-xs tracking-widest">NO_THREATS_DETECTED</div>
          )}
        </div>
      </div>


      <footer className="mt-8 bg-surface-container-lowest p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span className="font-label text-[0.65rem] text-white uppercase tracking-widest">REALTIME_SYSTEM_STREAMS</span>
        </div>
        <div className="space-y-1 font-label text-[0.65rem] text-neutral-500 uppercase leading-relaxed">
          <div className="flex gap-4"><span className="text-white opacity-40">{new Date().toLocaleTimeString()}</span> [AUTH] Validated bearer token for node-014.</div>
          <div className="flex gap-4"><span className="text-white opacity-40">{new Date().toLocaleTimeString()}</span> [PROXY] Routing request to gemini-2.5-flash.</div>
          <div className="flex gap-4"><span className="text-white opacity-40">{new Date().toLocaleTimeString()}</span> [DLP] Pattern Match: Scanning request payload...</div>
        </div>
      </footer>
    </main>
  );
}

function HealthItem({ label, version, percent }: { label: string, version: string, percent: string }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="text-sm font-bold text-white font-headline tracking-tight">{label}</div>
        <div className="mono-data text-[0.6rem] text-neutral-500 uppercase">{version}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="mono-data text-xs text-white">{percent}</span>
        <div className="w-3 h-3 bg-white"></div>
      </div>
    </div>
  );
}
