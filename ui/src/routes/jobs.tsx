import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/jobs')({
  component: JobLayout,
});

function JobLayout() {
  return <Outlet />;
}
