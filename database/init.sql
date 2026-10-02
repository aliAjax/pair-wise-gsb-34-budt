-- 消防设施巡检维保平台（本地数据库，禁止第三方数据源）

CREATE TABLE IF NOT EXISTS building (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT,
  floor_count INTEGER,
  fire_grade TEXT,
  manager_id INTEGER,
  address_code TEXT,
  compliance_rate NUMERIC(5,4) DEFAULT 0,
  qualified_devices INTEGER DEFAULT 0,
  rate_computed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fire_device (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES building(id),
  device_code TEXT UNIQUE,
  device_type TEXT,
  floor TEXT,
  location_desc TEXT,
  install_date DATE,
  status TEXT,                      -- DeviceStatus: NORMAL/FAULT/RECTIFYING/SCRAPPED
  next_maintenance_at TIMESTAMP,
  status_changed_at TIMESTAMP,      -- 物业主管最后一次更新设备状态的时间
  row_version INTEGER DEFAULT 1     -- 乐观锁版本
);

CREATE TABLE IF NOT EXISTS inspection_task (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES building(id),
  inspector_id INTEGER,
  plan_date DATE,
  task_type TEXT,
  status TEXT,                      -- InspectionStatus
  checklist_version TEXT,
  finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_result (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES inspection_task(id),
  device_id INTEGER REFERENCES fire_device(id),
  item_code TEXT,
  result_status TEXT,               -- ResultStatus: QUALIFIED/ABNORMAL/NOT_DONE
  measured_value TEXT,
  photo_url TEXT,
  note TEXT,
  recorded_at TIMESTAMP,            -- 本机记录时间（离线合并新旧判定依据）
  source TEXT DEFAULT 'OFFLINE',    -- OFFLINE/ONLINE/REVIEW_OVERRIDE
  valid BOOLEAN DEFAULT TRUE,       -- 设备状态更新后置 FALSE
  invalid_reason TEXT,
  client_uuid TEXT UNIQUE           -- 离线客户端幂等键
);

CREATE TABLE IF NOT EXISTS hazard_ticket (
  id SERIAL PRIMARY KEY,
  result_id INTEGER REFERENCES inspection_result(id),
  severity TEXT,                    -- HazardSeverity
  owner_id INTEGER,
  deadline DATE,
  rectify_status TEXT,              -- RectifyStatus: OPEN/REPAIRING/RECHECKING/CLOSED
  rectify_note TEXT,
  closed_at TIMESTAMP
);

-- 复核项：设备台账（DEVICE_HISTORY）与合规总览（SYNC_CONFLICT）共用同一份结果
CREATE TABLE IF NOT EXISTS review_item (
  id SERIAL PRIMARY KEY,
  kind TEXT,                        -- ReviewKind: SYNC_CONFLICT/DEVICE_HISTORY/RATE_RECOMPUTE
  ref_type TEXT,
  ref_id INTEGER,
  conflict_type TEXT,               -- DEVICE_STATUS_CHANGED/TICKET_CLOSED/SERVER_NEWER/...
  building_id INTEGER,
  device_id INTEGER,
  task_id INTEGER,
  client_uuid TEXT,
  batch_id TEXT,
  server_snapshot JSONB,
  client_payload JSONB,
  resolution TEXT DEFAULT 'PENDING',
  reviewer_id INTEGER,
  reviewed_at TIMESTAMP,
  review_note TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor TEXT,
  actor_id INTEGER,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  message TEXT,
  created_at TIMESTAMP
);

-- 离线同步批处理轨迹：失败重试时识别已合并/已冲突部分
CREATE TABLE IF NOT EXISTS sync_batch (
  batch_id TEXT PRIMARY KEY,
  inspector_id INTEGER,
  merged_uuids JSONB,
  conflict_uuids JSONB,
  done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_result_device ON inspection_result(device_id);
CREATE INDEX IF NOT EXISTS idx_result_task ON inspection_result(task_id);
CREATE INDEX IF NOT EXISTS idx_review_pending ON review_item(resolution, building_id);
