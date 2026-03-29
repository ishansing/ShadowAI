// apps/web/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '../lib/auth';
import { client } from '../lib/api';
import { columns } from '../components/columns';
import { DataTable } from '../components/data-table';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Activity, Users } from 'lucide-react';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: '/login' });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: session } = authClient.useSession();

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await client.api.logs.$get();
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    },
    refetchInterval: 5000, // Auto-refresh for "Live" feel
  });

  const redactedCount = logs?.filter(l => l.wasRedacted).length || 0;

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight">Live Audit Logs</h2>
          <p className="text-muted-foreground text-lg">Real-time monitoring of PII redaction and gateway activity.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-wider">Gateway Online</span>
          </div>
          <button 
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            Sign Out ({session?.user?.email})
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Interceptions" 
          value={logs?.length || 0} 
          icon={<Activity className="w-4 h-4" />} 
          delay={0.1}
        />
        <StatCard 
          title="Redactions Triggered" 
          value={redactedCount} 
          icon={<ShieldAlert className="w-4 h-4 text-destructive" />} 
          delay={0.2}
        />
        <StatCard 
          title="Compliance Score" 
          value="100%" 
          icon={<ShieldCheck className="w-4 h-4 text-green-500" />} 
          delay={0.3}
        />
        <StatCard 
          title="Active Admins" 
          value="1" 
          icon={<Users className="w-4 h-4" />} 
          delay={0.4}
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">Recent Activity</h3>
          <div className="text-sm text-muted-foreground">Showing latest 50 records</div>
        </div>

        {isLoading ? (
          <div className="bg-card p-20 rounded-2xl border border-border flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-10 h-10 border-4 border-muted border-t-foreground rounded-full animate-spin" />
               <p className="text-muted-foreground font-medium animate-pulse tracking-wide uppercase text-xs">Synchronizing with Postgres...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-12 rounded-2xl border border-destructive/20 flex items-center justify-center">
            <div className="text-center text-destructive max-w-sm">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-bold text-lg">Connection Failure</p>
              <p className="text-sm opacity-80 mt-2">The dashboard was unable to reach the Gateway on port 3000. Ensure the Docker container is healthy.</p>
            </div>
          </div>
        ) : (
          <div className="shadow-2xl shadow-black/20 rounded-2xl overflow-hidden border border-border bg-card">
            <DataTable columns={columns} data={logs || []} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, delay = 0 }: { title: string; value: string | number; icon: React.ReactNode; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-colors group"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
        <div className="p-2 rounded-lg bg-secondary group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black tracking-tighter">{value}</div>
    </motion.div>
  );
}
