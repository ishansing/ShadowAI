import { createRootRouteWithContext, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export const Route = createRootRouteWithContext<{
  auth: any;
  queryClient: QueryClient;
}>()({
  component: RootLayout,
});

function RootLayout() {
  // Force dark mode for that professional look
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <div className="hero-gradient fixed inset-0 pointer-events-none opacity-40" />
      
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <div className="w-4 h-4 bg-background rounded-sm" />
              </div>
              <span className="font-bold text-lg tracking-tight">Shadow AI</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/keys">API Keys</NavLink>
              <NavLink to="/policies">Policies</NavLink>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="h-8 w-[1px] bg-border mx-2" />
             <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-2 py-1 rounded bg-secondary">
               Admin Console
             </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-10 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link 
      to={to} 
      className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all [&.active]:text-foreground [&.active]:bg-secondary/80"
    >
      {children}
    </Link>
  );
}
