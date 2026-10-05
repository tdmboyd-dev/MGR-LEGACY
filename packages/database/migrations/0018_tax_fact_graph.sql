BEGIN;

CREATE TABLE IF NOT EXISTS tax_facts (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  client_entity_id text NOT NULL,
  tax_year integer NOT NULL,
  form_type text NOT NULL,
  canonical_field text NOT NULL,
  value jsonb NOT NULL,
  confidence numeric(6,5) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  source jsonb NOT NULL,
  extraction jsonb NOT NULL,
  review_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (review_status IN ('unreviewed','accepted','corrected','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  original_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_facts_client_year
  ON tax_facts (tenant_id, client_entity_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_facts_review
  ON tax_facts (tenant_id, review_status, tax_year);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_facts_source_field
  ON tax_facts (tenant_id, client_entity_id, tax_year, form_type, canonical_field, (source->>'documentId'));

CREATE TABLE IF NOT EXISTS tax_fact_review_events (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL,
  fact_id text NOT NULL REFERENCES tax_facts(id) ON DELETE CASCADE,
  reviewer_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('accept','correct','reject')),
  before_value jsonb,
  after_value jsonb,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_fact_review_events_fact
  ON tax_fact_review_events (tenant_id, fact_id, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS tax_filing_approvals (
  tenant_id text NOT NULL,
  return_id text NOT NULL,
  preparer_id text NOT NULL,
  approved_at timestamptz NOT NULL,
  evidence_receipt_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, return_id)
);

COMMIT;
