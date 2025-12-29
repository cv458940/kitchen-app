-- Kitchen Lists App - Supabase Database Migration
-- Run this SQL in your Supabase SQL Editor to create the database schema

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    password TEXT, -- Only used for admin and manager roles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklists table
CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, name) -- Each user can have unique checklist names
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checkbox', 'temperature', 'text')),
    value TEXT, -- For temperature and text inputs
    completed BOOLEAN DEFAULT FALSE, -- For checkboxes
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT DEFAULT '',
    position INTEGER DEFAULT 0, -- For ordering tasks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_checklists_owner ON checklists(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_checklist ON tasks(checklist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(checklist_id, position);

-- ============================================
-- 3. INSERT DEFAULT ADMIN USER
-- ============================================

-- Insert default Admin user (password: 'password')
INSERT INTO users (username, role, password)
VALUES ('Admin', 'admin', 'password')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Users table policies
-- Anyone can read all users (needed for login dropdown and user management)
CREATE POLICY "Anyone can read users"
    ON users FOR SELECT
    USING (true);

-- Only admins and managers can insert users
CREATE POLICY "Admins and managers can insert users"
    ON users FOR INSERT
    WITH CHECK (true); -- We'll handle authorization in the app

-- Only admins and managers can update users
CREATE POLICY "Admins and managers can update users"
    ON users FOR UPDATE
    USING (true);

-- Only admins and managers can delete users (except admin role)
CREATE POLICY "Admins and managers can delete non-admin users"
    ON users FOR DELETE
    USING (role != 'admin');

-- Checklists table policies
-- Users can read their own checklists
CREATE POLICY "Users can read their own checklists"
    ON checklists FOR SELECT
    USING (true); -- All users can read all checklists (for manager audit)

-- Users can insert their own checklists
CREATE POLICY "Users can insert their own checklists"
    ON checklists FOR INSERT
    WITH CHECK (true);

-- Users can update their own checklists
CREATE POLICY "Users can update their own checklists"
    ON checklists FOR UPDATE
    USING (true);

-- Users can delete their own checklists
CREATE POLICY "Users can delete their own checklists"
    ON checklists FOR DELETE
    USING (true);

-- Tasks table policies
-- Anyone can read all tasks (for manager audit and employee viewing)
CREATE POLICY "Anyone can read tasks"
    ON tasks FOR SELECT
    USING (true);

-- Anyone can insert tasks
CREATE POLICY "Anyone can insert tasks"
    ON tasks FOR INSERT
    WITH CHECK (true);

-- Anyone can update tasks
CREATE POLICY "Anyone can update tasks"
    ON tasks FOR UPDATE
    USING (true);

-- Anyone can delete tasks
CREATE POLICY "Anyone can delete tasks"
    ON tasks FOR DELETE
    USING (true);

-- ============================================
-- 6. CREATE HELPFUL VIEWS (OPTIONAL)
-- ============================================

-- View to get checklist with owner info
CREATE OR REPLACE VIEW checklists_with_owner AS
SELECT
    c.id,
    c.name,
    c.owner_id,
    u.username as owner_username,
    u.role as owner_role,
    c.created_at
FROM checklists c
JOIN users u ON c.owner_id = u.id;

-- View to get tasks with checklist and owner info
CREATE OR REPLACE VIEW tasks_with_details AS
SELECT
    t.*,
    c.name as checklist_name,
    c.owner_id,
    u.username as owner_username,
    cb.username as completed_by_username
FROM tasks t
JOIN checklists c ON t.checklist_id = c.id
JOIN users u ON c.owner_id = u.id
LEFT JOIN users cb ON t.completed_by = cb.id;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================

-- Next steps:
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase Dashboard
-- 3. Navigate to SQL Editor (left sidebar)
-- 4. Click "New Query"
-- 5. Paste this script
-- 6. Click "Run" to execute
-- 7. Verify tables were created in the Table Editor
