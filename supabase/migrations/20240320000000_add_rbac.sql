-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'employee');

-- Create a function to get the effective user_id (admin's user_id for employees)
CREATE OR REPLACE FUNCTION get_effective_user_id(auth_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    effective_id UUID;
BEGIN
    -- First check if user is an employee
    SELECT admins.id INTO effective_id
    FROM public.employees
    JOIN public.admins ON employees.user_id = admins.user_id
    WHERE employees.auth_id = auth_user_id;

    -- If not an employee, return the original auth_user_id
    IF effective_id IS NULL THEN
        RETURN auth_user_id;
    END IF;

    RETURN effective_id;
END;
$$;

-- Create a function to check user role
CREATE OR REPLACE FUNCTION get_user_role(auth_user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_role user_role;
BEGIN
    -- Check superadmin first (using id_sa column)
    IF EXISTS (SELECT 1 FROM public.super_admin WHERE super_admin.id_sa = auth_user_id) THEN
        RETURN 'superadmin';
    -- Then check admin (using id column)
    ELSIF EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth_user_id) THEN
        RETURN 'admin';
    -- Finally check employee (using auth_id column)
    ELSIF EXISTS (SELECT 1 FROM public.employees WHERE employees.auth_id = auth_user_id) THEN
        RETURN 'employee';
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- Create a function to check if user has access to a path
CREATE OR REPLACE FUNCTION check_path_access(auth_user_id UUID, request_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Get the user's role using the auth_user_id
    user_role_value := get_user_role(auth_user_id);
    
    -- Superadmin can access everything
    IF user_role_value = 'superadmin' THEN
        RETURN TRUE;
    -- Admin can access everything except superadmin routes
    ELSIF user_role_value = 'admin' THEN
        RETURN request_path NOT LIKE '/dashboard-superadmin%';
    -- Employee can only access inventory and ventas
    ELSIF user_role_value = 'employee' THEN
        RETURN request_path LIKE '/dashboard/inventario%' OR request_path LIKE '/dashboard/ventas%';
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_effective_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION check_path_access TO authenticated; 