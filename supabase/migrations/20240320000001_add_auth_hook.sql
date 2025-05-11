-- Create the auth hook function
CREATE OR REPLACE FUNCTION public.handle_auth_hook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Get the user's role
  user_role := get_user_role(NEW.id);
  
  -- Add the role to the user's metadata
  NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', user_role);
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
BEGIN
  -- Update the user's metadata with their new role
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 
      CASE 
        WHEN TG_TABLE_NAME = 'super_admin' THEN 'superadmin'
        WHEN TG_TABLE_NAME = 'admins' THEN 'admin'
        WHEN TG_TABLE_NAME = 'employees' THEN 'employee'
      END
    )
  WHERE id = 
    CASE 
      WHEN TG_TABLE_NAME = 'super_admin' THEN NEW.id_sa
      WHEN TG_TABLE_NAME = 'admins' THEN NEW.id
      WHEN TG_TABLE_NAME = 'employees' THEN NEW.auth_id
    END;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_superadmin_created ON super_admin;
DROP TRIGGER IF EXISTS on_admin_created ON admins;
DROP TRIGGER IF EXISTS on_employee_created ON employees;

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
GRANT EXECUTE ON FUNCTION public.handle_auth_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_metadata TO authenticated; 