BEGIN;

CREATE TABLE metric_definitions (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  label text NOT NULL,
  description text,
  aggregation text NOT NULL,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, metric_key)
);

CREATE TABLE metric_points (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  scope_type text NOT NULL,
  scope_id text NOT NULL,
  value numeric(24,8) NOT NULL,
  observed_at timestamptz NOT NULL,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX metric_points_lookup_idx ON metric_points(tenant_id, metric_key, observed_at DESC);

CREATE TABLE signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  signal_key text NOT NULL,
  value jsonb NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  source text NOT NULL,
  observed_at timestamptz NOT NULL,
  expires_at timestamptz,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX signals_subject_idx ON signals(tenant_id, subject_type, subject_id, signal_key);

CREATE TABLE data_quality_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  issue_type text NOT NULL,
  severity text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_fix jsonb,
  status text NOT NULL DEFAULT 'open',
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

COMMIT;
