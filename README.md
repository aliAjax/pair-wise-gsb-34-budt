# 消防设施巡检维保平台

面向园区和物业公司的消防设备巡检、隐患整改、维保计划和合规台账系统。支持巡检员地下室**断网继续填巡检**、联网后**部分合并与冲突复核**，物业主管更新设备状态后**旧巡检结果失效并自动重算楼栋达标率**，审计员角色**全程只读**。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后：

- 前端：<http://localhost:20103>
- 后端健康检查：<http://localhost:21103/health>
- 演示登录（无需密码，选择角色即可）：
  - 用户 1 王巡检（巡检员 INSPECTOR）
  - 用户 3 赵维保（维保商 MAINTAINER）
  - 用户 4 钱主管（物业主管 SUPERVISOR）
  - 用户 5 孙审计（审计员 AUDITOR，只读）

## 核心业务规则（与代码对应）

1. **断网可继续填、联网合并**：巡检结果先写入浏览器本机队列（`frontend/src/api/offlineQueue.ts`，每条带 `client_uuid`），`online` 事件触发 `syncEngine.ts` 整批 POST `/api/inspection-result/sync`；后端按 `client_uuid` 幂等合并。
2. **主管更新设备状态 → 旧结果失效 + 达标率重算**：`PATCH /api/fire-device/{id}/status`（带 `expected_version` 乐观锁）把早于状态更新时间的巡检结果置为 `valid=false`，生成 `DEVICE_HISTORY` 复核项，并重算该楼栋 `compliance_rate`（见 `services/fire_device_service.py`、`services/compliance_service.py`）。
3. **已关闭隐患单不能被旧记录覆盖**：同步时发现结果关联的隐患单已 `CLOSED`，只生成 `TICKET_CLOSED` 冲突项转人工复核，绝不写入现场数据。另外还识别 `DEVICE_STATUS_CHANGED` 与 `SERVER_NEWER` 两类冲突。
4. **同步失败保留已合并部分并重试**：单条异常只进入响应的 `failed`，已 `merged` 的不回滚；前端重试时已合并项幂等跳过、`failed` 项继续留在本机队列。
5. **审计员只读 / 代补录拒绝**：`rbac_middleware.require_roles(...)` 拦截所有写接口；同步批次中只要有一条任务不属于本人巡检员，整批拒绝（错误码 `PROXY_FILL_DENIED`，HTTP 403），不允许部分写入。
6. **设备台账与合规总览共用同一份复核结果**：两端都调用 `GET /api/review-item` 与唯一的 `ReviewItemStore`；主管可 `CONFIRMED`（维持现场）或 `OVERRIDDEN`（把本机/历史记录回写，来源标记 `REVIEW_OVERRIDE`）。

## 访问地址或 CLI 示例

```bash
# 登录获取 JWT
curl -X POST http://localhost:21103/api/auth/login \
  -H 'Content-Type: application/json' -d '{"user_id":1}'

# 离线结果批量合并（带 Bearer Token）
curl -X POST http://localhost:21103/api/inspection-result/sync \
  -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' \
  -d '{"batch_id":"b1","source":"OFFLINE","items":[{"client_uuid":"u1","task_id":1,"device_id":1,"item_code":"PRESSURE","result_status":"QUALIFIED","measured_value":"1.2MPa","recorded_at":"2026-10-02T08:00:00Z"}]}'
```

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`（Vite 端口 20103）
- 后端：`cd backend && pip install -r requirements.txt && uvicorn src.main:app --reload --port 8000`
- 后端测试：`cd backend && python -m pytest tests/ -q`（11 个端到端场景测试）
- 接口统一挂在 `/api`，前端只请求相对路径，由 nginx 反代到后端。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Zustand（本地状态/离线队列） |
| 后端 | FastAPI + Python 3.11 + Pydantic 2 + python-jose(JWT) |
| 数据库 | PostgreSQL 15（`database/init.sql`，运行期为进程内可变仓储，表结构一致） |
| 部署 | Docker Compose（frontend/backend/db 三服务） |

## 项目目录结构

```text
frontend/src/
├── api/            # http 封装、auth、离线队列 offlineQueue、syncEngine、按实体接口
├── stores/         # ReviewItemStore（台账/总览共用）、OfflineStore 及各实体 store
├── types/          # 共享类型（含 ReviewItem / Sync / AuditLog）
├── constants/      # 枚举、错误码、错误文案、日志模板、状态文案
├── constructors/   # 各实体默认/表单构造器、PendingResultConstructor
├── components/common/  # StatusBadge/HazardSeverityTag/ChecklistPanel/DeviceLocationCell/
│                       # TimelineList/StatCard/EmptyState/ReviewItemCard
├── hooks/          # useChecklistProgress、useHazardFlow、useConnectivity、useRbac、usePagination
├── pages/          # Dashboard/Devices/Tasks/Hazards/Reports
├── router/         # 路由元信息（角色可见性）
├── utils/          # formatters（日期/数字/状态/冲突文案混合）
└── mocks/          # 本地种子数据

backend/src/
├── routes/         # auth、building、fire_device、inspection_task/result、hazard_ticket、review_item
├── controllers/    # 按实体拆分，只做参数编排
├── services/       # 核心：inspection_result_service(同步合并)、fire_device_service、
│                   #       compliance_service(达标率)、review_item_service(共享复核)、audit_service
├── models/         # Pydantic 领域模型
├── repositories/   # 数据访问层（含 review_item / audit_log）
├── middlewares/    # auth(JWT)、rbac、error_handler、rate_limit、request_logger、audit_log
├── constants/      # 枚举、error_codes、error_messages、log_templates、exceptions
├── constructors/   # DTO/复核项/同步报告工厂
├── types/          # 请求 Payload（pydantic）
├── config/         # settings、security(JWT)
└── db.py / seed.py # 进程内可变表 + 本地种子
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名，默认 `fire-inspect`
- `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT`：端口，默认 `20103` / `21103` / `54320`
- `DB_NAME` / `DB_USER` / `DB_PASSWORD`：数据库凭据
- `JWT_SECRET` / `JWT_EXPIRE_MINUTES`：JWT 密钥与有效期
- `RATE_LIMIT_WINDOW_SECONDS` / `RATE_LIMIT_MAX_REQUESTS`：接口限流窗口与上限
- `SYNC_MAX_RETRY`：离线批次最大重试次数

## Docker 部署说明

- 顶层 `name: fire-inspect`，容器名统一 `${COMPOSE_PROJECT_NAME:-fire-inspect}-*` 前缀，不写 `version:`。
- 数据库使用命名卷 `db_data`，避免绑定挂载到中文路径；db 带 `pg_isready` healthcheck，backend `depends_on: condition: service_healthy`。
- backend healthcheck 使用镜像内 python（slim 镜像无 wget/curl）；frontend 依赖 backend 健康后启动。
- 常见问题：端口占用改 `.env`；重置数据执行 `docker compose down -v`。

## 枚举/常量出现位置清单

| 枚举 | 后端 | 前端 |
|---|---|---|
| DeviceType（EXTINGUISHER/HYDRANT/SMOKE_DETECTOR/SPRINKLER/EXIT_LIGHT） | `constants/device_type.py`、种子、工厂、类型 | `constants/DeviceType.ts`、`types/DeviceType.ts`、种子、设备页筛选/展示 |
| InspectionStatus（PLANNED/IN_PROGRESS/SUBMITTED/REVIEWED/OVERDUE） | `constants/inspection_status.py`、task service 状态流转、日志模板 | `constants/InspectionStatus.ts`、任务页 StatusBadge、`statusText.ts` |
| HazardSeverity（LOW/MEDIUM/HIGH/CRITICAL） | `constants/hazard_severity.py`、`utils/formatters.py` | `constants/HazardSeverity.ts`、HazardSeverityTag、隐患页/总览 |
| DeviceStatus（NORMAL/FAULT/RECTIFYING/SCRAPPED，新增） | `constants/device_status.py`、达标率计算、设备状态更新、SQL、formatters | `constants/DeviceStatus.ts`、台账页状态弹窗/徽标、构造器 |
| ResultStatus（QUALIFIED/ABNORMAL/NOT_DONE，新增） | `constants/result_status.py`、同步合并、达标率 | `constants/ResultStatus.ts`、ChecklistPanel、结果历史表 |
| RectifyStatus（OPEN/REPAIRING/RECHECKING/CLOSED，新增） | `constants/rectify_status.py`、隐患关闭/冲突判定 | `constants/RectifyStatus.ts`、隐患页、`statusText.ts` |
| UserRole（INSPECTOR/MAINTAINER/SUPERVISOR/AUDITOR，新增） | `constants/user_role.py`、security、rbac、路由守卫、错误码 | `constants/UserRole.ts`、useRbac、main.tsx 登录栏、按钮显隐 |
| 冲突/复核（DEVICE_STATUS_CHANGED/TICKET_CLOSED/SERVER_NEWER，新增） | review_kind、同步服务、工厂、`log_templates.py` | `constants/Review.ts`、ReviewItemCard、总览/台账复核面板 |

错误码新增：`PROXY_FILL_DENIED`、`TICKET_CLOSED_CONFLICT`、`STALE_VERSION`、`AUTH_INVALID`、`RATE_LIMITED`，前后端 `errorCodes`/`errorMessages` 与后端 `constants/exceptions.py` 三处同步。

## 为什么会牵一发动全身

- 一个设备状态的变化会同时触发：旧结果失效（result 表）、`DEVICE_HISTORY` 复核项（review 表）、楼栋达标率重算（building）、审计日志、前端台账与总览两处刷新。
- 枚举/错误码/日志模板在前后端各有一份，且被构造器、service、controller、store、组件、`formatters`、`statusText` 多层直接引用；改一个状态值必须同步多处。
- 复核结果只有一份（后端 `review_item` 表 + 前端 `ReviewItemStore`），台账页与总览页的任何展示/裁决改动都互相影响。

## License

MIT
