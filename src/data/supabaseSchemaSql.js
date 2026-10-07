// SQL Schema script for Supabase setup & Realtime Sync
export const SUPABASE_SCHEMA_SQL = `-- =========================================================================
-- สคริปต์โครงสร้างฐานข้อมูลและระบบ Realtime ระบบตรวจสอบภายใน อปท. (IA-OS Enterprise)
-- สำหรับรันใน Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- =========================================================================

-- 1. สร้างตาราง profiles (ข้อมูลผู้ใช้งานและสิทธิ์)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'executive', 'dept_head', 'staff')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  permissions TEXT[] DEFAULT ARRAY['risk-management', 'forms'],
  can_manage_users BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้างตาราง department_permissions (กำหนดสิทธิ์การมองเห็นเมนูรายกอง)
CREATE TABLE IF NOT EXISTS public.department_permissions (
  department TEXT PRIMARY KEY,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['risk-management', 'forms'],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ข้อมูลสิทธิ์เริ่มต้นรายกอง
INSERT INTO public.department_permissions (department, permissions)
VALUES 
  ('หน่วยตรวจสอบภายใน', ARRAY['dashboard', 'audit-risk', 'planning', 'engagement-plan', 'execution', 'audit-toolkits', 'reporting', 'internal-control', 'risk-management', 'lpa', 'knowledge', 'forms', 'users']),
  ('สำนักปลัด', ARRAY['risk-management', 'forms']),
  ('กองคลัง', ARRAY['risk-management', 'forms']),
  ('กองช่าง', ARRAY['risk-management', 'forms']),
  ('กองการศึกษา', ARRAY['risk-management', 'forms']),
  ('กองสวัสดิการสังคม', ARRAY['risk-management', 'forms'])
ON CONFLICT (department) DO UPDATE 
SET permissions = EXCLUDED.permissions;

-- 3. สร้างตาราง risk_management_data (ข้อมูลแบบ บส.1 ถึง บส.5 รายกองและรายปี)
CREATE TABLE IF NOT EXISTS public.risk_management_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year TEXT NOT NULL,
  department TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fiscal_year, department)
);

-- 4. สร้างตาราง internal_controls_data (ข้อมูลแบบ ปค.1, ปค.4, ปค.5 รายกองและรายปี)
CREATE TABLE IF NOT EXISTS public.internal_controls_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year TEXT NOT NULL,
  department TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fiscal_year, department)
);

-- =========================================================================
-- ตั้งค่า Row Level Security (RLS) เพื่อให้ระบบซิงค์ได้ทั้ง Anon Key และ Auth
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_management_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_controls_data ENABLE ROW LEVEL SECURITY;

-- ลบนโยบายเก่า (ถ้ามี)
DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all on department_permissions" ON public.department_permissions;
DROP POLICY IF EXISTS "Allow all on risk_management_data" ON public.risk_management_data;
DROP POLICY IF EXISTS "Allow all on internal_controls_data" ON public.internal_controls_data;

DROP POLICY IF EXISTS "Users can view own profile or Admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile, Admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can view department permissions" ON public.department_permissions;
DROP POLICY IF EXISTS "Only admins can modify department permissions" ON public.department_permissions;
DROP POLICY IF EXISTS "Users can view own dept risk or Admin can view all" ON public.risk_management_data;
DROP POLICY IF EXISTS "Users can update own dept risk or Admin can update all" ON public.risk_management_data;
DROP POLICY IF EXISTS "Users can view own dept controls or Admin can view all" ON public.internal_controls_data;
DROP POLICY IF EXISTS "Users can update own dept controls or Admin can update all" ON public.internal_controls_data;

-- สร้างนโยบายที่อนุญาตให้ client ที่เชื่อมต่อด้วย Supabase Anon Key หรือ User ทำการ Sync ได้เต็มรูปแบบ
CREATE POLICY "Allow all on profiles"
  ON public.profiles FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on department_permissions"
  ON public.department_permissions FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on risk_management_data"
  ON public.risk_management_data FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on internal_controls_data"
  ON public.internal_controls_data FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- =========================================================================
-- เปิดใช้งาน Realtime Replication (WebSocket Live Push)
-- =========================================================================
ALTER TABLE public.risk_management_data REPLICA IDENTITY FULL;
ALTER TABLE public.internal_controls_data REPLICA IDENTITY FULL;
ALTER TABLE public.department_permissions REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- เพิ่มตารางเข้าสู่ Publication 'supabase_realtime'
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_management_data;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_controls_data;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.department_permissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
`;
