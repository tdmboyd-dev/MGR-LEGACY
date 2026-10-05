BEGIN;

CREATE TABLE tax_office_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hierarchy_node_id uuid NOT NULL REFERENCES hierarchy_nodes(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('service_bureau','child_bureau','ero_office','preparer')),
  efin text,
  ptin text,
  credentials_ready boolean NOT NULL DEFAULT false,
  bank_products_configured boolean NOT NULL DEFAULT false,
  training_complete boolean NOT NULL DEFAULT false,
  compliance_issue_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tax_client_lifecycle (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tax_year integer NOT NULL CHECK (tax_year BETWEEN 1900 AND 3000),
  stage text NOT NULL,
  assigned_office_id uuid REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
  assigned_preparer_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  missing_documents text[] NOT NULL DEFAULT '{}',
  signature_complete boolean NOT NULL DEFAULT false,
  return_status text,
  bank_product_status text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, client_entity_id, tax_year)
);

COMMIT;
