"""本地种子数据（禁止第三方 API）。

集中构造演示场景：
- d2 已有一条 NORMAL 有效结果，物业主管改状态后会使其失效；
- d4 的隐患单 h1 已复验关闭，旧结果失效，现场为 NORMAL；
- t1 是巡检员 u1 正在地下室执行、可能离线提交的任务。
字段结构必须与 repositories / constructors / 前端 mocks 保持同步。
"""


def _device(did, building_id, code, dtype, floor, location, status, installed, next_maint, version=1):
    return {
        "id": did,
        "building_id": building_id,
        "device_code": code,
        "device_type": dtype,
        "floor": floor,
        "location_desc": location,
        "install_date": installed,
        "status": status,
        "next_maintenance_at": next_maint,
        "version": version,
        "updated_at": "2026-09-20T09:00:00Z",
    }


def _result(rid, task_id, device_id, item_code, status, value, note, effective,
            captured_at, reviewed_at=None, hazard_ticket_id=None, version=1):
    return {
        "id": rid,
        "task_id": task_id,
        "device_id": device_id,
        "item_code": item_code,
        "result_status": status,
        "measured_value": value,
        "photo_url": f"/mock/photo-{rid}.png",
        "note": note,
        "effective": effective,
        "version": version,
        "captured_at": captured_at,
        "reviewed_at": reviewed_at,
        "hazard_ticket_id": hazard_ticket_id,
    }


seed = {
    "user": [
        {"id": 1, "username": "inspector", "password": "inspect123", "name": "王巡检", "role": "INSPECTOR"},
        {"id": 2, "username": "maintainer", "password": "maintain123", "name": "李维保", "role": "MAINTAINER"},
        {"id": 3, "username": "supervisor", "password": "super123", "name": "赵主管", "role": "SUPERVISOR"},
        {"id": 4, "username": "auditor", "password": "audit123", "name": "孙审计", "role": "AUDITOR"},
    ],
    "building": [
        {"id": 1, "name": "1号厂房", "campus": "东区园区", "floor_count": 6,
         "fire_grade": "一级", "manager_id": 3, "address_code": "320100-E01", "version": 1},
        {"id": 2, "name": "综合办公楼", "campus": "东区园区", "floor_count": 12,
         "fire_grade": "一级", "manager_id": 3, "address_code": "320100-E02", "version": 1},
    ],
    "fireDevice": [
        _device(1, 1, "MH-101", "HYDRANT", "1F", "地下室东侧消火栓", "NORMAL",
                "2023-05-01", "2026-11-01T09:00:00Z"),
        _device(2, 1, "YGF-202", "EXTINGUISHER", "2F", "二层走廊灭火器箱", "NORMAL",
                "2024-03-12", "2026-10-20T09:00:00Z"),
        _device(3, 2, "YTG-301", "SMOKE_DETECTOR", "3F", "三层办公区烟感", "NORMAL",
                "2022-11-08", "2026-12-01T09:00:00Z"),
        _device(4, 2, "PLS-401", "SPRINKLER", "B1", "地下车库喷淋阀组", "NORMAL",
                "2021-08-19", "2026-10-15T09:00:00Z", version=2),
    ],
    "inspectionTask": [
        {"id": 1, "building_id": 1, "inspector_id": 1, "plan_date": "2026-10-02",
         "task_type": "ROUTINE", "status": "IN_PROGRESS", "checklist_version": "v2026.09",
         "finished_at": "", "version": 1},
        {"id": 2, "building_id": 2, "inspector_id": 1, "plan_date": "2026-09-15",
         "task_type": "ROUTINE", "status": "REVIEWED", "checklist_version": "v2026.09",
         "finished_at": "2026-09-16T10:00:00Z", "version": 2},
        {"id": 3, "building_id": 1, "inspector_id": 1, "plan_date": "2026-11-02",
         "task_type": "SPECIAL", "status": "PLANNED", "checklist_version": "v2026.09",
         "finished_at": "", "version": 1},
    ],
    "inspectionResult": [
        _result(1, 2, 3, "SMOKE_TEST", "NORMAL", "报警正常", "烟感联动测试通过",
                True, "2026-09-15T10:00:00Z", "2026-09-16T11:00:00Z"),
        _result(2, 2, 4, "VALVE_CHECK", "ABNORMAL", "阀组锈蚀", "喷淋阀组锈蚀漏水",
                False, "2026-09-15T10:20:00Z", "2026-09-16T11:00:00Z", hazard_ticket_id=1),
    ],
    "hazardTicket": [
        {"id": 1, "result_id": 2, "device_id": 4, "severity": "HIGH", "owner_id": 2,
         "deadline": "2026-09-25", "rectify_status": "CLOSED",
         "rectify_note": "已更换阀组并复验通过", "closed_at": "2026-09-24T16:00:00Z",
         "version": 2},
    ],
    "syncBatch": [],
    "reviewItem": [],
    "auditLog": [],
}
