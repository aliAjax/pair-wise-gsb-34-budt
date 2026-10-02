"""复核项仓储：设备台账与合规总览共用同一份复核结果。"""
from src.db import db


class ReviewItemRepository:
    def find_all(self):
        return db.table("reviewItem")

    def list_pending(self):
        return [r for r in db.table("reviewItem") if r["resolution"] == "PENDING"]

    def get(self, review_id: int):
        return next((r for r in db.table("reviewItem") if r["id"] == review_id), None)

    def find_open(self, kind: str, ref_type: str, ref_id: int):
        return next(
            (
                r
                for r in db.table("reviewItem")
                if r["kind"] == kind
                and r["ref_type"] == ref_type
                and r["ref_id"] == ref_id
                and r["resolution"] == "PENDING"
            ),
            None,
        )

    def add(self, row: dict):
        db.table("reviewItem").append(row)
        return row

    def resolve(self, review_id: int, resolution: str, reviewer_id: int, reviewed_at: str, note: str):
        row = self.get(review_id)
        if row is not None:
            row["resolution"] = resolution
            row["reviewer_id"] = reviewer_id
            row["reviewed_at"] = reviewed_at
            row["review_note"] = note
        return row
