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

  // If user is signed in and trying to access auth page
  if (session && path === '/') {
    // Get user role to determine where to redirect
    const { data: userRole } = await supabase
      .rpc('get_user_role', {
        auth_user_id: session.user.id
      })

    if (userRole === 'employee') {
      return NextResponse.redirect(new URL('/dashboard/inventario', request.url))
    } else if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/menu', request.url))
    } else if (userRole === 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard-superadmin', request.url))
    }
  }

  // Check role-based access if user is authenticated and not on a public path
  if (session && !isPublicPath) {
    try {
      const { data: hasAccess, error } = await supabase
        .rpc('check_path_access', {
          auth_user_id: session.user.id,
          request_path: path
        })

      if (error) {
        console.error('Error checking path access:', error)
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (!hasAccess) {
        // Get user role to determine where to redirect
        const { data: userRole } = await supabase
          .rpc('get_user_role', {
            auth_user_id: session.user.id
          })

        // Redirect to appropriate page based on role
        if (userRole === 'employee') {
          return NextResponse.redirect(new URL('/dashboard/inventario', request.url))
        } else if (userRole === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/menu', request.url))
        } else if (userRole === 'superadmin') {
          return NextResponse.redirect(new URL('/dashboard-superadmin', request.url))
        }
      }
    } catch (error) {
      console.error('Error in middleware:', error)
      return NextResponse.redirect(new URL('/', request.url))
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