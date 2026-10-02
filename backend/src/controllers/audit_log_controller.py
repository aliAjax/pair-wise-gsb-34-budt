from src.repositories.audit_log_repository import audit_log_repository


def list_audit_log():
    return list(reversed(audit_log_repository.find_all()))
