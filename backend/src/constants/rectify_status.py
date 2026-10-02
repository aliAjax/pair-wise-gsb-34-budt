class RectifyStatus:
    OPEN = "OPEN"                    # 待整改
    REPAIRING = "REPAIRING"          # 整改中
    RECHECKING = "RECHECKING"        # 待复验
    CLOSED = "CLOSED"                # 已关闭

    ALL = (OPEN, REPAIRING, RECHECKING, CLOSED)
