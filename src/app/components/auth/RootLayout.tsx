import { Outlet } from 'react-router';
import { SupabaseBootstrap } from './SupabaseBootstrap';

export default function RootLayout() {
  return (
    <>
      <SupabaseBootstrap />
      <Outlet />
    </>
  );
}

