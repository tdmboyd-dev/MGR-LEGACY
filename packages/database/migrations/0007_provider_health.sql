BEGIN;

CREATE TABLE provider_health_samples (
  id bigserial PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  channel text NOT NULL,
  healthy boolean NOT NULL,
  latency_ms integer,
  failure_count integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX provider_health_lookup_idx
  ON provider_health_samples(provider_key,channel,observed_at DESC);

CREATE TABLE provider_routing_state (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  channel text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  consecutive_failures integer NOT NULL DEFAULT 0,
  circuit_state text NOT NULL DEFAULT 'closed'
    CHECK (circuit_state IN ('closed','open','half_open')),
  opened_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,provider_key,channel)
);

COMMIT;
