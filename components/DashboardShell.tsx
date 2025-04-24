import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2, Archive, Users, CircleDollarSign,
  Store, Settings, LogOut, Bell, ChevronDown, Menu as MenuIcon
} from 'lucide-react';

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split('/')[1] || 'menu';

  const [userName, setUserName] = useState('Cargando…');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // fetch supabase u otros para setUserName…
  }, []);

  const menuItems = [
    { label: 'Menú',         href: '/menu',         icon: <BarChart2 /> },
    { label: 'Inventario',   href: '/inventario',   icon: <Archive /> },
    { label: 'Clientes',     href: '/clientes',     icon: <Users /> },
    { label: 'Ventas',       href: '/ventas',       icon: <CircleDollarSign /> },
    { label: 'Sucursales',   href: '/sucursales',   icon: <Store /> },
    { label: 'Configuración',href: '/configuracion',icon: <Settings /> },
  ];

  return (
    <div className="flex h-screen bg-[#f5f5f5]">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed md:static md:flex flex-col w-50 md:w-44 bg-white border-r h-full z-30 transition-transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4">
          <h1 className="text-xl font-bold">Trade Hub</h1>
        </div>
        <nav className="flex-1 px-2 overflow-y-auto">
          {menuItems.map(item => {
            const isActive = pathname === item.href || (item.href === '/menu' && segment === 'menu');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 mb-1 text-sm rounded-md
                  ${isActive ? 'bg-[#e8f1fd] text-[#007aff]' : 'text-[#667085] hover:bg-[#f5f5f5]'}`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-[#f5f5f5]">
            <LogOut className="mr-3 h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b py-4 px-6 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(o => !o)}>
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold">
            {menuItems.find(mi => pathname === mi.href || (pathname === '/menu' && mi.href === '/menu'))?.label}
          </h1>
          <div className="flex items-center space-x-4">
            <Bell />
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#007aff] text-white flex items-center justify-center">
                {/* iniciales del usuario */}
              </div>
              <button className="ml-2 flex items-center text-sm">
                {userName} <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#f5f5f5]">
          {children}
        </main>
      </div>
    </div>
  );
}