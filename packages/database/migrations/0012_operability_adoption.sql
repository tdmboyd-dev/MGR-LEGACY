BEGIN;

CREATE TABLE cutover_state (
  source text NOT NULL,
  entity_type text NOT NULL,
  read_authority text NOT NULL CHECK (read_authority IN ('source','legacy')),
  write_mode text NOT NULL CHECK (write_mode IN ('source_only','dual_write','legacy_only')),
  changed_at timestamptz NOT NULL,
  changed_by text NOT NULL,
  PRIMARY KEY (source,entity_type)
);

CREATE TABLE reconciliation_telemetry (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  entity_type text NOT NULL,
  source_count integer NOT NULL,
  legacy_count integer NOT NULL,
  matched integer NOT NULL,
  mismatches integer NOT NULL,
  missing integer NOT NULL,
  duplicates integer NOT NULL,
  parity_percent numeric(7,4) NOT NULL,
  error_rate numeric(7,6) NOT NULL,
  observed_at timestamptz NOT NULL
);
CREATE INDEX reconciliation_telemetry_idx ON reconciliation_telemetry(source,entity_type,observed_at DESC);

CREATE TABLE structured_logs (
  id bigserial PRIMARY KEY,
  level text NOT NULL,
  message text NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  correlation_id text,
  actor_id text,
  component text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL
);
CREATE INDEX structured_logs_tenant_at_idx ON structured_logs(tenant_id,at DESC);

CREATE TABLE metric_samples (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  value numeric(24,8) NOT NULL,
  unit text NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL
);
CREATE INDEX metric_samples_name_at_idx ON metric_samples(name,at DESC);

COMMIT;
