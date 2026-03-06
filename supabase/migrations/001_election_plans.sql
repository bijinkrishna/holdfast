-- Election Plans table
-- Stores the full ElectionPlan JSON document per plan session.
-- A plan_id UUID is kept in the user's browser (localStorage) to identify their plan.

CREATE TABLE IF NOT EXISTS election_plans (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan       JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS election_plans_updated_at ON election_plans;
CREATE TRIGGER election_plans_updated_at
  BEFORE UPDATE ON election_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
-- No auth required: allow anonymous reads/writes (anyone who knows the plan UUID can access it).
ALTER TABLE election_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON election_plans;
CREATE POLICY "allow_all" ON election_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);
