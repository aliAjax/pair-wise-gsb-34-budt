# 消防设施巡检维保平台

面向园区和物业公司的消防设备巡检、隐患整改、维保计划和合规台账系统。

## 本轮业务能力（离线同步 / 冲突复核 / RBAC）

1. **地下室断网巡检**：巡检员在 `/tasks` 填写检查项，结果先写入本机离线队列（localStorage，按 `client_result_id` 幂等）；浏览器恢复联网后自动提交 `/api/sync/batches` 合并回消防设备台账。
2. **主管改状态触发失效与重算**：`PATCH /api/fire-device/{id}/status`（仅物业主管）会把该设备历史有效巡检结果全部置为失效（`effective=false`、版本号 +1），并立即重算楼栋达标率；`/dashboard` 与 `/devices` 共用 `compliance_service` 同一份计算结果。
3. **隐患已关闭不得被旧记录覆盖**：离线异常结果若对应设备的整改单已复验关闭，同步时生成 `HAZARD_CLOSED` 冲突，只保留冲突项进入复核，不修改设备、不覆盖结果；复核选择“采用巡检员记录”时另开新隐患单，旧关闭单原样保留。
4. **部分失败可重试**：同步按条目独立落库，`MERGED` 立即生效、`FAILED` 保留在批次/本机，`POST /api/sync/batches/{id}/retry` 只重放失败项，已合并部分不重复入账。
5. **RBAC**：JWT 登录（`/api/auth/login`），审计员 `AUDITOR` 全站只读（路由守卫 + 按钮隐藏 + 后端 `rbac_middleware` 三层拦截）；只有任务本人巡检员能提交结果，主管/维保商代补录整批返回 `403 PROXY_FORBIDDEN`；冲突复核仅物业主管可处置。
6. **同一份复核结果**：设备台账页与合规总览页共用 `ReviewConflictPanel` 组件与 `GET /api/reviews` 数据。

演示账号：`inspector/inspect123`（巡检员）、`maintainer/maintain123`（维保商）、`supervisor/super123`（物业主管）、`auditor/audit123`（审计员）。
后端端到端校验：`cd backend && python3 check_scenarios.py`。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20103>

后端健康检查：<http://localhost:21103/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Material UI + Redux Toolkit |
| 后端 | FastAPI + Python 3.11 + SQLAlchemy 2.0 |
| 数据库 | PostgreSQL 15 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `fire-inspect`
- `FRONTEND_PORT`: 前端端口，默认 `20103`
- `BACKEND_PORT`: 后端端口，默认 `21103`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: fire-inspect`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-fire-inspect}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- DeviceType: constants/DeviceType、types/DeviceType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- InspectionStatus: constants/InspectionStatus、types/InspectionStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- HazardSeverity: constants/HazardSeverity、types/HazardSeverity、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- 本轮新增：
  - 角色 `INSPECTOR/MAINTAINER/SUPERVISOR/AUDITOR`：后端 `constants/user_role.py`、`middlewares/rbac_middleware.py`、`routes/sync_routes.py`；前端 `constants/Role.ts`、`stores/AuthStore.ts`、`router/RouteGuard.tsx`、各页面按钮显隐。
  - 同步/复核状态（`MERGED/CONFLICT/FAILED/RESOLVED`、`KEEP_SERVER/TAKE_CLIENT`、`DEVICE_STATUS_CHANGED/RESULT_SUPERSEDED/HAZARD_CLOSED`）：后端 `constants/sync_status.py`、`services/sync_service.py`、`services/review_service.py`、`constants/log_templates.py`、`constants/error_codes.py`、`constants/error_messages.py`、`constructors/sync_factory.py`、`database/init.sql`；前端 `constants/SyncStatus.ts`、`types/Sync.ts`、`api/Sync.ts`、`stores/SyncStore.ts`、`components/common/ReviewConflictPanel.tsx`。
  - 设备状态 `NORMAL/FAULT/MAINTAINING/SCRAPPED`：达标率判定、主管改状态、冲突快照与 `database/init.sql`。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
