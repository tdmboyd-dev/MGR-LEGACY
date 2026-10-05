BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hierarchy_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES hierarchy_nodes(id) ON DELETE RESTRICT,
  node_type text NOT NULL CHECK (node_type IN ('organization','workspace','bureau','office','team')),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hierarchy_nodes_tenant_idx ON hierarchy_nodes(tenant_id);
CREATE INDEX hierarchy_nodes_parent_idx ON hierarchy_nodes(parent_id);

CREATE TABLE actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('user','agent','service')),
  external_key text,
  display_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, actor_type, external_key)
);

CREATE TABLE entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  object_key text,
  display_name text NOT NULL,
  owner_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  lifecycle_state text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX entities_tenant_type_idx ON entities(tenant_id, entity_type);
CREATE INDEX entities_owner_idx ON entities(owner_actor_id);
CREATE INDEX entities_attributes_gin_idx ON entities USING gin(attributes);

CREATE TABLE relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  valid_from timestamptz,
  valid_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_entity_id <> to_entity_id)
);
CREATE INDEX relationships_from_idx ON relationships(tenant_id, from_entity_id);
CREATE INDEX relationships_to_idx ON relationships(tenant_id, to_entity_id);

CREATE TABLE object_definitions (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  label text NOT NULL,
  plural_label text NOT NULL,
  definition jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, object_key, version)
);

CREATE TABLE idempotency_keys (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  command_id text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (tenant_id, idempotency_key)
);

CREATE TABLE event_ledger (
  sequence_no bigserial PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  scope_type text NOT NULL,
  scope_id text NOT NULL,
  event_type text NOT NULL,
  event_version integer NOT NULL CHECK (event_version > 0),
  occurred_at timestamptz NOT NULL,
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  source text NOT NULL,
  correlation_id text NOT NULL,
  causation_id text,
  idempotency_key text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX event_ledger_subject_idx ON event_ledger(tenant_id, subject_type, subject_id, sequence_no);
CREATE INDEX event_ledger_correlation_idx ON event_ledger(tenant_id, correlation_id, sequence_no);
CREATE INDEX event_ledger_type_idx ON event_ledger(tenant_id, event_type, occurred_at DESC);

CREATE TABLE outbox (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES event_ledger(event_id) ON DELETE CASCADE,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_ready_idx ON outbox(available_at) WHERE published_at IS NULL;

CREATE TABLE audit_entries (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_type text NOT NULL,
  actor_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  decision text NOT NULL,
  reason text,
  correlation_id text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entries_tenant_created_idx ON audit_entries(tenant_id, created_at DESC);

COMMIT;
