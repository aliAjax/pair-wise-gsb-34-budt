# 每个写操作都对应一条可渲染模板；字段变更时必须同步修改模板与 service 调用处。
LOG_TEMPLATES = {
    "Building": {
        "Building.create": "{actor} 创建楼栋 {name}#{entity_id}",
        "Building.update": "{actor} 更新楼栋 {name}#{entity_id} 字段 {fields}",
        "Building.status": "{actor} 重算楼栋 {name}#{entity_id} 达标率 {old_rate}%->{rate}%",
        "Building.export": "{actor} 导出楼栋台账 #{entity_id}",
    },
    "FireDevice": {
        "FireDevice.create": "{actor} 登记设备 {device_code}#{entity_id}",
        "FireDevice.update": "{actor} 更新设备 {device_code}#{entity_id} 字段 {fields}",
        "FireDevice.status": "{actor} 将设备 {device_code}#{entity_id} 状态 {old_status}->{status}",
        "FireDevice.export": "{actor} 导出设备台账 #{entity_id}",
    },
    "InspectionTask": {
        "InspectionTask.create": "{actor} 创建巡检任务 #{entity_id} 楼栋 {building_id}",
        "InspectionTask.update": "{actor} 更新巡检任务 #{entity_id} 字段 {fields}",
        "InspectionTask.status": "{actor} 流转任务 #{entity_id} 状态 {old_status}->{status}",
        "InspectionTask.export": "{actor} 导出巡检任务 #{entity_id}",
    },
    "InspectionResult": {
        "InspectionResult.create": "{actor} 录入结果 #{entity_id} 设备 {device_id} 判定 {result_status}",
        "InspectionResult.update": "{actor} 更新结果 #{entity_id} 字段 {fields}",
        "InspectionResult.status": "{actor} 结果 #{entity_id} 失效标记 {superseded}",
        "InspectionResult.export": "{actor} 导出巡检结果 #{entity_id}",
    },
    "HazardTicket": {
        "HazardTicket.create": "{actor} 对结果 {result_id} 派发隐患单 #{entity_id} 级别 {severity}",
        "HazardTicket.update": "{actor} 更新隐患单 #{entity_id} 字段 {fields}",
        "HazardTicket.status": "{actor} 隐患单 #{entity_id} 状态 {old_status}->{status}",
        "HazardTicket.export": "{actor} 导出隐患台账 #{entity_id}",
    },
    "SyncBatch": {
        "SyncBatch.create": "{actor} 提交离线同步批次 {batch_id} 共 {total} 条",
        "SyncBatch.merge": "{actor} 批次 {batch_id} 合并 {merged} 条 冲突 {conflict} 条",
        "SyncBatch.retry": "{actor} 重试批次 {batch_id}，新合并 {merged} 条",
        "SyncBatch.conflict": "{actor} 批次 {batch_id} 保留冲突项 {review_id} 待复核",
    },
    "ReviewItem": {
        "ReviewItem.create": "同步批次 {batch_id} 产生冲突复核项 {review_id}（{reason}）",
        "ReviewItem.resolve": "{actor} 复核冲突 {review_id} 判定 {decision}",
        "ReviewItem.keep_server": "{actor} 冲突 {review_id} 保留现场（服务端）记录",
        "ReviewItem.take_client": "{actor} 冲突 {review_id} 采用巡检员（客户端）记录",
    },
}


def render_log(entity: str, action: str, **params) -> str:
    template = LOG_TEMPLATES[entity][action]
    return template.format(**params)
