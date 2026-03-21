// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';

export const Route = createRootRouteWithContext<{
  auth: any;
  queryClient: QueryClient;
}>()({
  component: () => (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Sidebar/Nav could go here */}
      <div className="p-4 flex gap-6 bg-white border-b items-center shadow-sm">
        <h1 className="font-bold text-xl tracking-tight text-gray-900">Shadow AI Gateway</h1>
        <nav className="flex gap-4">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-black [&.active]:text-black [&.active]:underline underline-offset-4">
            Dashboard
          </Link>
          <Link to="/keys" className="text-sm font-medium text-gray-600 hover:text-black [&.active]:text-black [&.active]:underline underline-offset-4">
            API Keys
          </Link>
          <Link to="/policies" className="text-sm font-medium text-gray-600 hover:text-black [&.active]:text-black [&.active]:underline underline-offset-4">
            Policies
          </Link>
        </nav>
      </div>
      
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
      
      <TanStackRouterDevtools />
    </div>
  ),
});
