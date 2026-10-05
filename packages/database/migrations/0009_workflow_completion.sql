BEGIN;

CREATE TABLE workflow_approval_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  requested_by text NOT NULL,
  approver_roles text[] NOT NULL DEFAULT '{}',
  minimum_approvals integer NOT NULL DEFAULT 1 CHECK (minimum_approvals>=0),
  status text NOT NULL CHECK (status IN ('pending','approved','denied','cancelled')),
  approvals text[] NOT NULL DEFAULT '{}',
  denials text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workflow_approvals_run_idx ON workflow_approval_requests(run_id,status);

CREATE TABLE workflow_trace_entries (
  id bigserial PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  event text NOT NULL,
  attempt integer NOT NULL DEFAULT 1,
  at timestamptz NOT NULL,
  duration_ms integer,
  input jsonb,
  output jsonb,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX workflow_trace_run_idx ON workflow_trace_entries(run_id,at,id);

COMMIT;
