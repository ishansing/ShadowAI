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

export const Route = createFileRoute('/logs')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: '/login' });
  },
  component: LogsPage,
});

function LogsPage() {
  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.api.logs.$get();
      return res.json();
    },
    refetchInterval: 5000,
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
    a.setAttribute('download', `audit_logs_full_${new Date().getTime()}.csv`);
    a.click();
  };

  return (
    <main className="p-8 min-h-screen max-w-7xl mx-auto w-full">
      <header className="mb-12">
        <div className="flex justify-between items-end">
          <div>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">SYSTEM MONITORING</span>
            <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-white mb-2">AUDIT_LOGS</h1>
            <p className="text-on-surface-variant font-body text-sm max-w-xl">Real-time surveillance of all proxy transactions. Comprehensive tracing of redaction cycles, authentication events, and policy enforcement.</p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-surface-container-low px-4 py-2 border border-outline-variant/20">
              <span className="font-label text-[0.6rem] text-neutral-500 block">TOTAL_EVENTS_24H</span>
              <span className="mono-data text-xl font-medium">{logs?.length || 0}</span>
            </div>
            <div className="bg-surface-container-low px-4 py-2 border border-outline-variant/20">
              <span className="font-label text-[0.6rem] text-neutral-500 block">SYSTEM_LOAD</span>
              <span className="mono-data text-xl font-medium">12.4ms</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-6 flex flex-wrap gap-4 items-center bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
        <div className="flex-1 min-w-[300px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">search</span>
          <input className="w-full bg-surface-container-lowest border-none pl-10 pr-4 py-2 mono-data text-sm focus:ring-1 focus:ring-primary/40 placeholder:text-neutral-700 outline-none text-white rounded" placeholder="FILTER BY PAYLOAD OR ACTOR..." type="text"/>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-primary text-on-primary px-6 py-2 font-label text-[0.7rem] font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded"
        >
          EXPORT_CSV
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 h-[calc(100vh-320px)]">
        {/* Logs List (The Technical Card) */}
        <div className="overflow-hidden flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-lg shadow-xl shadow-black/20">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left mono-data text-[0.75rem] border-collapse">
              <thead className="sticky top-0 bg-surface-container-high z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-neutral-500 font-normal uppercase tracking-tighter">Timestamp</th>
                  <th className="px-4 py-3 text-neutral-500 font-normal uppercase tracking-tighter">Level</th>
                  <th className="px-4 py-3 text-neutral-500 font-normal uppercase tracking-tighter">Event</th>
                  <th className="px-4 py-3 text-neutral-500 font-normal uppercase tracking-tighter">Payload_Snippet</th>
                  <th className="px-4 py-3 text-neutral-500 font-normal uppercase tracking-tighter text-right pr-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs?.map((log: any) => (
                  <Dialog key={log.id}>
                    <DialogTrigger>
                      <tr className="hover:bg-surface-container-highest cursor-pointer group transition-colors bg-surface-container-lowest/50">
                        <td className="px-4 py-4 text-neutral-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-4">
                          {log.wasRedacted ? (
                            <span className="bg-error-container/20 text-error px-2 py-0.5 rounded-sm font-bold border border-error/10">WARN</span>
                          ) : (
                            <span className="bg-primary/10 text-primary/60 px-2 py-0.5 rounded-sm font-bold border border-primary/10">INFO</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-white font-bold">{log.wasRedacted ? 'REDACTION_EVENT' : 'PROXY_PASS'}</td>
                        <td className="px-4 py-4 text-neutral-500 truncate max-w-[200px] md:max-w-md italic">{log.prompt}</td>
                        <td className="px-4 py-4 text-right pr-10">
                           <span className="font-label text-[0.6rem] text-white font-bold border-b border-white hover:text-primary/80 transition-colors uppercase">View_Details</span>
                        </td>
                      </tr>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl bg-surface border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle className="font-headline tracking-tight uppercase text-2xl font-black">INTERCEPTION_PAYLOAD</DialogTitle>
                      </DialogHeader>
                      <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-surface-container-low p-3 border border-white/5">
                            <span className="text-[10px] font-label text-neutral-500 uppercase block mb-1">USER_IDENTITY</span>
                            <span className="text-sm font-mono">{log.userEmail}</span>
                          </div>
                          <div className="bg-surface-container-low p-3 border border-white/5">
                            <span className="text-[10px] font-label text-neutral-500 uppercase block mb-1">PROVIDER_NODE</span>
                            <span className="text-sm font-mono uppercase">{log.provider}</span>
                          </div>
                        </div>
                        <div className="p-6 bg-surface-container-lowest border border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all text-neutral-300">
                          {log.prompt}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {log.redactedFields.map((field: string) => (
                            <span key={field} className="px-3 py-1 bg-error-container/20 text-error text-[10px] font-bold border border-error/20 uppercase tracking-widest">
                              {field}
                            </span>
                          ))}
                          {!log.wasRedacted && (
                            <span className="px-3 py-1 bg-primary/10 text-primary/60 text-[10px] font-bold border border-primary/10 uppercase tracking-widest">
                              CLEAN_PAYLOAD
                            </span>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
                {logs?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-600 font-label tracking-widest uppercase">NO_SYSTEM_EVENTS_LOGGED</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination / Footer */}
          <div className="p-4 bg-surface-container-lowest border-t border-white/5 flex justify-between items-center mono-data text-[0.65rem] text-neutral-500">
            <div>SHOWING 1-{logs?.length || 0} OF {logs?.length || 0} EVENTS</div>
            <div className="flex gap-4 items-center tracking-widest">
              <span className="text-primary bg-surface-container-high px-2 py-1 rounded">PAGE 1</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

