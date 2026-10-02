from src.repositories.inspection_result_repository import InspectionResultRepository


class InspectionResultService:
    def __init__(self):
        self.repo = InspectionResultRepository()

    def list(self, device_id: int | None = None, effective_only: bool = False):
        rows = self.repo.list_by_device(device_id) if device_id else self.repo.find_all()
        if effective_only:
            rows = [r for r in rows if r.get("effective")]
        return rows
