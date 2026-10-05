BEGIN;

CREATE TABLE message_templates (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL,
  subject text,
  body text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE communication_sequences (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  steps jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sequence_enrollments (
  id uuid PRIMARY KEY,
  sequence_id uuid NOT NULL REFERENCES communication_sequences(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  next_run_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('active','paused','completed','stopped')),
  replied boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sequence_enrollments_due_idx ON sequence_enrollments(status,next_run_at);

CREATE TABLE inbox_read_state (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,thread_id,actor_id)
);

CREATE TABLE delivery_events (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  channel text NOT NULL,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  event text NOT NULL,
  at timestamptz NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX delivery_events_message_idx ON delivery_events(message_id,at);

COMMIT;
