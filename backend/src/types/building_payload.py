from pydantic import BaseModel


class BuildingPayload(BaseModel):
    name: str
    campus: str
    floor_count: int
    fire_grade: str
    manager_id: int
    address_code: str
