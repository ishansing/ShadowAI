// apps/web/src/routes/login.tsx
import { createFileRoute } from '@tanstack/react-router';
import { authClient } from '../lib/auth';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await authClient.signIn.email({ 
        email, 
        password 
    }, {
        onSuccess: () => {
            window.location.href = "/";
        },
        onError: (ctx) => {
          alert(ctx.error.message);
          setIsLoading(false);
        }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 mb-10"
      >
        <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center shadow-xl shadow-black/40">
          <ShieldCheck className="w-8 h-8 text-background" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tighter">Shadow AI Gateway</h1>
          <p className="text-muted-foreground font-medium">Enterprise Data Plane Control</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md p-8 bg-card rounded-3xl border border-border shadow-2xl shadow-black/40"
      >
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email" 
                placeholder="admin@company.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                <button type="button" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Forgot?</button>
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 font-medium"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-xl font-black text-lg transition-all transform active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Authenticate</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-sm text-muted-foreground font-medium"
      >
        Secured by <span className="text-foreground">Better Auth</span> & <span className="text-foreground">Hono</span>
      </motion.p>
    </div>
  );
}
