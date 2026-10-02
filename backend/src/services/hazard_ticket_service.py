from datetime import datetime, timezone

from src.constants.rectify_status import RectifyStatus
from src.constants.exceptions import NotFoundError, ValidationError
from src.constructors.hazard_ticket_factory import create_hazard_ticket_dto
from src.db import db
from src.repositories.hazard_ticket_repository import HazardTicketRepository
from src.repositories.inspection_result_repository import InspectionResultRepository
from src.services.audit_service import audit_service
from src.services.compliance_service import compliance_service


class HazardTicketService:
    def __init__(self):
        self.repo = HazardTicketRepository()
        self.result_repo = InspectionResultRepository()

    def list(self, status: str | None = None):
        rows = self.repo.find_all()
        if status:
            rows = [r for r in rows if r["rectify_status"] == status]
        return rows

    def dispatch(self, payload, actor: dict):
        result = self.result_repo.get(payload.result_id)
        if result is None:
            raise NotFoundError("巡检结果")
        if self.repo.list_open_by_result(payload.result_id):
            raise ValidationError("该结果已有进行中的整改单")
        row = create_hazard_ticket_dto(
            id=db.next_id("hazardTicket"),
            result_id=payload.result_id,
            severity=payload.severity,
            owner_id=payload.owner_id,
            deadline=payload.deadline,
            rectify_status=RectifyStatus.OPEN,
        )
        db.table("hazardTicket").append(row)
        audit_service.log(
            actor=actor["name"], actor_id=actor["id"], action="HazardTicket.create",
            target_type="HazardTicket", target_id=row["id"],
            template="HazardTicket.create",
        )
        return row

    def close(self, ticket_id: int, payload, actor: dict):
        """复验关闭。关闭后的整改单即成为离线旧记录覆盖的禁区。"""
        ticket = self.repo.get(ticket_id)
        if ticket is None:
            raise NotFoundError("隐患整改单")
        if ticket["rectify_status"] == RectifyStatus.CLOSED:
            raise ValidationError("整改单已关闭，不能重复关闭")
        self.repo.update(
            ticket_id, rectify_status=RectifyStatus.CLOSED,
            rectify_note=payload.rectify_note, closed_at=_now(),
        )
        audit_service.log(
            actor=actor["name"], actor_id=actor["id"], action="HazardTicket.status",
            target_type="HazardTicket", target_id=ticket_id,
            template="HazardTicket.status",
        )
        result = self.result_repo.get(ticket["result_id"])
        if result:
            from src.repositories.fire_device_repository import FireDeviceRepository

            device = FireDeviceRepository().get(result["device_id"])
            if device:
                compliance_service.recompute_building(device["building_id"], actor=actor)
        return self.repo.get(ticket_id)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


hazard_ticket_service = HazardTicketService()
