class DeviceStatus:
    NORMAL = "NORMAL"                # 正常
    FAULT = "FAULT"                  # 故障
    RECTIFYING = "RECTIFYING"        # 整改中
    SCRAPPED = "SCRAPPED"            # 报废

    ALL = (NORMAL, FAULT, RECTIFYING, SCRAPPED)
