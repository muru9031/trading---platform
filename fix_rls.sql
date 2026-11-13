-- Temporarily allow all operations on user_asset_courses for development
ALTER TABLE user_asset_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all users to read user_asset_courses" ON user_asset_courses;
DROP POLICY IF EXISTS "Allow all users to insert user_asset_courses" ON user_asset_courses;
DROP POLICY IF EXISTS "Allow all users to update user_asset_courses" ON user_asset_courses;
DROP POLICY IF EXISTS "Allow all users to delete user_asset_courses" ON user_asset_courses;
DROP POLICY IF EXISTS "Enable all access for all users" ON user_asset_courses;

CREATE POLICY "Enable all access for all users" 
ON user_asset_courses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Also ensure we have an open policy on topics and progress tables just in case
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON topics;
CREATE POLICY "Enable all access for all users" ON topics FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON user_topic_progress;
CREATE POLICY "Enable all access for all users" ON user_topic_progress FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_strategy_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON user_strategy_progress;
CREATE POLICY "Enable all access for all users" ON user_strategy_progress FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_global_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON user_global_progress;
CREATE POLICY "Enable all access for all users" ON user_global_progress FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_ptrade_gate ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON user_ptrade_gate;
CREATE POLICY "Enable all access for all users" ON user_ptrade_gate FOR ALL USING (true) WITH CHECK (true);
