import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

const RootLayout = () => (
  <div className="isolate">
    <div className="flex gap-2 p-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{' '}
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>
    </div>
    <hr />
    <Outlet />
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
