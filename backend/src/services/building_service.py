from src.repositories.building_repository import BuildingRepository
from src.services.compliance_service import compliance_service


class BuildingService:
    def __init__(self):
        self.repo = BuildingRepository()

    def list(self):
        return self.repo.find_all()

    # 合规总览消费：与设备台账共用 compliance_service 的同一份计算结果。
    def overview(self):
        return compliance_service.overview()
