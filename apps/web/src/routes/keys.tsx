// apps/web/src/routes/keys.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { client } from '../lib/api';

export const Route = createFileRoute('/keys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const [keyName, setKeyName] = useState('');
  const queryClient = useQueryClient();

  // Fetch Keys
  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await client.api.keys.$get();
      if (!res.ok) throw new Error('Failed to fetch keys');
      return await res.json();
    }
  });

  // Create Key Mutation
  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const res = await client.api.keys.$post({ json: { name } });
      if (!res.ok) throw new Error('Failed to create key');
      return await res.json();
    },
    onSuccess: () => {
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] }); // Refresh list
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Virtual API Keys</h2>
        <p className="text-gray-500 mt-1">Generate secure, programmatic access keys for your team's tools and environments.</p>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Create New Key</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="e.g. Cursor IDE, Marketing Team Scripts"
            className="border border-gray-300 p-2.5 rounded-lg flex-1 focus:ring-2 focus:ring-black focus:outline-none transition-all"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keyName && !createKey.isPending) {
                createKey.mutate(keyName);
              }
            }}
          />
          <button 
            onClick={() => createKey.mutate(keyName)}
            disabled={!keyName || createKey.isPending}
            className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createKey.isPending ? 'Generating...' : 'Generate Key'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Name</th>
              <th className="p-4 font-semibold text-gray-700">Secret Key</th>
              <th className="p-4 font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr>
                 <td colSpan={3} className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    Loading keys...
                 </td>
               </tr>
            ) : keys?.map((key: any) => (
              <tr key={key.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{key.name}</td>
                <td className="p-4 font-mono text-xs text-gray-600 bg-gray-50/50 rounded-md">
                   <div className="flex items-center gap-2">
                     <span className="truncate max-w-[250px] inline-block">{key.key}</span>
                     <button 
                        onClick={() => navigator.clipboard.writeText(key.key)}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                        title="Copy to clipboard"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                     </button>
                   </div>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!isLoading && keys?.length === 0 && (
              <tr>
                <td colSpan={3} className="p-12 text-center text-gray-500">
                   <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                   No keys generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
