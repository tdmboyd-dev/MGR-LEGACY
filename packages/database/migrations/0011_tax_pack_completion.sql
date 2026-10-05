BEGIN;

CREATE TABLE client_portal_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('open','completed','cancelled')),
  title text NOT NULL,
  due_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX client_portal_requests_client_idx ON client_portal_requests(tenant_id,client_entity_id,status);

CREATE TABLE tax_return_lifecycle (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  return_id text NOT NULL,
  stage text NOT NULL,
  last_reject_code text,
  submitted_at timestamptz,
  accepted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,return_id)
);

CREATE TABLE signature_authorizations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  return_id text NOT NULL,
  form_type text NOT NULL,
  status text NOT NULL,
  signed_at timestamptz,
  signer_id text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bank_product_applications (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  return_id text NOT NULL,
  provider_key text NOT NULL,
  product_type text NOT NULL,
  status text NOT NULL,
  expected_refund numeric(18,2) NOT NULL DEFAULT 0,
  advance_amount numeric(18,2),
  fees numeric(18,2) NOT NULL DEFAULT 0,
  funded_amount numeric(18,2),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE funding_reconciliation (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expected_id text NOT NULL,
  actual_id text,
  expected_amount numeric(18,2) NOT NULL,
  actual_amount numeric(18,2),
  variance numeric(18,2),
  status text NOT NULL,
  reconciled_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
