import { createBrowserClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createBrowserClient(
    'https://dijctnuytoiqorvkcjmq.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Get the current path
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ['/']
  const isPublicPath = publicPaths.includes(path)

  // If user is not signed in and trying to access a protected route
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is signed in, handle role-based routing
  if (session) {
    // Get user role
    const { data: userRole } = await supabase
      .rpc('get_user_role', {
        auth_user_id: session.user.id
      })

    // Handle initial login redirect
    if (path === '/') {
      if (userRole === 'employee') {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('role')
          .eq('auth_id', session.user.id)
          .single()

        if (employeeData?.role === 'inventario') {
          return NextResponse.redirect(new URL('/dashboard/inventario', request.url))
        } else if (employeeData?.role === 'ventas') {
          return NextResponse.redirect(new URL('/dashboard/ventas', request.url))
        }
      } else if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/menu', request.url))
      } else if (userRole === 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard-superadmin', request.url))
      }
    }

    // Handle protected route access
    if (path.startsWith('/dashboard/')) {
      if (userRole === 'employee') {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('role')
          .eq('auth_id', session.user.id)
          .single()

        const isInventoryEmployee = employeeData?.role === 'inventario'
        const isSalesEmployee = employeeData?.role === 'ventas'
        const isInventoryPath = path.startsWith('/dashboard/inventario')
        const isSalesPath = path.startsWith('/dashboard/ventas')

        // Redirect if trying to access unauthorized path
        if (isInventoryEmployee && !isInventoryPath) {
          return NextResponse.redirect(new URL('/dashboard/inventario', request.url))
        }
        if (isSalesEmployee && !isSalesPath) {
          return NextResponse.redirect(new URL('/dashboard/ventas', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 