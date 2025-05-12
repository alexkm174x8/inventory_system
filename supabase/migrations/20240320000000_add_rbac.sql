-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_superadmin_created ON super_admin;
DROP TRIGGER IF EXISTS on_admin_created ON admins;
DROP TRIGGER IF EXISTS on_employee_created ON employees;
DROP FUNCTION IF EXISTS public.handle_auth_hook();
DROP FUNCTION IF EXISTS public.update_user_role_metadata();
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.get_effective_user_id(UUID);
DROP FUNCTION IF EXISTS public.check_path_access(UUID, TEXT);
DROP TYPE IF EXISTS public.user_role;

-- Create enum for user roles in the public schema
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant usage on the type to authenticated users
GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT USAGE ON TYPE public.user_role TO service_role;

-- Create a function to get the effective user_id (admin's user_id for employees)
CREATE OR REPLACE FUNCTION public.get_effective_user_id(auth_user_id UUID)
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
CREATE OR REPLACE FUNCTION public.get_user_role(auth_user_id UUID)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_role public.user_role;
BEGIN
    -- Check superadmin first (using id_sa column)
    IF EXISTS (SELECT 1 FROM public.super_admin WHERE super_admin.id_sa = auth_user_id) THEN
        RETURN 'superadmin'::public.user_role;
    -- Then check admin (using id column)
    ELSIF EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth_user_id) THEN
        RETURN 'admin'::public.user_role;
    -- Finally check employee (using auth_id column)
    ELSIF EXISTS (SELECT 1 FROM public.employees WHERE employees.auth_id = auth_user_id) THEN
        RETURN 'employee'::public.user_role;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- Create a function to check if user has access to a path
CREATE OR REPLACE FUNCTION public.check_path_access(auth_user_id UUID, request_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_value public.user_role;
BEGIN
    -- Get the user's role using the auth_user_id
    user_role_value := public.get_user_role(auth_user_id);
    
    -- Superadmin can access everything
    IF user_role_value = 'superadmin'::public.user_role THEN
        RETURN TRUE;
    -- Admin can access everything except superadmin routes
    ELSIF user_role_value = 'admin'::public.user_role THEN
        RETURN request_path NOT LIKE '/dashboard-superadmin%';
    -- Employee can only access inventory and ventas
    ELSIF user_role_value = 'employee'::public.user_role THEN
        RETURN request_path LIKE '/dashboard/inventario%' OR request_path LIKE '/dashboard/ventas%';
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Create the auth hook function
CREATE OR REPLACE FUNCTION public.handle_auth_hook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  -- Get the user's role
  user_role_value := public.get_user_role(NEW.id);
  
  -- Add the role to the user's metadata
  NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', user_role_value);
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_hook();

-- Create a function to update user role when they are added to a role table
CREATE OR REPLACE FUNCTION public.update_user_role_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  role_value public.user_role;
BEGIN
  -- Determine the user ID and role based on the table
  CASE TG_TABLE_NAME
    WHEN 'super_admin' THEN
      user_id := NEW.id_sa;
      role_value := 'superadmin'::public.user_role;
    WHEN 'admins' THEN
      user_id := NEW.id;
      role_value := 'admin'::public.user_role;
    WHEN 'employees' THEN
      user_id := NEW.auth_id;
      role_value := 'employee'::public.user_role;
    ELSE
      RETURN NEW;
  END CASE;

  -- Update the user's metadata with their new role
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', role_value)
  WHERE id = user_id;
  
  RETURN NEW;
END;
$$;

-- Create triggers for each role table
CREATE TRIGGER on_superadmin_created
  AFTER INSERT ON super_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_role_metadata();

CREATE TRIGGER on_admin_created
  AFTER INSERT ON admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_role_metadata();

CREATE TRIGGER on_employee_created
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_role_metadata();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_effective_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_path_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_auth_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_metadata TO authenticated; 