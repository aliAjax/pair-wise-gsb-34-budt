UserRole = ["INSPECTOR", "MAINTAINER", "SUPERVISOR", "AUDITOR"]

# Read-only role across the whole platform.
READ_ONLY_ROLES = {"AUDITOR"}

# Roles allowed to submit / merge offline inspection results.
INSPECTION_WRITE_ROLES = {"INSPECTOR", "SUPERVISOR"}
# Roles allowed to review conflicts and change device ledger status.
LEDGER_WRITE_ROLES = {"SUPERVISOR"}
# Roles allowed to operate hazard tickets.
HAZARD_WRITE_ROLES = {"MAINTAINER", "SUPERVISOR"}
