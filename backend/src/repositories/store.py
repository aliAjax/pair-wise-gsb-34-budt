"""Process-local in-memory store over the seed data.

The deployment uses PostgreSQL (see database/init.sql); the running demo
keeps data in memory so the layered repositories still have a single
source of truth. Every record carries `version` for optimistic
concurrency checks during offline sync.
"""

import copy
from datetime import datetime, timezone

from src.seed import seed

_TABLES = (
    "user", "building", "fireDevice", "inspectionTask",
    "inspectionResult", "hazardTicket", "syncBatch", "reviewItem", "auditLog",
)

_store = {table: copy.deepcopy(seed[table]) for table in _TABLES}


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def table(name: str) -> list:
    return _store[name]


def reset() -> None:
    """Restore seed state in place (used by integration checks)."""
    for table_name in _TABLES:
        _store[table_name].clear()
        _store[table_name].extend(copy.deepcopy(seed[table_name]))


def next_id(name: str) -> int:
    return (max((row["id"] for row in _store[name]), default=0) or 0) + 1


def find_by_id(name: str, record_id: int):
    return next((row for row in _store[name] if row["id"] == record_id), None)


def insert(name: str, row: dict) -> dict:
    if "id" not in row or row["id"] is None:
        row["id"] = next_id(name)
    # Keep the live object: services mutate batch/review rows in place across
    # the multi-step merge pipeline. Reads return references, snapshot() copies.
    _store[name].append(row)
    return row


def snapshot() -> dict:
    return copy.deepcopy(_store)
