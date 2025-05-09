"use client"
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noDashboardRoutes = ['/login', '/logout', '/configuracion'];

  const shouldHideDashboard = noDashboardRoutes.includes(pathname);

  return shouldHideDashboard ? (
    <>{children}</>
  ) : (
    <DashboardShell>{children}</DashboardShell>
  );
}