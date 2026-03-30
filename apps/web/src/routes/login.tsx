import { createFileRoute } from '@tanstack/react-router';
import { authClient } from '../lib/auth';
import { useState } from 'react';

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
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 technical-grid font-body">
      <div className="w-full max-w-md">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-container-lowest border border-white/10 rounded mb-6 flex items-center justify-center">
             <span className="material-symbols-outlined text-white text-3xl">terminal</span>
          </div>
          <h1 className="text-3xl font-headline font-black tracking-tighter text-white">SHADOW_AI</h1>
          <p className="text-sm font-label tracking-widest uppercase text-neutral-500 mt-2">Authentication Required</p>
        </div>

        <div className="bg-surface-container-low p-8 border border-white/5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[0.65rem] font-label font-bold text-neutral-500 uppercase tracking-widest">Operator Email</label>
                <input 
                  type="email" 
                  placeholder="admin@shadowai.io" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 p-3 text-sm text-white focus:border-white/40 focus:ring-0 outline-none transition-colors font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[0.65rem] font-label font-bold text-neutral-500 uppercase tracking-widest">Access Passphrase</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/10 p-3 text-sm text-white focus:border-white/40 focus:ring-0 outline-none transition-colors font-mono"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-white to-[#d4d4d4] text-[#1a1c1c] p-3 font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              {isLoading ? 'VERIFYING...' : 'INITIATE_SESSION'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
           <p className="font-mono text-[0.6rem] text-neutral-600 uppercase">CONNECTION_SECURED: AES-256-GCM</p>
        </div>
      </div>
    </div>
  );
}
