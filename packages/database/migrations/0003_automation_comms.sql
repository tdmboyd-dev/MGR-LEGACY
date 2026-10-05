BEGIN;

CREATE TABLE workflow_definitions (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL DEFAULT gen_random_uuid(),
  version integer NOT NULL CHECK (version > 0),
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','staged','active','retired')),
  trigger jsonb NOT NULL,
  graph jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, workflow_id, version)
);

CREATE TABLE workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL,
  workflow_version integer NOT NULL,
  correlation_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued','running','waiting','succeeded','failed','cancelled')),
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  retries integer NOT NULL DEFAULT 0,
  cost numeric(18,6) NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workflow_runs_tenant_workflow_idx ON workflow_runs(tenant_id, workflow_id, created_at DESC);

CREATE TABLE communication_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject text,
  contact_entity_ids uuid[] NOT NULL DEFAULT '{}',
  channels text[] NOT NULL DEFAULT '{}',
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','sms','voice','chat','portal')),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender text NOT NULL,
  recipients text[] NOT NULL,
  body text NOT NULL,
  provider_message_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL
);
CREATE INDEX messages_thread_sent_idx ON messages(thread_id, sent_at);

CREATE TABLE consent_records (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL CHECK (status IN ('granted','revoked','unknown')),
  source text NOT NULL,
  quiet_hours jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, contact_entity_id, channel)
);

COMMIT;
