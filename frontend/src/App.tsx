import React from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/components/layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import CreateRoomPage from '@/pages/CreateRoomPage';
import SharedVirtualRoomPage from '@/pages/SharedVirtualRoomPage';
import ARRoomPresencePage from '@/pages/ARRoomPresencePage';
import ScratchCardPage from '@/pages/ScratchCardPage';
import TimelapsePlayerPage from '@/pages/TimelapsePlayerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const createRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create-room',
  component: CreateRoomPage,
});

const sharedRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/room/$roomId',
  component: SharedVirtualRoomPage,
});

const arRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ar-room/$roomId',
  component: ARRoomPresencePage,
});

const scratchCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scratch-card',
  component: ScratchCardPage,
});

const timelapsePlayerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timelapse-player',
  component: TimelapsePlayerPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  createRoomRoute,
  sharedRoomRoute,
  arRoomRoute,
  scratchCardRoute,
  timelapsePlayerRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
