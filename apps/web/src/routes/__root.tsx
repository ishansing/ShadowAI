import { createRootRouteWithContext, Outlet, Link, useLocation } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { authClient } from '../lib/auth';

export const Route = createRootRouteWithContext<{
  auth: any;
  queryClient: QueryClient;
}>()({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

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
      <aside className="fixed left-0 top-16 bottom-0 w-64 flex-col border-r border-white/5 bg-[#131313] z-40 hidden lg:flex">
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
          
          <div className="mt-8 px-6">
            <Link to="/keys" className="block w-full text-center py-3 bg-primary text-on-primary font-label text-[0.7rem] font-bold tracking-widest transition-all hover:bg-neutral-200 active:scale-95">
              GENERATE_KEY
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 flex-1 flex flex-col technical-grid">
        <Outlet />
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-4 bg-[#131313] border-t border-[#474747]/20 z-50">
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
