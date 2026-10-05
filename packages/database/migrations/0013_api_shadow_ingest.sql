BEGIN;

CREATE TABLE shadow_ingest (
  id bigserial PRIMARY KEY,
  source_system text NOT NULL,
  action text NOT NULL,
  tenant_id text,
  user_id text,
  source_id text,
  correlation_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  reconciled boolean NOT NULL DEFAULT false,
  reconciliation_note text
);

CREATE INDEX shadow_ingest_source_idx
  ON shadow_ingest(source_system,action,received_at DESC);

CREATE INDEX shadow_ingest_reconcile_idx
  ON shadow_ingest(reconciled,received_at)
  WHERE reconciled=false;

COMMIT;
