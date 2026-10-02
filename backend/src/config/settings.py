import os

PORT = int(os.getenv("PORT", "8000"))

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "local-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))

# 接口限流：每个 IP 在窗口内的最大请求数
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "300"))

# 离线同步批量重试：单批最多重试次数（超过仍保留未合并部分，由前端继续重试）
SYNC_MAX_RETRY = int(os.getenv("SYNC_MAX_RETRY", "3"))
