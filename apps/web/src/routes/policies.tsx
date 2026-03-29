import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/policies')({
  component: PoliciesPage,
});

const RULES = [
  {
    key: 'blockEmails',
    id: 'DLP_EML_01',
    title: 'EMAIL_ADDRESSES',
    desc: 'Detection of RFC 5322 compliant email strings across all prompt fields.',
    icon: 'alternate_email',
    regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    sampleInput: 'contact@monolith.ai',
    sampleOutput: '[REDACTED_EMAIL]',
    category: 'PII'
  },
  {
    key: 'blockApiKeys',
    id: 'DLP_API_04',
    title: 'API_SECRET_KEYS',
    desc: 'High-entropy string detection for AWS, Stripe, and OpenAI keys.',
    icon: 'vpn_key',
    regex: 'sk-[a-zA-Z0-9]{20,}',
    sampleInput: 'sk-ant-api03-as9...',
    sampleOutput: 'ACTION: TERMINATE_SESSION',
    sampleOutputError: true,
    category: 'SECRET_KEYS'
  },
  {
    key: 'blockPhones',
    id: 'DLP_PHN_22',
    title: 'PHONE_NUMBERS',
    desc: 'International and domestic phone number pattern matching (E.164).',
    icon: 'call',
    regex: '(\\+?\\d{1,2}\\s?)?\\(?\\d{3}\\)?[\\s.-]\\d{3}[\\s.-]\\d{4}',
    sampleInput: '+1-555-0199',
    sampleOutput: '[REDACTED_PHONE]',
    category: 'PII'
  },
  {
    key: 'blockSSN',
    id: 'DLP_GOV_12',
    title: 'US_SSN_PATTERNS',
    desc: 'Identifies Social Security numbers via Regex and Luhn validation.',
    icon: 'fingerprint',
    regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    sampleInput: '123-45-6789',
    sampleOutput: '[REDACTED_SSN]',
    category: 'PII'
  },
  {
    key: 'blockCreditCards',
    id: 'DLP_FIN_09',
    title: 'CREDIT_CARD_DATA',
    desc: 'PCI-DSS compliance rule for Visa, Mastercard, and AMEX detection.',
    icon: 'credit_card',
    regex: '\\b(?:\\d[ -]*?){13,19}\\b',
    sampleInput: '4532 1122 3344 5566',
    sampleOutput: '[REDACTED_CREDIT_CARD]',
    category: 'FINANCIAL'
  }
];

function PoliciesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL_RULES');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const { data: policy } = useQuery({
    queryKey: ['policy'],
    queryFn: async () => {
      const res = await client.api.policies.$get();
      return res.json();
    }
  });

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.api.logs.$get();
      return res.json();
    },
    refetchInterval: 3000
  });

  const updatePolicy = useMutation({
    mutationFn: async (updates: any) => {
      await client.api.policies.$post({ json: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy'] });
    }
  });

  const handleToggle = (field: string, checked: boolean) => {
    updatePolicy.mutate({ [field]: checked });
  };

  const handleActionChange = (ruleKey: string, action: 'redact' | 'block') => {
    const currentActions = policy?.ruleActions || {};
    updatePolicy.mutate({
      ruleActions: {
        ...currentActions,
        [ruleKey]: action
      }
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(policy, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "shadow_dlp_policy.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredRules = useMemo(() => {
    return RULES.filter(rule => {
      const matchesSearch = rule.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           rule.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'ALL_RULES' || rule.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  // Calculate cluster health
  const nodeLoad = useMemo(() => {
    if (!logs) return 0;
    const recentLogs = logs.filter((l: any) => 
      new Date(l.timestamp).getTime() > Date.now() - 60000
    );
    return Math.min(Math.round((recentLogs.length / 10) * 100), 100);
  }, [logs]);

  return (
    <div className="flex w-full min-h-screen relative overflow-x-hidden">
      <div className={`flex-1 transition-all duration-500 ease-in-out ${isSidebarExpanded ? 'xl:pr-80' : 'pr-0'}`}>
        <header className="p-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-white mb-2 uppercase">DLP_POLICIES</h1>
              <p className="text-on-surface-variant font-body text-sm max-w-2xl">
                Configure real-time data loss prevention rules for all outgoing AI requests. The system intercepts and mutates payloads before they reach model endpoints.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleExport}
                className="px-6 py-2 border border-outline-variant/30 text-white font-label text-xs tracking-widest uppercase hover:bg-surface-container-high transition-colors"
              >
                EXPORT_CFG
              </button>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['policy'] })}
                className="px-6 py-2 bg-primary text-on-primary font-label text-xs tracking-widest font-bold uppercase shadow-lg shadow-black/40 hover:bg-neutral-200 transition-colors"
              >
                SYNC_POLICIES
              </button>
            </div>
          </div>

          {/* Global Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-surface-container-low p-6 flex flex-col gap-1 border-l-2 border-primary">
              <span className="text-[0.65rem] font-label text-neutral-500 tracking-widest uppercase">Active_Rules</span>
              <span className="text-2xl font-headline font-bold text-white">
                {Object.values(policy || {}).filter(v => v === true).length}/5
              </span>
            </div>
            <div className="bg-surface-container-low p-6 flex flex-col gap-1">
              <span className="text-[0.65rem] font-label text-neutral-500 tracking-widest uppercase">Redactions_24h</span>
              <span className="text-2xl font-headline font-bold text-white">
                {logs?.filter((l: any) => l.wasRedacted).length || 0}
              </span>
            </div>
            <div className="bg-surface-container-low p-6 flex flex-col gap-1">
              <span className="text-[0.65rem] font-label text-neutral-500 tracking-widest uppercase">Avg_Latency_Impact</span>
              <span className="text-2xl font-headline font-bold text-white">12ms</span>
            </div>
            <div className="bg-surface-container-low p-6 flex flex-col gap-1 border-r-2 border-white/20">
              <span className="text-[0.65rem] font-label text-neutral-500 tracking-widest uppercase">Global_Status</span>
              <span className="text-2xl font-headline font-bold text-white uppercase">Enforced</span>
            </div>
          </div>
        </header>

        <section className="px-8 pb-20 space-y-4">
          {/* Search & Filter Cluster */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border-none py-4 pl-12 pr-4 font-label text-xs tracking-widest focus:ring-1 focus:ring-primary/40 text-white placeholder:text-outline/50 rounded-lg outline-none" 
                placeholder="SEARCH RULES..." 
                type="text"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {['ALL_RULES', 'PII', 'FINANCIAL', 'SECRET_KEYS'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-none px-4 py-2 font-label text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${activeCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredRules.map((rule) => (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <PolicyRow 
                  {...rule}
                  checked={policy?.[rule.key as keyof typeof policy] ?? true} 
                  currentAction={policy?.ruleActions?.[rule.key] || 'redact'}
                  onToggle={(c: boolean) => handleToggle(rule.key, c)} 
                  onActionChange={(a: 'redact' | 'block') => handleActionChange(rule.key, a)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredRules.length === 0 && (
            <div className="p-20 text-center border border-dashed border-white/10 rounded-lg">
              <span className="font-label text-sm text-neutral-600 uppercase tracking-[0.2em]">No rules match your filters</span>
            </div>
          )}
        </section>
      </div>

      {/* Contextual Terminal Sidebar (Right) */}
      <div className={`fixed right-0 top-16 bottom-0 bg-surface-container-lowest border-l border-white/5 transition-all duration-500 ease-in-out z-30 flex flex-col ${isSidebarExpanded ? 'w-80 opacity-100' : 'w-12 opacity-100'}`}>
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="p-3 hover:bg-white/5 transition-colors text-neutral-500 flex justify-center border-b border-white/5"
        >
          <span className="material-symbols-outlined transform transition-transform duration-500" style={{ transform: isSidebarExpanded ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            {isSidebarExpanded ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        {isSidebarExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col p-6 overflow-hidden"
          >
            <h4 className="font-label text-[0.65rem] text-white tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary"></span> Live_System_Logs
            </h4>
            <div className="flex-1 bg-black/40 font-mono text-[0.65rem] p-4 rounded overflow-y-auto space-y-3 text-on-surface-variant scrollbar-hide border border-white/5">
              {logs?.slice(0, 15).map((log: any) => (
                <div key={log.id} className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-neutral-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                    <span className={log.wasRedacted ? "text-error" : "text-primary/60"}>
                      {log.wasRedacted ? "REDACTED" : "PASSED"}
                    </span>
                  </div>
                  <p className="text-white truncate opacity-80">{log.userEmail}</p>
                  <p className="text-[0.6rem] text-neutral-500 truncate">{log.prompt.substring(0, 40)}...</p>
                </div>
              ))}
              {(!logs || logs.length === 0) && (
                <p className="text-neutral-700 italic uppercase">Listening for events...</p>
              )}
              <p className="animate-pulse text-primary">_</p>
            </div>
            <div className="mt-6">
              <div className="bg-surface-container-low p-4 rounded border border-white/5">
                <span className="block text-[0.6rem] font-mono text-neutral-500 uppercase tracking-widest mb-2">Cluster_Health</span>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary" 
                    animate={{ width: `${nodeLoad}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex justify-between mt-2 font-mono text-[0.6rem]">
                  <span className="text-neutral-500">Node_Load</span>
                  <span className="text-white">{nodeLoad}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PolicyRow({ title, desc, icon, checked, onToggle, onActionChange, currentAction, regex, sampleInput, sampleOutput, sampleOutputError }: any) {
  return (
    <div className={`group bg-surface-container-lowest border transition-all duration-300 overflow-hidden rounded-lg ${checked ? 'border-l-2 border-l-primary border-white/5 hover:border-white/20' : 'border-white/5 opacity-60 grayscale hover:grayscale-0'}`}>
      <div className="p-6 flex flex-col xl:flex-row gap-8">
        {/* Column 1: Identity & Switch */}
        <div className="w-full xl:w-1/4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-lg ${checked ? 'text-primary' : 'text-neutral-500'}`}>{icon}</span>
              <h3 className={`font-headline font-bold text-lg tracking-tight ${checked ? 'text-white' : 'text-neutral-500 uppercase'}`}>{title}</h3>
            </div>
            <p className={`text-xs leading-relaxed mb-4 ${checked ? 'text-on-surface-variant' : 'text-neutral-600'}`}>{desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <div onClick={() => onToggle(!checked)} className="relative inline-flex items-center cursor-pointer">
              <div className={`w-10 h-5 peer-focus:outline-none rounded-full transition-all border ${checked ? 'bg-primary border-primary' : 'bg-surface-container-high border-neutral-700'}`}>
                <div className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full border transition-all ${checked ? 'translate-x-full border-white bg-white' : 'border-neutral-700 bg-neutral-700'}`}></div>
              </div>
            </div>
            <span className={`font-label text-[0.65rem] tracking-widest font-bold uppercase ${checked ? 'text-primary' : 'text-neutral-600'}`}>
              {checked ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* Column 2: Mechanism & Sample */}
        {checked ? (
          <div className="flex-1 space-y-4">
            <div className="bg-surface-container p-4 rounded border border-white/5">
              <span className="block text-[0.6rem] font-mono text-neutral-500 uppercase tracking-widest mb-2">Mechanism_Logic</span>
              <p className="text-[0.7rem] font-mono text-on-surface-variant">Regex: <code className="text-white bg-surface-container-high px-1 break-all">{regex}</code></p>
            </div>
            <div className="bg-surface-container-low border border-white/5 p-4 rounded">
              <span className="block text-[0.6rem] font-mono text-neutral-500 uppercase tracking-widest mb-2">Sample_Redaction</span>
              <div className="flex justify-between items-center text-[0.7rem] font-mono">
                <span className="text-neutral-500">Input: {sampleInput}</span>
                <span className={sampleOutputError ? "text-error font-bold italic tracking-tighter" : "text-primary"}>
                  {sampleOutputError ? sampleOutput : `Output: ${sampleOutput}`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded min-h-[120px]">
            <span className="font-mono text-[0.6rem] text-neutral-600 tracking-[0.2em] uppercase">Rule_Suspended</span>
          </div>
        )}

        {/* Column 3: Controls */}
        {checked && (
          <div className="w-full xl:w-1/3 flex flex-col gap-4">
            <div className="space-y-2">
              <label className="font-label text-[0.65rem] tracking-widest text-neutral-500 uppercase">Action_Policy</label>
              <div className="grid grid-cols-2 gap-1 bg-surface-container-high p-1 rounded">
                <button 
                  onClick={() => onActionChange('redact')}
                  className={`py-1.5 text-[0.65rem] font-bold uppercase tracking-widest transition-all ${currentAction === 'redact' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                >
                  Redact
                </button>
                <button 
                  onClick={() => onActionChange('block')}
                  className={`py-1.5 text-[0.65rem] font-bold uppercase tracking-widest transition-all ${currentAction === 'block' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                >
                  Block
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[0.65rem] tracking-widest text-neutral-500 uppercase">Status_Audit</label>
              <div className="p-3 bg-surface-container p-2 rounded border border-white/5">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                    <span className="text-[0.6rem] font-mono text-white opacity-60 uppercase tracking-tighter">Verified_Stable</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
