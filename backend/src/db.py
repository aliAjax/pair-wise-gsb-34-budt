"""进程内可变数据层。

刻意保持简单（无 ORM 连接），repositories 统一从这里取表；
表结构与 database/init.sql 对应，便于后续切换到 PostgreSQL。
"""
import copy
import threading

from src.seed import SEED


class InMemoryDB:
    def __init__(self):
        self._lock = threading.RLock()
        self.reset()

    def reset(self):
        with self._lock:
            self.tables = {
                "building": copy.deepcopy(SEED["building"]),
                "fireDevice": copy.deepcopy(SEED["fireDevice"]),
                "inspectionTask": copy.deepcopy(SEED["inspectionTask"]),
                "inspectionResult": copy.deepcopy(SEED["inspectionResult"]),
                "hazardTicket": copy.deepcopy(SEED["hazardTicket"]),
                # 运行期表
                "reviewItem": [],
                "auditLog": [],
            }
            # batch_id -> {"merged": [client_uuid], "conflict": [client_uuid], "done": bool}
            self.sync_batches: dict[str, dict] = {}
            self._sequences: dict[str, int] = {}

    @property
    def lock(self):
        return self._lock

    def table(self, name: str):
        return self.tables[name]

    def next_id(self, name: str) -> int:
        rows = self.tables[name]
        self._sequences[name] = max(
            self._sequences.get(name, 0),
            max((r["id"] for r in rows), default=0),
        )
        self._sequences[name] += 1
        return self._sequences[name]


db = InMemoryDB()
