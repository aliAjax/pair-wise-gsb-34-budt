from src.db import db


class BuildingRepository:
    def find_all(self):
        return db.table("building")

    def get(self, building_id: int):
        return next((r for r in db.table("building") if r["id"] == building_id), None)
