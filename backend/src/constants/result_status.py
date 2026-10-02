class ResultStatus:
    QUALIFIED = "QUALIFIED"          # 合格
    ABNORMAL = "ABNORMAL"            # 异常
    NOT_DONE = "NOT_DONE"            # 未检（离线草稿占位）

    ALL = (QUALIFIED, ABNORMAL, NOT_DONE)
