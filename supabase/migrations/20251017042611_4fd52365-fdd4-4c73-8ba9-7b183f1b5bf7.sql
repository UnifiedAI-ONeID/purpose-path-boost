-- 1) Add new columns to plans table
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS price_id_month text,
  ADD COLUMN IF NOT EXISTS price_id_year text,
  ADD COLUMN IF NOT EXISTS blurb text DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]';

-- 2) Lesson packages: curated collections of lessons
CREATE TABLE IF NOT EXISTS lesson_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  summary text DEFAULT '',
  poster_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3) Package to Lessons mapping (ordered)
CREATE TABLE IF NOT EXISTS package_lessons (
  package_id uuid REFERENCES lesson_packages(id) ON DELETE CASCADE,
  lesson_slug text REFERENCES lessons(slug) ON DELETE CASCADE,
  order_index int DEFAULT 0,
  PRIMARY KEY (package_id, lesson_slug)
);

-- 4) Plan to Package entitlements
CREATE TABLE IF NOT EXISTS plan_includes (
  plan_slug text REFERENCES plans(slug) ON DELETE CASCADE,
  package_id uuid REFERENCES lesson_packages(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_slug, package_id)
);

-- 5) Funnels: admin-defined upsell paths
CREATE TABLE IF NOT EXISTS funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  target_plan_slug text REFERENCES plans(slug),
  config jsonb NOT NULL DEFAULT '{}'
);

-- 6) Lesson funnel triggers: attach funnels to specific lessons
CREATE TABLE IF NOT EXISTS lesson_funnel_triggers (
  lesson_slug text REFERENCES lessons(slug) ON DELETE CASCADE,
  funnel_slug text REFERENCES funnels(slug) ON DELETE CASCADE,
  PRIMARY KEY (lesson_slug, funnel_slug)
);

-- 7) Enable RLS on all new tables
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_includes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_funnel_triggers ENABLE ROW LEVEL SECURITY;

-- 8) Public read policies for frontend access
CREATE POLICY "Anyone can view active lesson packages"
  ON lesson_packages FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can view package lessons"
  ON package_lessons FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view plan includes"
  ON plan_includes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view funnels"
  ON funnels FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view lesson funnel triggers"
  ON lesson_funnel_triggers FOR SELECT
  USING (true);

-- 9) Admin management policies
CREATE POLICY "Admins can manage lesson packages"
  ON lesson_packages FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage package lessons"
  ON package_lessons FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage plan includes"
  ON plan_includes FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage funnels"
  ON funnels FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage lesson funnel triggers"
  ON lesson_funnel_triggers FOR ALL
  USING (is_admin());