"""离线合并 / 冲突复核 / RBAC / 达标率 端到端场景测试。

运行：cd backend && python -m pytest tests/ -q
"""
import pytest

from fastapi.testclient import TestClient

from src.db import db
from src.main import app


@pytest.fixture()
def client():
    db.reset()
    return TestClient(app, raise_server_exceptions=False)


def _token(client, uid):
    return client.post("/api/auth/login", json={"user_id": uid}).json()["token"]


@pytest.fixture()
def auth(client):
    return {
        "inspector": {"Authorization": f"Bearer {_token(client, 1)}"},
        "inspector2": {"Authorization": f"Bearer {_token(client, 2)}"},
        "supervisor": {"Authorization": f"Bearer {_token(client, 4)}"},
        "auditor": {"Authorization": f"Bearer {_token(client, 5)}"},
    }


def _result_item(client_uuid, task_id, device_id, item_code, recorded_at,
                 status="QUALIFIED", measured="1.1MPa"):
    return {
        "client_uuid": client_uuid, "task_id": task_id, "device_id": device_id,
        "item_code": item_code, "result_status": status,
        "measured_value": measured, "recorded_at": recorded_at,
    }


# 1. 基本鉴权 ----------------------------------------------------------------

def test_health_and_auth(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.post("/api/inspection-result/sync",
                       json={"batch_id": "b", "items": []}).status_code == 401
    assert client.post("/api/inspection-result/sync",
                       headers={"Authorization": "Bearer garbage"},
                       json={"batch_id": "x", "items": []}).status_code == 401


# 5. 审计员只读 --------------------------------------------------------------

def test_auditor_is_read_only(client, auth):
    r = client.patch("/api/fire-device/1/status", headers=auth["auditor"],
                     json={"status": "FAULT"})
    assert r.status_code == 403 and r.json()["code"] == "RBAC_DENIED"
    assert client.get("/api/review-item", headers=auth["auditor"]).status_code == 200


# 6. 代巡检员补录被拒绝（整批拒绝，不允许部分写入） ---------------------------

def test_proxy_fill_rejected_entire_batch(client, auth):
    before = len(db.table("inspectionResult"))
    r = client.post("/api/inspection-result/sync", headers=auth["inspector2"], json={
        "batch_id": "proxy1",
        "items": [_result_item("u-proxy", 1, 1, "PRESSURE", "2026-10-02T08:00:00+00:00")],
    })
    assert r.status_code == 403 and r.json()["code"] == "PROXY_FILL_DENIED"
    assert len(db.table("inspectionResult")) == before

    # 混入别人任务的批次同样整批拒绝
    before = len(db.table("inspectionResult"))
    r = client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "mix1",
        "items": [
            _result_item("m1", 1, 5, "EXIT_SIGN", "2026-10-02T09:00:00+00:00"),
            _result_item("m2", 2, 3, "SMOKE_TEST", "2026-10-02T09:00:00+00:00"),
        ],
    })
    assert r.status_code == 403
    assert len(db.table("inspectionResult")) == before


# 1 + 4. 离线合并 + 失败重试幂等（已合并部分保留） ----------------------------

def test_offline_merge_and_retry_idempotent(client, auth):
    r = client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "ok1", "submit_task": True,
        "items": [_result_item("u-1", 1, 1, "PRESSURE", "2026-10-02T08:00:00+00:00")],
    })
    rep = r.json()
    assert rep["merged_count"] == 1 and rep["task_submitted"] == 1

    # 重试：已合并项跳过、不重复写入
    rep = client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "ok1",
        "items": [_result_item("u-1", 1, 1, "PRESSURE", "2026-10-02T08:00:00+00:00")],
    }).json()
    assert rep["merged"] == [] and rep["skipped"] == ["u-1"]
    assert len([x for x in db.table("inspectionResult") if x.get("client_uuid") == "u-1"]) == 1


# 3. 隐患单已关闭：不覆盖现场，只保留冲突项 ------------------------------------

def test_closed_ticket_conflict_not_overwritten(client, auth):
    r = client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "closed1",
        "items": [_result_item("u-closed", 1, 4, "WATER_PRESSURE",
                               "2026-10-02T08:30:00+00:00", status="ABNORMAL",
                               measured="0.01MPa")],
    })
    rep = r.json()
    assert rep["merged_count"] == 0
    assert rep["conflicts"][0]["conflict_type"] == "TICKET_CLOSED"
    review = db.table("reviewItem")[0]
    assert review["server_snapshot"]["rectify_status"] == "CLOSED"
    assert review["client_payload"]["client_uuid"] == "u-closed"


# 2. 主管更新设备状态 -> 旧结果失效 + 达标率重算 + DEVICE_HISTORY 复核 ----------

def test_device_status_invalidates_and_recomputes(client, auth):
    r = client.patch("/api/fire-device/1/status", headers=auth["supervisor"],
                     json={"status": "FAULT", "note": "主管更新"})
    assert r.status_code == 200
    device = [d for d in client.get("/api/fire-device").json() if d["id"] == 1][0]
    assert device["status"] == "FAULT" and device["row_version"] == 4

    invalids = [x for x in client.get("/api/inspection-result?device_id=1").json()
                if not x["valid"]]
    assert invalids and all(x["invalid_reason"] for x in invalids)

    assert [x for x in db.table("reviewItem") if x["kind"] == "DEVICE_HISTORY"]

    overview = client.get("/api/building/overview", headers=auth["supervisor"]).json()
    b1 = [b for b in overview if b["id"] == 1][0]
    assert b1["compliance_rate"] == 0.0 and b1["pending_reviews"] >= 1

    # 乐观锁版本
    r = client.patch("/api/fire-device/1/status", headers=auth["supervisor"],
                     json={"status": "SCRAPPED", "expected_version": 1})
    assert r.status_code == 409


def test_device_status_changed_sync_conflict(client, auth):
    client.patch("/api/fire-device/1/status", headers=auth["supervisor"],
                 json={"status": "FAULT"})
    rep = client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "dc1",
        "items": [_result_item("u-dev", 1, 1, "LABEL", "2026-10-01T08:00:00+00:00")],
    }).json()
    assert rep["conflicts"][0]["conflict_type"] == "DEVICE_STATUS_CHANGED"


def test_server_newer_conflict(client, auth):
    # device 3 为 NORMAL（无设备状态冲突），服务端已有 2026-09-20 更新的 SMOKE_TEST
    rep = client.post("/api/inspection-result/sync", headers=auth["inspector2"], json={
        "batch_id": "stale1",
        "items": [_result_item("u-stale", 2, 3, "SMOKE_TEST",
                               "2026-09-10T08:00:00+00:00")],
    }).json()
    assert rep["conflicts"][0]["conflict_type"] == "SERVER_NEWER"


# 7. 同一份复核结果：台账页与总览读同一数据源；裁决可回写 -----------------------

def test_shared_review_resolution(client, auth):
    client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "closed1",
        "items": [_result_item("u-closed", 1, 4, "WATER_PRESSURE",
                               "2026-10-02T08:30:00+00:00", status="ABNORMAL")],
    })
    review = client.get("/api/review-item").json()[0]
    assert client.get(f"/api/review-item?building_id={review['building_id']}").json()

    # 审计员不能裁决
    assert client.post(f"/api/review-item/{review['id']}/resolve",
                       headers=auth["auditor"],
                       json={"resolution": "CONFIRMED"}).status_code == 403

    # OVERRIDDEN 把客户端数据补写回业务表（来源 REVIEW_OVERRIDE）
    before = len(client.get("/api/inspection-result").json())
    assert client.post(f"/api/review-item/{review['id']}/resolve",
                       headers=auth["supervisor"],
                       json={"resolution": "OVERRIDDEN", "note": "复查确认"}).status_code == 200
    after = client.get("/api/inspection-result").json()
    assert len(after) == before + 1 and after[-1]["source"] == "REVIEW_OVERRIDE"

    # 已裁决不能重复处理
    r = client.post(f"/api/review-item/{review['id']}/resolve",
                    headers=auth["supervisor"], json={"resolution": "CONFIRMED"})
    assert r.status_code == 422


# 横切：审计日志 --------------------------------------------------------------

def test_audit_logs_capture_write_actions(client, auth):
    client.post("/api/inspection-result/sync", headers=auth["inspector"], json={
        "batch_id": "ok1",
        "items": [_result_item("u-1", 1, 1, "PRESSURE", "2026-10-02T08:00:00+00:00")],
    })
    client.patch("/api/fire-device/1/status", headers=auth["supervisor"],
                 json={"status": "FAULT"})
    logs = client.get("/api/auth/audit-logs", headers=auth["auditor"]).json()
    actions = {l["action"] for l in logs if isinstance(l, dict)}
    assert "InspectionResult.offline_merge" in actions
    assert "FireDevice.status" in actions
    assert "Building.recompute_rate" in actions
    # 巡检员无权看审计日志
    assert client.get("/api/auth/audit-logs", headers=auth["inspector"]).status_code == 403


# 横切：限流 ------------------------------------------------------------------

def test_rate_limit(client, monkeypatch):
    import src.config.settings as settings

    monkeypatch.setattr(settings, "RATE_LIMIT_MAX_REQUESTS", 3)
    codes = [client.get("/api/fire-device").status_code for _ in range(6)]
    assert 429 in codes
