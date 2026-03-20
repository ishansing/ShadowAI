// apps/web/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '../lib/auth';

export const Route = createFileRoute('/')({
  // Protect this route before it even loads
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Live Audit Logs</h2>
          <p className="text-gray-500 mt-1">Welcome back, <span className="text-gray-800 font-medium">{session?.user?.email}</span></p>
        </div>
        <button 
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/login";
          }}
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Sign Out
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
        {/* We will build the Data Table here next */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <p className="text-gray-500 font-medium">Audit data table coming soon...</p>
          <p className="text-sm text-gray-400 mt-1">Fetching records from PostgreSQL via the Gateway API.</p>
        </div>
      </div>
    </div>
  );
}
