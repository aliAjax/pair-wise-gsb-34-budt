from src.repositories import store

_WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


async def audit_log_middleware(request, call_next):
    response = await call_next(request)
    # HTTP 级别留痕：每个写请求记一条结构化日志；业务操作（提交/派单/关闭）
    # 另由 service 层通过 audit_log_repository 写渲染后的中文模板。
    if request.method in _WRITE_METHODS:
        user = getattr(request.state, "user", None) or {}
        store.insert("auditLog", {
            "id": store.next_id("auditLog"),
            "entity": "Http",
            "action": f"{request.method} {request.url.path}",
            "actor_id": user.get("id"),
            "actor_name": user.get("name", ""),
            "actor_role": user.get("role", ""),
            "message": f"{user.get('name', 'anonymous')} {request.method} {request.url.path} -> {response.status_code}",
            "created_at": store.now_iso(),
        })
    return response
