from src.services.inspection_result_service import InspectionResultService
service = InspectionResultService()


def list_inspection_result(device_id: int | None = None, effective_only: bool = False):
    return service.list(device_id, effective_only)
