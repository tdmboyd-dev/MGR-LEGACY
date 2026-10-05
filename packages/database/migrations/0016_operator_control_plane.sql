BEGIN;

CREATE TABLE action_receipts (
  receipt_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  correlation_id text NOT NULL,
  causation_id text,
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  scope_type text NOT NULL,
  scope_id text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  execution_mode text NOT NULL CHECK (execution_mode IN ('observe','recommend','draft','ask','limited','autonomous')),
  status text NOT NULL CHECK (status IN ('planned','simulated','approved','executing','succeeded','failed','blocked','rolled_back')),
  argument_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  policy_decision text NOT NULL,
  policy_reason text,
  approvals jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider jsonb,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  outcome jsonb,
  error text,
  reversible boolean NOT NULL DEFAULT false,
  rollback_receipt_id uuid,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX action_receipts_tenant_started_idx ON action_receipts(tenant_id, started_at DESC);
CREATE INDEX action_receipts_correlation_idx ON action_receipts(tenant_id, correlation_id, started_at DESC);
CREATE INDEX action_receipts_actor_idx ON action_receipts(tenant_id, actor_id, started_at DESC);
CREATE INDEX action_receipts_action_idx ON action_receipts(tenant_id, action, started_at DESC);

CREATE TABLE autonomy_profiles (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  execution_mode text NOT NULL CHECK (execution_mode IN ('observe','recommend','draft','ask','limited','autonomous')),
  successful_runs integer NOT NULL DEFAULT 0,
  failed_runs integer NOT NULL DEFAULT 0,
  blocked_runs integer NOT NULL DEFAULT 0,
  approval_override_rate numeric(8,6) NOT NULL DEFAULT 0,
  rollback_rate numeric(8,6) NOT NULL DEFAULT 0,
  critical_incidents integer NOT NULL DEFAULT 0,
  evidence_coverage numeric(8,6) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, subject_type, subject_id)
);

COMMIT;
