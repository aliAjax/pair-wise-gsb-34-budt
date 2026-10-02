from src.repositories import store


class SyncBatchRepository:
    def find_all(self):
        return store.table("syncBatch")

    def find_by_id(self, batch_id: str):
        return next((b for b in store.table("syncBatch") if b["id"] == batch_id), None)

    def create(self, row: dict) -> dict:
        return store.insert("syncBatch", row)

    def update(self, batch: dict, **fields):
        batch.update(fields)
        return batch

    def upsert_item(self, batch: dict, item: dict) -> dict:
        existing = next((i for i in batch["items"] if i["client_result_id"] == item["client_result_id"]), None)
        if existing:
            existing.update(item)
            return existing
        batch["items"].append(item)
        return item


sync_batch_repository = SyncBatchRepository()
