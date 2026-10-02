from src.services.building_service import building_service


def list_building():
    return building_service.list()


def building_overview():
    return building_service.overview()
