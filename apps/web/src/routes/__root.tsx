// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';

export const Route = createRootRouteWithContext<{
  auth: any;
  queryClient: QueryClient;
}>()({
  component: () => (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Sidebar/Nav could go here */}
      <div className="p-4 flex gap-4 bg-white border-b items-center">
        <h1 className="font-bold text-xl">Shadow AI Gateway</h1>
      </div>
      
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
      
      <TanStackRouterDevtools />
    </div>
  ),
});
