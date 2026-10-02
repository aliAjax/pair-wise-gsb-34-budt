from fastapi import FastAPI

from src.middlewares.error_handler_middleware import error_handler_middleware
from src.middlewares.rate_limit_middleware import rate_limit_middleware
from src.middlewares.request_logger_middleware import request_logger_middleware
from src.middlewares.auth_middleware import auth_middleware
from src.middlewares.audit_log_middleware import audit_log_middleware
from src.routes.auth_routes import router as auth_router
from src.routes.building_routes import router as building_router
from src.routes.fire_device_routes import router as fire_device_router
from src.routes.inspection_task_routes import router as inspection_task_router
from src.routes.inspection_result_routes import router as inspection_result_router
from src.routes.hazard_ticket_routes import router as hazard_ticket_router
from src.routes.review_item_routes import router as review_item_router

app = FastAPI(title="消防设施巡检维保平台")

# add_middleware 后注册的更靠近路由；错误处理必须在最内层，才能兜住
# auth/rbac/限流/路由各层抛出的 AppError。
# 请求流向：request_logger -> auth -> rate_limit -> audit -> error_handler -> 路由
app.add_middleware(request_logger_middleware)
app.add_middleware(auth_middleware)
app.add_middleware(rate_limit_middleware)
app.add_middleware(audit_log_middleware)
app.add_middleware(error_handler_middleware)


@app.get("/health")
def health():
    return {"status": "ok", "service": "fire-inspect"}


app.include_router(auth_router)
app.include_router(building_router)
app.include_router(fire_device_router)
app.include_router(inspection_task_router)
app.include_router(inspection_result_router)
app.include_router(hazard_ticket_router)
app.include_router(review_item_router)
