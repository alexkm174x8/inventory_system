"use client"
import { usePathname } from 'next/navigation';
import SuperAdminShell from '@/components/SuperAdminShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noDashboardRoutes = ['/login', '/logout', '/configuracion'];

  const shouldHideDashboard = noDashboardRoutes.includes(pathname);

  return shouldHideDashboard ? (
    <>{children}</>
  ) : (
    <SuperAdminShell>{children}</SuperAdminShell>
  );
}