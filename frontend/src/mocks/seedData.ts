/** 本地种子数据（与后端 backend/src/seed.py 保持一致，仅用于断网演示兜底）。 */
export const mockData = {
  building: [
    { id: 1, name: "研发A楼", campus: "东区园区", floor_count: 12, fire_grade: "一级", manager_id: 4, address_code: "A-01", compliance_rate: 0.5 },
    { id: 2, name: "研发B楼", campus: "东区园区", floor_count: 8, fire_grade: "一级", manager_id: 4, address_code: "A-02", compliance_rate: 0.5 },
    { id: 3, name: "仓储楼", campus: "西区园区", floor_count: 3, fire_grade: "二级", manager_id: 4, address_code: "B-01", compliance_rate: 1 },
  ],
  fireDevice: [
    { id: 1, building_id: 1, device_code: "MHQ-1F-01", device_type: "EXTINGUISHER", floor: "1F", location_desc: "A楼一层大厅", install_date: "2024-03-01", status: "NORMAL", next_maintenance_at: "2026-12-01T09:00:00Z", status_changed_at: "2026-08-01T09:00:00Z", row_version: 3 },
    { id: 2, building_id: 1, device_code: "XHS-2F-02", device_type: "HYDRANT", floor: "2F", location_desc: "A楼二层楼梯间", install_date: "2023-06-15", status: "FAULT", next_maintenance_at: "2026-10-20T09:00:00Z", status_changed_at: "2026-09-28T10:30:00Z", row_version: 5 },
    { id: 3, building_id: 2, device_code: "YGJ-3F-01", device_type: "SMOKE_DETECTOR", floor: "3F", location_desc: "B楼三层走廊", install_date: "2024-01-10", status: "NORMAL", next_maintenance_at: "2026-11-10T09:00:00Z", status_changed_at: "2026-07-01T09:00:00Z", row_version: 2 },
    { id: 4, building_id: 2, device_code: "PLS-4F-02", device_type: "SPRINKLER", floor: "4F", location_desc: "B楼四层机房", install_date: "2023-09-20", status: "RECTIFYING", next_maintenance_at: "2026-10-15T09:00:00Z", status_changed_at: "2026-09-25T14:00:00Z", row_version: 4 },
    { id: 5, building_id: 3, device_code: "SS-1F-01", device_type: "EXIT_LIGHT", floor: "1F", location_desc: "仓储楼一层出口", install_date: "2025-02-01", status: "NORMAL", next_maintenance_at: "2027-02-01T09:00:00Z", status_changed_at: "2026-05-01T09:00:00Z", row_version: 1 },
  ],
  inspectionTask: [
    { id: 1, building_id: 1, inspector_id: 1, plan_date: "2026-10-02", task_type: "MONTHLY", status: "IN_PROGRESS", checklist_version: "CL-2026-09", finished_at: null },
    { id: 2, building_id: 2, inspector_id: 2, plan_date: "2026-09-20", task_type: "MONTHLY", status: "SUBMITTED", checklist_version: "CL-2026-09", finished_at: "2026-09-20T17:00:00Z" },
    { id: 3, building_id: 3, inspector_id: 1, plan_date: "2026-10-05", task_type: "QUARTERLY", status: "PLANNED", checklist_version: "CL-2026-09", finished_at: null },
  ],
  inspectionResult: [
    { id: 1, task_id: 1, device_id: 1, item_code: "PRESSURE", result_status: "QUALIFIED", measured_value: "1.2MPa", photo_url: "/mock/r1.jpg", note: "压力表在绿区", recorded_at: "2026-09-01T09:10:00Z", source: "ONLINE", valid: true, invalid_reason: null, client_uuid: null },
    { id: 2, task_id: 2, device_id: 3, item_code: "SMOKE_TEST", result_status: "ABNORMAL", measured_value: "无响应", photo_url: "/mock/r2.jpg", note: "烟感未报警", recorded_at: "2026-09-20T10:00:00Z", source: "ONLINE", valid: true, invalid_reason: null, client_uuid: null },
    { id: 3, task_id: 2, device_id: 4, item_code: "WATER_PRESSURE", result_status: "ABNORMAL", measured_value: "0.05MPa", photo_url: "/mock/r3.jpg", note: "喷淋水压不足", recorded_at: "2026-09-20T10:20:00Z", source: "ONLINE", valid: true, invalid_reason: null, client_uuid: null },
  ],
  hazardTicket: [
    { id: 1, result_id: 2, severity: "HIGH", owner_id: 3, deadline: "2026-10-10", rectify_status: "REPAIRING", rectify_note: "已更换探测器主板，待复验", closed_at: null },
    { id: 2, result_id: 3, severity: "MEDIUM", owner_id: 3, deadline: "2026-09-30", rectify_status: "CLOSED", rectify_note: "现场检修后水压恢复 0.3MPa，复验通过", closed_at: "2026-09-29T16:00:00Z" },
  ],
} as const;
