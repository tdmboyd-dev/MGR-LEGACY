BEGIN;

CREATE TABLE extension_installations (
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  extension_id text NOT NULL,
  version text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','active','disabled')),
  manifest jsonb NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,extension_id,version)
);

CREATE TABLE extension_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  extension_id text NOT NULL,
  event_type text NOT NULL,
  url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX extension_webhooks_lookup_idx
  ON extension_webhooks(tenant_id,extension_id,event_type,enabled);

COMMIT;
