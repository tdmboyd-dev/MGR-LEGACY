BEGIN;

CREATE TABLE pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  stage_order integer NOT NULL,
  probability integer CHECK (probability BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, stage_order)
);

CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  contact_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  company_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  title text NOT NULL,
  value numeric(18,2) NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('open','won','lost','abandoned')),
  probability integer NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close_at timestamptz,
  closed_at timestamptz,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_tenant_pipeline_idx ON opportunities(tenant_id, pipeline_id, stage_id);
CREATE INDEX opportunities_owner_idx ON opportunities(owner_actor_id);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('open','in_progress','blocked','done','cancelled')),
  priority integer NOT NULL DEFAULT 0,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_owner_due_idx ON tasks(tenant_id, owner_actor_id, due_at);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_actor_id uuid REFERENCES actors(id) ON DELETE SET NULL,
  contact_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('tentative','confirmed','completed','cancelled','no_show')),
  meeting_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX bookings_owner_start_idx ON bookings(tenant_id, owner_actor_id, start_at);

COMMIT;
