class UserRole:
    INSPECTOR = "INSPECTOR"          # 巡检员：领取/提交自己的巡检任务
    MAINTAINER = "MAINTAINER"        # 维保商：处理隐患整改
    SUPERVISOR = "SUPERVISOR"        # 物业主管：设备台账、任务复核、达标率
    AUDITOR = "AUDITOR"              # 审计员：全局只读

    ALL = (INSPECTOR, MAINTAINER, SUPERVISOR, AUDITOR)
    READ_ONLY = (AUDITOR,)
