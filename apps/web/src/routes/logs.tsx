import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '../lib/auth';
import { client } from '../lib/api';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/logs')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) throw redirect({ to: '/login' });
  },
  component: LogsPage,
});

function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [redactedOnly, setRedactedOnly] = useState(false);
  const limit = 20;

  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['audit-logs', page, redactedOnly],
    queryFn: async () => {
      // @ts-ignore
      const res = await client.api.logs.$get({
        query: { 
          page: page.toString(), 
          limit: limit.toString(), 
          redactedOnly: redactedOnly.toString() 
        }
      });
      return res.json();
    },
    refetchInterval: 5000,
  });

  const logs = (logsResponse as any)?.data || [];
  const pagination = (logsResponse as any)?.pagination || { page: 1, totalPages: 1, total: 0 };

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;
    const headers = ["Timestamp", "UserEmail", "Prompt", "WasRedacted", "RedactedFields", "Provider", "PromptTokens", "CompletionTokens"];
    const csvRows = [
      headers.join(","),
      ...logs.map((log: any) => [
        new Date(log.timestamp).toISOString(),
        log.userEmail,
        `"${log.prompt.replace(/"/g, '""')}"`,
        log.wasRedacted,
        `"${log.redactedFields.join("|")}"`,
        log.provider,
        log.promptTokens,
        log.completionTokens
      ].join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `audit_logs_full_${new Date().getTime()}.csv`);
    a.click();
    a.remove();
  };

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((l: any) => 
      l.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  const selectedLog = useMemo(() => 
    filteredLogs.find((l: any) => l.id === selectedLogId),
  [filteredLogs, selectedLogId]);

  return (
    <main className="p-8 min-h-screen max-w-7xl mx-auto w-full space-y-8">
      <header className="mb-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">SYSTEM MONITORING</span>
            <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-white mb-2">AUDIT_LOGS</h1>
            <p className="text-on-surface-variant font-body text-sm max-w-xl">Real-time surveillance of all proxy transactions. Comprehensive tracing of redaction cycles and policy enforcement.</p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-surface-container-low px-4 py-2 border border-outline-variant/20 rounded">
              <span className="font-label text-[0.6rem] text-neutral-500 block uppercase font-bold tracking-tighter">Total_Events</span>
              <span className="mono-data text-xl font-bold text-white tracking-tighter">{pagination.total}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="flex flex-wrap gap-4 items-center bg-surface-container-low p-4 rounded-lg border border-outline-variant/10 shadow-lg">
        <div className="flex-1 min-w-[300px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">search</span>
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border-none pl-10 pr-4 py-2 mono-data text-sm focus:ring-1 focus:ring-primary/40 placeholder:text-neutral-700 outline-none text-white rounded border border-white/5" 
            placeholder="FILTER BY PAYLOAD OR ACTOR..." 
            type="text"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-white/5 rounded">
           <span className="font-label text-[10px] font-bold text-neutral-500 uppercase">Violations_Only</span>
           <button 
             onClick={() => { setRedactedOnly(!redactedOnly); setPage(1); }}
             className={`w-10 h-5 rounded-full relative transition-colors ${redactedOnly ? 'bg-primary' : 'bg-surface-container-high'}`}
           >
             <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${redactedOnly ? 'bg-black left-6' : 'bg-neutral-500 left-1'}`} />
           </button>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-primary text-on-primary px-6 py-2 font-label text-[0.7rem] font-bold tracking-widest uppercase hover:bg-neutral-200 transition-all rounded shadow-lg shadow-primary/10 active:scale-95"
        >
          EXPORT_CSV
        </button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-320px)] pb-24">
        {/* Logs List */}
        <div className={`${selectedLogId ? 'xl:col-span-2' : 'xl:col-span-3'} overflow-hidden flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-lg shadow-2xl transition-all duration-500`}>
          <div className="overflow-y-auto flex-1 hide-scrollbar">
            <table className="w-full text-left mono-data text-[0.75rem] border-collapse">
              <thead className="sticky top-0 bg-surface-container-high z-10 shadow-sm border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 text-neutral-500 font-bold uppercase tracking-tighter">Timestamp</th>
                  <th className="px-4 py-3 text-neutral-500 font-bold uppercase tracking-tighter">Level</th>
                  <th className="px-4 py-3 text-neutral-500 font-bold uppercase tracking-tighter">Event</th>
                  <th className="px-4 py-3 text-neutral-500 font-bold uppercase tracking-tighter">Payload_Snippet</th>
                  <th className="px-4 py-3 text-neutral-500 font-bold uppercase tracking-tighter text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log: any) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLogId(log.id === selectedLogId ? null : log.id)}
                    className={`hover:bg-surface-container-highest cursor-pointer group transition-colors ${log.id === selectedLogId ? 'bg-surface-container-highest' : 'bg-surface-container-lowest/50'}`}
                  >
                    <td className="px-4 py-4 text-neutral-400 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</td>
                    <td className="px-4 py-4">
                      {log.wasRedacted ? (
                        <span className="bg-error-container/20 text-error px-2 py-0.5 rounded-sm font-bold border border-error/10">WARN</span>
                      ) : (
                        <span className="bg-primary/10 text-primary/60 px-2 py-0.5 rounded-sm font-bold border border-primary/10">INFO</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-white font-bold tracking-tight">{log.wasRedacted ? 'REDACTION_EVENT' : 'PROXY_PASS'}</td>
                    <td className="px-4 py-4 text-neutral-500 truncate max-w-[200px] md:max-w-md italic">{log.prompt}</td>
                    <td className="px-4 py-4 text-right pr-6">
                       <span className="font-label text-[0.6rem] text-white font-bold border-b border-white hover:text-primary/80 transition-colors uppercase">View_Details</span>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-20 text-center text-neutral-600 font-label tracking-widest uppercase">NO_EVENTS_MATCH_CRITERIA</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-surface-container-lowest border-t border-white/5 flex justify-between items-center mono-data text-[0.65rem] text-neutral-500">
            <div>PAGE {pagination.page} OF {pagination.totalPages} // TOTAL: {pagination.total}</div>
            <div className="flex gap-4 items-center tracking-widest">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded disabled:opacity-30 disabled:pointer-events-none uppercase font-bold"
              >
                PREV
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded disabled:opacity-30 disabled:pointer-events-none uppercase font-bold"
              >
                NEXT
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Inspector View */}
        <AnimatePresence>
          {selectedLogId && selectedLog && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="xl:col-span-1 flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-lg overflow-hidden shadow-2xl h-full"
            >
              <div className="p-4 bg-surface-container-high flex justify-between items-center border-b border-white/5">
                <span className="font-label text-[0.7rem] font-bold tracking-widest text-white uppercase">EVENT_INSPECTOR</span>
                <button onClick={() => setSelectedLogId(null)} className="text-neutral-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-6 hide-scrollbar">
                <div>
                  <div className="font-label text-[0.6rem] text-neutral-500 mb-2 uppercase tracking-widest font-bold">Metadata</div>
                  <div className="space-y-2 mono-data text-[0.75rem]">
                    <InspectorRow label="TRACE_ID" value={selectedLog.id.substring(0, 8)} />
                    <InspectorRow label="ACTOR" value={selectedLog.userEmail} />
                    <InspectorRow label="PROVIDER" value={selectedLog.provider.toUpperCase()} />
                    <InspectorRow label="REDACTED" value={selectedLog.wasRedacted ? 'TRUE' : 'FALSE'} color={selectedLog.wasRedacted ? 'text-error' : 'text-green-500'} />
                    <InspectorRow label="TOKENS" value={`${selectedLog.promptTokens + selectedLog.completionTokens} (P: ${selectedLog.promptTokens} / C: ${selectedLog.completionTokens})`} />
                  </div>
                </div>

                <div className="p-4 bg-surface-container-lowest border-l-2 border-primary/20 rounded shadow-inner">
                  <div className="font-label text-[0.6rem] text-primary/60 mb-2 uppercase tracking-widest font-bold">Redaction_Summary</div>
                  <p className="mono-data text-[0.7rem] text-neutral-300 leading-relaxed italic">
                    {selectedLog.wasRedacted ? `Found and masked: ${selectedLog.redactedFields.join(', ')}` : "No sensitive patterns matched. Payload clean."}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label text-[0.6rem] text-neutral-500 uppercase tracking-widest font-bold">Raw_Payload</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2))}
                      className="mono-data text-[0.6rem] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[10px]">content_copy</span> COPY_JSON
                    </button>
                  </div>
                  <div className="bg-surface p-4 rounded border border-white/5 mono-data text-[0.7rem] text-neutral-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-60">
                    {JSON.stringify(selectedLog, null, 2)}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-white/5 bg-surface-container-high flex gap-2">
                <button className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 text-white mono-data text-[0.65rem] border border-primary/20 transition-all uppercase font-bold tracking-widest rounded active:scale-95">Replay_Request</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function InspectorRow({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-1">
      <span className="text-neutral-500 font-bold">{label}</span>
      <span className={`${color} font-bold`}>{value}</span>
    </div>
  );
}
