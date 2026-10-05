BEGIN;

CREATE TABLE workflow_checkpoints (
  run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  workflow_id uuid NOT NULL,
  workflow_version integer NOT NULL,
  attempt integer NOT NULL DEFAULT 1 CHECK (attempt > 0),
  status text NOT NULL CHECK (status IN ('pending','running','succeeded','failed','waiting')),
  input jsonb,
  output jsonb,
  error text,
  next_attempt_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id,node_id)
);

CREATE INDEX workflow_checkpoints_resume_idx
  ON workflow_checkpoints(status,next_attempt_at)
  WHERE status IN ('pending','waiting');

CREATE TABLE workflow_replay_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_run_id uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL,
  workflow_version integer NOT NULL,
  from_node_id text,
  reason text NOT NULL,
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  replay_run_id uuid REFERENCES workflow_runs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','running','completed','failed','cancelled'))
);

CREATE INDEX workflow_replay_source_idx
  ON workflow_replay_requests(source_run_id,requested_at DESC);

COMMIT;
