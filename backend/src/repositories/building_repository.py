from src.repositories import store


class BuildingRepository:
    def find_all(self):
        return store.table("building")

    def find_by_id(self, building_id: int):
        return store.find_by_id("building", building_id)
