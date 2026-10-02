"""端到端场景校验（内存数据，TestClient）。

覆盖：
1. 登录/JWT；审计员只读；代巡检补录拒绝
2. 离线正常结果合并 + 隐患已关闭旧异常记录冲突保留
3. 主管改设备状态 → 旧结果失效 → 楼栋达标率重算
4. 复核 KEEP_SERVER / TAKE_CLIENT（关闭单不重开）
5. 批次部分失败保留已合并 + 重试
6. 设备台账与合规总览同源
"""

from fastapi.testclient import TestClient

from src.main import app
from src.repositories import store

client = TestClient(app)


def login(username, password):
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def run():
    store.reset()
    inspector = login("inspector", "inspect123")
    supervisor = login("supervisor", "super123")
    auditor = login("auditor", "audit123")
    maintainer = login("maintainer", "maintain123")

    # --- 无 token 401 / 审计员只读 403 ---
    assert client.get("/api/fire-device").status_code == 401
    r = client.patch("/api/fire-device/1/status", json={"status": "FAULT"}, headers=auth(auditor))
    assert r.status_code == 403 and r.json()["code"] == "RBAC_DENIED", r.text

    # 初始达标率：1号楼 d1,d2 均无有效结果 -> 0%；2号楼 d3 NORMAL、d4 异常结果已失效(漏检) -> 50%
    overview = {b["building_id"]: b for b in client.get("/api/building/overview", headers=auth(auditor)).json()}
    assert overview[1]["compliance_rate"] == 0.0, overview[1]
    assert overview[2]["compliance_rate"] == 50.0, overview[2]

    # --- 地下室离线巡检：任务1，设备1 NORMAL，设备2 NORMAL ---
    batch = {
        "batch_id": "offline-001",
        "client_meta": {"device": "巡检手机A", "offline_since": "2026-10-02T08:00:00Z"},
        "items": [
            {"client_result_id": "c-1", "task_id": 1, "device_id": 1, "item_code": "HYDRANT_PRESSURE",
             "result_status": "NORMAL", "measured_value": "0.35MPa", "note": "地下室消火栓正常",
             "captured_at": "2026-10-02T09:10:00Z", "base_device_version": 1},
            {"client_result_id": "c-2", "task_id": 1, "device_id": 2, "item_code": "GAUGE",
             "result_status": "NORMAL", "measured_value": "绿区", "note": "灭火器压力正常",
             "captured_at": "2026-10-02T09:20:00Z", "base_device_version": 1},
        ],
    }
    r = client.post("/api/sync/batches", json=batch, headers=auth(inspector))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["merged"] == 2 and body["conflict"] == 0 and body["status"] == "MERGED", body
    # 达标率重算 -> 1号楼 100%
    overview = {b["building_id"]: b for b in client.get("/api/building/overview", headers=auth(supervisor)).json()}
    assert overview[1]["compliance_rate"] == 100.0, overview[1]

    # --- 代巡检补录：主管替巡检员提交整批 -> 403 PROXY_FORBIDDEN ---
    proxy = {"batch_id": "proxy-001", "items": [dict(batch["items"][0], client_result_id="c-9")]}
    r = client.post("/api/sync/batches", json=proxy, headers=auth(supervisor))
    assert r.status_code == 403 and r.json()["code"] == "PROXY_FORBIDDEN", r.text
    # 维保商写结果被角色在路由层拒绝
    r = client.post("/api/sync/batches", json=batch, headers=auth(maintainer))
    assert r.status_code == 403 and r.json()["code"] == "RBAC_DENIED", r.text

    # 混合批次：本人条目正常合并，夹带的非法任务条目逐条 FAILED，已合并部分保留
    mixed = {"batch_id": "mixed-001", "items": [
        {"client_result_id": "c-m1", "task_id": 3, "device_id": 1, "item_code": "HYDRANT_PRESSURE",
         "result_status": "NORMAL", "measured_value": "0.33MPa",
         "captured_at": "2026-10-03T09:00:00Z", "base_device_version": 1},
        {"client_result_id": "c-m2", "task_id": 999, "device_id": 1, "item_code": "X",
         "result_status": "NORMAL", "captured_at": "2026-10-03T09:05:00Z"},
    ]}
    r = client.post("/api/sync/batches", json=mixed, headers=auth(inspector)).json()
    assert r["merged"] == 1 and r["failed"] == 1, r

    # --- 主管改 d2 状态为 FAULT：旧巡检结果失效，达标率重算回 50% ---
    r = client.patch("/api/fire-device/2/status", json={"status": "FAULT"}, headers=auth(supervisor))
    assert r.status_code == 200, r.text
    overview = {b["building_id"]: b for b in client.get("/api/building/overview", headers=auth(auditor)).json()}
    assert overview[1]["compliance_rate"] == 50.0, overview[1]
    results = client.get("/api/inspection-result?device_id=2", headers=auth(inspector)).json()
    assert all(not x["effective"] for x in results), results

    # 巡检员拿着旧版本号/旧时间再提交 d2 正常 -> DEVICE_STATUS_CHANGED 冲突，保留等复核
    stale = {"batch_id": "offline-002", "items": [
        {"client_result_id": "c-3", "task_id": 1, "device_id": 2, "item_code": "GAUGE",
         "result_status": "NORMAL", "measured_value": "绿区", "note": "断网时录的旧结果",
         "captured_at": "2026-10-02T09:25:00Z", "base_device_version": 1}]}
    r = client.post("/api/sync/batches", json=stale, headers=auth(inspector)).json()
    assert r["status"] == "CONFLICT" and r["conflict"] == 1, r
    review_id = next(i["review_id"] for i in r["items"] if i["status"] == "CONFLICT")
    reviews = client.get("/api/reviews?status=PENDING", headers=auth(supervisor)).json()
    assert any(x["id"] == review_id and x["reason"] == "DEVICE_STATUS_CHANGED" for x in reviews)

    # 主管选择保留现场 KEEP_SERVER：设备仍 FAULT，不被旧记录覆盖
    r = client.post(f"/api/reviews/{review_id}/resolve", json={"decision": "KEEP_SERVER"}, headers=auth(supervisor))
    assert r.status_code == 200, r.text
    d2 = next(d for d in client.get("/api/fire-device", headers=auth(auditor)).json() if d["id"] == 2)
    assert d2["status"] == "FAULT" and d2["compliance"]["compliant"] is False

    # 审计员尝试复核 -> 403
    r = client.post(f"/api/reviews/{review_id}/resolve", json={"decision": "TAKE_CLIENT"}, headers=auth(auditor))
    assert r.status_code == 403

    # --- 隐患整改单已关闭：旧异常记录同步 -> HAZARD_CLOSED 冲突 ---
    closed = {"batch_id": "offline-003", "items": [
        {"client_result_id": "c-4", "task_id": 2, "device_id": 4, "item_code": "VALVE_CHECK",
         "result_status": "ABNORMAL", "measured_value": "阀组锈蚀", "note": "地下室旧异常（断网前）",
         "captured_at": "2026-09-15T10:20:00Z", "base_device_version": 2}]}
    r = client.post("/api/sync/batches", json=closed, headers=auth(inspector)).json()
    assert r["status"] == "CONFLICT" and r["conflict"] == 1, r
    rid = next(i["review_id"] for i in r["items"] if i["reason"] == "HAZARD_CLOSED")
    tickets_before = len(client.get("/api/hazard-ticket", headers=auth(auditor)).json())
    # 采用客户端 -> 旧单不重开，另开新隐患单，现场结果落地
    r = client.post(f"/api/reviews/{rid}/resolve", json={"decision": "TAKE_CLIENT"}, headers=auth(supervisor))
    assert r.status_code == 200, r.text
    tickets = client.get("/api/hazard-ticket", headers=auth(auditor)).json()
    assert len(tickets) == tickets_before + 1
    old = next(t for t in tickets if t["id"] == 1)
    assert old["rectify_status"] == "CLOSED" and old["closed_at"] == "2026-09-24T16:00:00Z"
    assert tickets[-1]["rectify_status"] == "OPEN"

    # 已结束批次重复提交 -> 409
    r = client.post("/api/sync/batches", json=closed, headers=auth(inspector))
    assert r.status_code == 409 and r.json()["code"] == "SYNC_BATCH_FINISHED"

    # --- 部分失败保留已合并并重试 ---
    # --- 部分失败保留已合并并重试（用 2号楼 d3，避开前面的合并） ---
    partial = {"batch_id": "offline-004", "items": [
        {"client_result_id": "c-5", "task_id": 2, "device_id": 3, "item_code": "SMOKE_TEST",
         "result_status": "NORMAL", "measured_value": "报警正常-10月", "captured_at": "2026-10-02T18:00:00Z",
         "base_device_version": 1},
        {"client_result_id": "c-6", "task_id": 999, "device_id": 3, "item_code": "X",
         "result_status": "NORMAL", "captured_at": "2026-10-02T18:05:00Z"},
    ]}
    r = client.post("/api/sync/batches", json=partial, headers=auth(inspector)).json()
    assert r["merged"] == 1 and r["failed"] == 1, r
    # 修正任务号后重试，已合并条目不会重复入账
    fixed = {"items": [dict(partial["items"][1], task_id=2)]}
    r = client.post(f"/api/sync/batches/offline-004/retry", json=fixed, headers=auth(inspector)).json()
    assert r["status"] == "MERGED" and r["merged"] == 2 and r["failed"] == 0, r
    d3_results = client.get("/api/inspection-result?device_id=3", headers=auth(auditor)).json()
    effective = [x for x in d3_results if x["effective"]]
    assert len(effective) == 1 and effective[0]["item_code"] == "X"

    # --- 台账与总览同源：d1 台账结论与 1号楼总览一致 ---
    devices = {d["id"]: d for d in client.get("/api/fire-device", headers=auth(auditor)).json()}
    overview = {b["building_id"]: b for b in client.get("/api/building/overview", headers=auth(auditor)).json()}
    assert devices[1]["compliance"]["compliant"] is True
    assert overview[1]["compliant_devices"] == 1 and overview[1]["total_devices"] == 2

    # 无效复核决策
    r = client.post(f"/api/reviews/9999/resolve", json={"decision": "BAD"}, headers=auth(supervisor))
    assert r.status_code == 400

    # 审计日志确实留痕
    logs = client.get("/api/audit-log", headers=auth(auditor)).json()
    messages = " ".join(l["message"] for l in logs)
    assert "失效标记" in messages and "保留冲突项" in messages and "达标率" in messages

    print("ALL SCENARIOS PASSED")


if __name__ == "__main__":
    run()
