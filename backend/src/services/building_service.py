from src.repositories.building_repository import BuildingRepository
from src.services.compliance_service import compliance_service


class BuildingService:
    def __init__(self):
        self.repo = BuildingRepository()

    def list(self):
        return self.repo.find_all()

    def overview(self):
        return compliance_service.overview()


building_service = BuildingService()
