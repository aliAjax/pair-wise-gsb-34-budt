from src.db import db


class AuditLogRepository:
    def find_all(self):
        return db.table("auditLog")

    def add(self, row: dict):
        db.table("auditLog").append(row)
        return row
