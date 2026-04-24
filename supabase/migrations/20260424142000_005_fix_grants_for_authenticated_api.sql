-- Ensure PostgREST roles can access schema objects.
-- Without these grants, API requests return 403 even when RLS policies are correct.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public
TO authenticated;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO authenticated;

GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO authenticated;
