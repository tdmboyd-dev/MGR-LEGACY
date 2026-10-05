BEGIN;

CREATE TABLE creation_jobs (
  job_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  prompt text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider text,
  model text,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  cost numeric(18,6),
  outputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text
);
CREATE INDEX creation_jobs_tenant_created_idx ON creation_jobs(tenant_id, created_at DESC);

CREATE TABLE workflow_dead_letters (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id text NOT NULL,
  run_id text NOT NULL,
  node_id text,
  error text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  failed_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('open','requeued','discarded','resolved'))
);
CREATE INDEX workflow_dead_letters_open_idx ON workflow_dead_letters(tenant_id, failed_at DESC) WHERE status='open';

CREATE TABLE connector_manifests (
  id text NOT NULL,
  version text NOT NULL,
  transport text NOT NULL,
  endpoint text,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_secrets jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  registered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id,version)
);

COMMIT;
