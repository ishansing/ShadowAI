// apps/web/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '../lib/auth';
import { client } from '../lib/api';
import { columns } from '../components/columns';
import { DataTable } from '../components/data-table';

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

  // Fetch data using React Query and Hono RPC
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await client.api.logs.$get();
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Shadow AI Audit Logs</h2>
          <p className="text-gray-500 mt-1">Monitor sensitive data being redacted before hitting AI providers.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-gray-500">Logged in as <span className="text-gray-800 font-medium">{session?.user?.email}</span></p>
          <button 
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
             <p className="text-gray-500 font-medium animate-pulse">Fetching latest records...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-8 rounded-xl border border-red-100 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-red-600">
            <svg className="w-10 h-10 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-bold">Error loading data</p>
            <p className="text-sm opacity-80 mt-1">Ensure the Gateway is running on port 3000.</p>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={logs || []} />
      )}
    </div>
  );
}
