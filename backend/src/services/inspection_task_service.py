from datetime import datetime, timezone

from src.constants.inspection_status import InspectionStatus
from src.constants.exceptions import AppError, NotFoundError, ValidationError
from src.constructors.inspection_task_factory import create_inspection_task_dto
from src.db import db
from src.repositories.building_repository import BuildingRepository
from src.repositories.inspection_task_repository import InspectionTaskRepository
from src.services.audit_service import audit_service


class InspectionTaskService:
    def __init__(self):
        self.repo = InspectionTaskRepository()
        self.building_repo = BuildingRepository()

    def list(self, building_id: int | None = None):
        rows = self.repo.find_all()
        if building_id is not None:
            rows = [r for r in rows if r["building_id"] == building_id]
        return rows

    def create(self, payload, actor: dict):
        if self.building_repo.get(payload.building_id) is None:
            raise NotFoundError("楼栋")
        row = create_inspection_task_dto(
            id=db.next_id("inspectionTask"),
            building_id=payload.building_id,
            inspector_id=payload.inspector_id,
            plan_date=payload.plan_date,
            task_type=payload.task_type,
            status=InspectionStatus[0],
            checklist_version=payload.checklist_version,
        )
        db.table("inspectionTask").append(row)
        audit_service.log(
            actor=actor["name"], actor_id=actor["id"], action="InspectionTask.create",
            target_type="InspectionTask", target_id=row["id"],
            template="InspectionTask.create",
        )
        return row

    def claim(self, task_id: int, actor: dict):
        task = self.repo.get(task_id)
        if task is None:
            raise NotFoundError("巡检任务")
        if task["inspector_id"] != actor["id"]:
            # 领取别人的任务也视为越权
            raise AppError("TASK_NOT_OWNED", status_code=403)
        if task["status"] == InspectionStatus[0]:
            self.repo.update(task_id, status=InspectionStatus[1])
        return self.repo.get(task_id)

    def review(self, task_id: int, actor: dict, approved: bool):
        """物业主管复核：通过 -> REVIEWED；驳回退回 IN_PROGRESS。"""
        task = self.repo.get(task_id)
        if task is None:
            raise NotFoundError("巡检任务")
        if task["status"] != InspectionStatus[2]:
            raise ValidationError("仅 SUBMITTED 状态的任务可以复核")
        self.repo.update(task_id, status=InspectionStatus[3] if approved else InspectionStatus[1])
        audit_service.log(
            actor=actor["name"], actor_id=actor["id"], action="InspectionTask.status",
            target_type="InspectionTask", target_id=task_id,
            template="InspectionTask.status",
        )
        return self.repo.get(task_id)


inspection_task_service = InspectionTaskService()
