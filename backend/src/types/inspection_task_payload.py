from pydantic import BaseModel


class InspectionTaskPayload(BaseModel):
    building_id: int
    inspector_id: int
    plan_date: str
    task_type: str
    checklist_version: str = "CL-2026-09"


class ClaimTaskPayload(BaseModel):
    pass
