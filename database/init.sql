-- fire-inspect 本地数据库结构（运行时演示数据由后端内存种子提供，
-- 表结构覆盖离线同步、冲突复核、审计日志与 RBAC 用户）。

CREATE TABLE IF NOT EXISTS app_user (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('INSPECTOR','MAINTAINER','SUPERVISOR','AUDITOR'))
);

CREATE TABLE IF NOT EXISTS building (
  id INTEGER PRIMARY KEY,
  name TEXT,
  campus TEXT,
  floor_count INTEGER,
  fire_grade TEXT,
  manager_id INTEGER,
  address_code TEXT,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS fire_device (
  id INTEGER PRIMARY KEY,
  building_id INTEGER REFERENCES building(id),
  device_code TEXT,
  device_type TEXT,
  floor TEXT,
  location_desc TEXT,
  install_date TEXT,
  status TEXT,
  next_maintenance_at TEXT,
  version INTEGER DEFAULT 1,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS inspection_task (
  id INTEGER PRIMARY KEY,
  building_id INTEGER REFERENCES building(id),
  inspector_id INTEGER REFERENCES app_user(id),
  plan_date TEXT,
  task_type TEXT,
  status TEXT,
  checklist_version TEXT,
  finished_at TEXT,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS inspection_result (
  id INTEGER PRIMARY KEY,
  task_id INTEGER REFERENCES inspection_task(id),
  device_id INTEGER REFERENCES fire_device(id),
  item_code TEXT,
  result_status TEXT CHECK (result_status IN ('NORMAL','ABNORMAL')),
  measured_value TEXT,
  photo_url TEXT,
  note TEXT,
  effective BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  captured_at TEXT,
  reviewed_at TEXT,
  hazard_ticket_id INTEGER
);

CREATE TABLE IF NOT EXISTS hazard_ticket (
  id INTEGER PRIMARY KEY,
  result_id INTEGER REFERENCES inspection_result(id),
  device_id INTEGER REFERENCES fire_device(id),
  severity TEXT,
  owner_id INTEGER REFERENCES app_user(id),
  deadline TEXT,
  rectify_status TEXT CHECK (rectify_status IN ('OPEN','RECTIFYING','REVIEWING','CLOSED')),
  rectify_note TEXT,
  closed_at TEXT,
  version INTEGER DEFAULT 1
);

-- 离线同步批次（部分合并可重试：MERGED 保留，FAILED 重放，CONFLICT 进复核）
CREATE TABLE IF NOT EXISTS sync_batch (
  id TEXT PRIMARY KEY,
  client_meta JSONB,
  submitted_by INTEGER REFERENCES app_user(id),
  status TEXT CHECK (status IN ('MERGING','MERGED','CONFLICT','FAILED')),
  total INTEGER DEFAULT 0,
  merged INTEGER DEFAULT 0,
  conflict INTEGER DEFAULT 0,
  rejected INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_batch_item (
  id SERIAL PRIMARY KEY,
  batch_id TEXT REFERENCES sync_batch(id),
  client_result_id TEXT,
  task_id INTEGER,
  device_id INTEGER,
  item_code TEXT,
  result_status TEXT,
  measured_value TEXT,
  photo_url TEXT,
  note TEXT,
  captured_at TEXT,
  base_device_version INTEGER,
  status TEXT,
  reason TEXT,
  server_result_id INTEGER,
  review_id INTEGER
);

-- 冲突复核项：设备台账与合规总览共用同一份结果
CREATE TABLE IF NOT EXISTS review_item (
  id INTEGER PRIMARY KEY,
  batch_id TEXT REFERENCES sync_batch(id),
  reason TEXT CHECK (reason IN ('DEVICE_STATUS_CHANGED','RESULT_SUPERSEDED','HAZARD_CLOSED')),
  status TEXT CHECK (status IN ('PENDING','KEEP_SERVER','TAKE_CLIENT')),
  task_id INTEGER,
  device_id INTEGER,
  building_id INTEGER,
  item_code TEXT,
  result_status TEXT,
  measured_value TEXT,
  photo_url TEXT,
  note TEXT,
  captured_at TEXT,
  base_device_version INTEGER,
  server_snapshot JSONB,
  submitted_by INTEGER,
  submitted_by_name TEXT,
  resolved_by JSONB,
  resolved_at TEXT,
  server_result_id INTEGER,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  entity TEXT,
  action TEXT,
  actor_id INTEGER,
  actor_name TEXT,
  actor_role TEXT,
  message TEXT,
  created_at TEXT
);
