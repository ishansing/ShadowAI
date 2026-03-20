// apps/web/src/routes/login.tsx
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
            // Redirect to dashboard logic here
            window.location.href = "/";
        },
        onError: (ctx) => {
          alert(ctx.error.message);
          setIsLoading(false);
        }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">Admin Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
          <input 
            type="email" 
            placeholder="admin@company.com" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-black hover:bg-gray-800 text-white p-3 rounded-lg font-bold mt-4 transition-colors disabled:bg-gray-400"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
