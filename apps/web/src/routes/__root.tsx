import { createRootRouteWithContext, Outlet, Link, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { authClient } from '../lib/auth';
import { client } from '../lib/api';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export const Route = createRootRouteWithContext<{
  auth: any;
  queryClient: QueryClient;
}>()({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await client.api.logs.$get();
      return res.json();
    },
    refetchInterval: 3000,
    enabled: !isLogin
  });

  // Calculate cluster health
  const nodeLoad = useMemo(() => {
    const logData = (logs as any)?.data;
    if (!logData || !Array.isArray(logData)) return 0;
    const recentLogs = logData.filter((l: any) => 
      new Date(l.timestamp).getTime() > Date.now() - 60000
    );
    return Math.min(Math.round((recentLogs.length / 10) * 100), 100);
  }, [logs]);

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body selection:bg-primary selection:text-on-primary flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313] flex justify-between items-center px-8 h-16 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white">terminal</span>
          <span className="font-headline font-bold uppercase tracking-widest text-xl text-white">MONOLITH_PROXY</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4 border-r border-white/10 pr-6">
            <span className="text-[0.6rem] font-label text-neutral-500 tracking-widest uppercase">System_Version</span>
            <span className="text-[0.7rem] font-mono text-white/60">v4.2.1-STABLE</span>
          </div>
          <div 
            className="w-8 h-8 rounded-full bg-surface-container-high border border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/50 transition-colors shadow-lg shadow-black/40"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
            title="Sign Out"
          >
            <img className="w-full h-full object-cover" alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVoXcKsXeN-A0QWteTJpkv9w6uYVvK2Deib6r8unBE7119QF6irnMNkqf1fOcXAci7bbMQxXl5_F48b9Ukaek0HnI818i7GEoOdXlGIklInmrwI_wnxxBmA2daF69FEoIJJW3AUS6Bv6KN9XAqm0Cus40Ee8e3hyZHX1B7_4D9v0UTEMOG9gEe5QZvqXxWivjmRIgOIx7wmMYhrWxz9p4M4iXlhbfspMkbmgkgSyFpKvpE_yVd5tDwSiWFPBxcut5-6LRtY-ZcUEth" />
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col border-r border-white/5 bg-[#131313] z-40 hidden lg:flex">
        <div className="p-6 border-b border-white/5 bg-[#1c1b1b]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
            <span className="font-label text-[0.75rem] uppercase tracking-wider text-white">PROXY_NODE_01</span>
          </div>
          <span className="font-label text-[0.6rem] text-neutral-500 tracking-[0.2em]">STATUS: ACTIVE</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-2">
            <span className="text-[0.6rem] font-label text-neutral-600 tracking-widest uppercase">Navigation</span>
          </div>
          <SideNavLink to="/" icon="dashboard" label="Overview" />
          <SideNavLink to="/policies" icon="security" label="DLP Rules" />
          <SideNavLink to="/keys" icon="vpn_key" label="API Keys" />
          <SideNavLink to="/logs" icon="list_alt" label="Audit Logs" />
          <SideNavLink to="/settings" icon="settings" label="Settings" />
          
          <div className="mt-8 px-6">
            <Link to="/keys" className="block w-full text-center py-3 bg-primary text-on-primary font-label text-[0.7rem] font-bold tracking-widest transition-all hover:bg-neutral-200 active:scale-95">
              GENERATE_KEY
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area with Shared Sidebar */}
      <div className={`lg:ml-64 pt-16 flex-1 flex transition-all duration-500 ease-in-out ${isSidebarExpanded ? 'xl:pr-80' : 'pr-0'} technical-grid`}>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {/* Contextual Terminal Sidebar (Right) */}
        <div className={`fixed right-0 top-16 bottom-0 bg-surface-container-lowest border-l border-white/5 transition-all duration-500 ease-in-out z-30 flex flex-col ${isSidebarExpanded ? 'w-80 opacity-100' : 'w-12 opacity-100'}`}>
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-3 hover:bg-white/5 transition-colors text-neutral-500 flex justify-center border-b border-white/5 outline-none"
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
              <div className="flex-1 bg-black/40 font-mono text-[0.65rem] p-4 rounded overflow-y-auto space-y-3 text-on-surface-variant hide-scrollbar border border-white/5">
                {(logs as any)?.data?.slice(0, 15).map((log: any) => (
                  <div key={log.id} className="animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-neutral-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                      <span className={log.wasRedacted ? "text-error font-bold" : "text-primary/60"}>
                        {log.wasRedacted ? "REDACTED" : "PASSED"}
                      </span>
                    </div>
                    <p className="text-white truncate opacity-80 font-bold tracking-tight">{log.userEmail}</p>
                    <p className="text-[0.6rem] text-neutral-500 truncate italic">"{log.prompt.substring(0, 40)}..."</p>
                  </div>
                ))}
                {(!(logs as any)?.data || (logs as any)?.data.length === 0) && (
                  <p className="text-neutral-700 italic uppercase tracking-tighter">Listening for telemetry...</p>
                )}
                <p className="animate-pulse text-primary">_</p>
              </div>

              <div className="mt-6">
                <div className="bg-surface-container-low p-4 rounded border border-white/5">
                  <span className="block text-[0.6rem] font-mono text-neutral-500 uppercase tracking-widest mb-2">Cluster_Health</span>
                  <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                      animate={{ width: `${nodeLoad}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 font-mono text-[0.6rem]">
                    <span className="text-neutral-500 tracking-tighter">Node_Load</span>
                    <span className="text-white font-bold">{nodeLoad}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-4 bg-[#131313] border-t border-[#474747]/20 z-50 shadow-2xl">
        <BottomNavLink to="/" icon="dashboard" label="OVERVIEW" />
        <BottomNavLink to="/policies" icon="security" label="POLICIES" />
        <BottomNavLink to="/keys" icon="vpn_key" label="KEYS" />
        <BottomNavLink to="/logs" icon="terminal" label="LOGS" />
      </nav>
    </div>
  );
}

function SideNavLink({ to, icon, label }: { to: string, icon: string, label: string }) {
  return (
    <Link to={to} className="text-neutral-500 px-4 py-3 flex items-center gap-3 hover:bg-[#1c1b1b] font-label text-[0.75rem] uppercase tracking-wider transition-all duration-200 [&.active]:bg-[#2a2a2a] [&.active]:text-white [&.active]:border-l-4 [&.active]:border-white">
      <span className="material-symbols-outlined text-[18px]">{icon}</span> {label}
    </Link>
  );
}

function BottomNavLink({ to, icon, label }: { to: string, icon: string, label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center text-[#c6c6c6]/70 px-4 py-1 hover:text-white transition-all active:translate-y-[-2px] duration-200 [&.active]:text-[#1a1c1c] [&.active]:bg-gradient-to-br [&.active]:from-white [&.active]:to-[#d4d4d4] [&.active]:rounded-sm">
      <span className="material-symbols-outlined mb-1">{icon}</span>
      <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
    </Link>
  );
}
