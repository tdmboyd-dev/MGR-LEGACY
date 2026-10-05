BEGIN;

CREATE TABLE saved_reports (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  definition jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE goals (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  scope_type text NOT NULL,
  scope_id text NOT NULL,
  metric_key text NOT NULL,
  target numeric(24,8) NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_scope_idx ON goals(tenant_id,scope_type,scope_id,period_start,period_end);

CREATE TABLE tax_required_documents (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  document_code text NOT NULL,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  received boolean NOT NULL DEFAULT false,
  requested_at timestamptz,
  received_at timestamptz,
  PRIMARY KEY (tenant_id,client_entity_id,tax_year,document_code)
);

CREATE TABLE tax_fee_allocations (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  return_id text NOT NULL,
  participant_id text NOT NULL,
  allocation_type text NOT NULL,
  allocation_value numeric(18,6) NOT NULL,
  calculated_amount numeric(18,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tax_credential_status (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preparer_id text NOT NULL,
  ptin_valid boolean NOT NULL DEFAULT false,
  efin_linked boolean NOT NULL DEFAULT false,
  ce_complete boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  issues text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,preparer_id)
);

COMMIT;
