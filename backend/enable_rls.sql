-- SQL Script to Enable Row Level Security (RLS) on all tables and fix "UNRESTRICTED" warnings
-- Run this in your Supabase SQL Editor.

-- 1. Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for Service Role
-- These policies ensure that the service_role (used by some backend integrations) 
-- retains full access. The 'postgres' role (superuser) bypasses RLS automatically.

-- We use DO blocks or simple CREATE POLICY statements. 
-- Note: 'service_role' is the standard internal role in Supabase.

CREATE POLICY "Enable all for service_role" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON students FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON teachers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON attendance_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON lectures FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON notices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON units FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON assessments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON dataset_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON rag_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service_role" ON admins FOR ALL TO service_role USING (true) WITH CHECK (true);

-- End of script
