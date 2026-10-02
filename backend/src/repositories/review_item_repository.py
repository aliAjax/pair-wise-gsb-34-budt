from src.repositories import store


class ReviewItemRepository:
    def find_all(self, building_id: int | None = None):
        rows = store.table("reviewItem")
        if building_id is not None:
            return [r for r in rows if r.get("building_id") == building_id]
        return rows

    def list_pending(self, building_id: int | None = None):
        return [r for r in self.find_all(building_id) if r["status"] == "PENDING"]

    def find_by_id(self, review_id: int):
        return store.find_by_id("reviewItem", review_id)

    def create(self, row: dict) -> dict:
        row.setdefault("status", "PENDING")
        return store.insert("reviewItem", row)

    def resolve(self, review: dict, decision: str, resolved_by: dict, result_id=None) -> dict:
        review["status"] = decision
        review["resolved_by"] = resolved_by
        review["resolved_at"] = store.now_iso()
        if result_id is not None:
            review["server_result_id"] = result_id
        return review


review_item_repository = ReviewItemRepository()
