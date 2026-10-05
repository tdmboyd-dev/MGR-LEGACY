BEGIN;

CREATE TABLE activities (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  activity_type text NOT NULL,
  title text NOT NULL,
  notes text,
  occurred_at timestamptz NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activities_subject_idx ON activities(tenant_id,subject_type,subject_id,occurred_at DESC);

CREATE TABLE service_cases (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  contact_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL,
  priority text NOT NULL,
  sla_due_at timestamptz,
  source text,
  tags text[] NOT NULL DEFAULT '{}',
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE INDEX service_cases_owner_status_idx ON service_cases(tenant_id,owner_actor_id,status);

CREATE TABLE ownership_assignments (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  owner_actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  assigned_by_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  reason text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,resource_type,resource_id)
);

CREATE TABLE preference_records (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  preference_key text NOT NULL,
  value jsonb NOT NULL,
  source text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,subject_type,subject_id,preference_key)
);

CREATE TABLE object_schema_versions (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  version integer NOT NULL CHECK (version>0),
  status text NOT NULL CHECK (status IN ('draft','active','retired')),
  schema jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  retired_at timestamptz,
  PRIMARY KEY (tenant_id,object_key,version)
);

CREATE TABLE retention_policies (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  retention_days integer NOT NULL CHECK (retention_days>=0),
  archive_after_days integer CHECK (archive_after_days IS NULL OR archive_after_days>=0),
  delete_after_days integer CHECK (delete_after_days IS NULL OR delete_after_days>=0),
  legal_hold boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,resource_type)
);

COMMIT;
