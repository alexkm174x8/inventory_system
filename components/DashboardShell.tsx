import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2, Archive, Users, CircleDollarSign,
  Store, Settings, LogOut, Bell, ChevronDown, SquareUserRound, UserPlus, Menu as MenuIcon
} from 'lucide-react';
import { getUserId, getUserRole } from '@/lib/userId';
import { supabase } from '@/lib/supabase';

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const segment = pathname.split('/')[1] || 'dashboard/menu';

  const [userName, setUserName] = useState('Cargando…');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [employeeRole, setEmployeeRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set up session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          await getUserData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserName('No autenticado');
        setIsLoading(false);
        setUserRole(null);
        setEmployeeRole(null);
        router.push('/');
      }
    });

    async function getUserData(userId: string) {
      if (!mounted) return;

      try {
        setIsLoading(true);
        const effectiveUserId = await getUserId();
        
        if (!effectiveUserId) {
          setUserName('Error al obtener ID');
          setIsLoading(false);
          return;
        }

        // Get user role
        const role = await getUserRole();
        if (mounted) {
          setUserRole(role);
        }

        let profile;
        let error;

        if (role === 'employee') {
          // Fetch employee profile with role
          const result = await supabase
            .from('employees')
            .select('name, auth_id, role')
            .eq('auth_id', userId)
            .single();
          profile = result.data;
          error = result.error;
          if (mounted && profile?.role) {
            setEmployeeRole(profile.role);
          }
        } else {
          // Fetch admin profile
          const result = await supabase
          .from('admins')
          .select('name, id, user_id')
          .eq('user_id', effectiveUserId)
          .single();
          profile = result.data;
          error = result.error;
        }

        if (error) {
          console.error('Error fetching profile:', error);
          if (mounted) {
            setUserName('Error al cargar perfil');
            setIsLoading(false);
          }
          return;
        }

        if (profile && mounted) {
          setUserName(profile.name);
          setIsLoading(false);
        } else if (mounted) {
          setUserName('Perfil no encontrado');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        if (mounted) {
          setUserName('Error al obtener datos');
          setIsLoading(false);
        }
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user?.id) {
        getUserData(session.user.id);
      } else {
        setUserName('No autenticado');
        setIsLoading(false);
        setUserRole(null);
        setEmployeeRole(null);
        router.push('/');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        return;
      }
      router.push('/');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  const allMenuItems = [
    { label: 'Menú', href: '/dashboard/menu', icon: <BarChart2 /> },
    { label: 'Inventario', href: '/dashboard/inventario', icon: <Archive /> },
    { label: 'Clientes', href: '/dashboard/clientes', icon: <Users /> },
    { label: 'Ventas', href: '/dashboard/ventas', icon: <CircleDollarSign /> },
    { label: 'Empleados', href: '/dashboard/empleados', icon: <SquareUserRound /> },
    { label: 'Sucursales', href: '/dashboard/sucursales', icon: <Store /> },
    //{ label: 'Configuración', href: '/dashboard/configuracion', icon: <Settings /> },
  ];

  // Filter menu items based on user role and employee role
  const menuItems = (() => {
    if (userRole === 'admin') {
      return allMenuItems;
    } else if (userRole === 'employee') {
      if (employeeRole === 'inventario') {
        return allMenuItems.filter(item => item.label === 'Inventario');
      } else if (employeeRole === 'ventas') {
        return allMenuItems.filter(item => item.label === 'Ventas');
      }
      return [];
    }
    return [];
  })();

  const currentMenuItem = menuItems.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  );
  const pageTitle = currentMenuItem?.label || 'Trade Hub';

  // Redirect if user tries to access unauthorized page
  useEffect(() => {
    if (!isLoading && userRole && currentMenuItem) {
      const isAuthorized = menuItems.some(item => item.href === pathname || pathname.startsWith(item.href + '/'));
      if (!isAuthorized) {
        // Only redirect if we're not already on the correct page
        if (userRole === 'employee') {
          if (employeeRole === 'inventario' && !pathname.startsWith('/dashboard/inventario')) {
        router.push('/dashboard/inventario');
          } else if (employeeRole === 'ventas' && !pathname.startsWith('/dashboard/ventas')) {
            router.push('/dashboard/ventas');
          }
        } else if (!pathname.startsWith('/dashboard/menu')) {
          router.push('/dashboard/menu');
        }
      }
    }
  }, [isLoading, userRole, employeeRole, pathname, menuItems, router]);

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
            const isActive = pathname === item.href || (item.href === '/dashboard/menu' && segment === 'menu');
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
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-[#667085] hover:bg-[#f5f5f5] hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b py-4 px-6 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(o => !o)}>
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <div className="flex items-center space-x-4">
            <Bell />
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#007aff] text-white flex items-center justify-center">
                {!isLoading && userName && !['Error de sesión', 'No autenticado', 'Error al cargar perfil', 'Perfil no encontrado', 'Error al obtener ID', 'Error inesperado', 'Error al obtener datos'].includes(userName)
                  ? userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : ''}
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