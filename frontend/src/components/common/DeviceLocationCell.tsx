import type { FireDevice } from "../../types/FireDevice";
import { StatusBadge } from "./StatusBadge";

interface DeviceLocationCellProps {
  device: Pick<FireDevice, "floor" | "location_desc" | "device_code" | "status">;
}

/** 台账/任务/隐患页共用的设备位置单元格。 */
export function DeviceLocationCell({ device }: DeviceLocationCellProps) {
  return (
    <div className="device-cell">
      <strong>{device.device_code}</strong>
      <span>{device.floor} · {device.location_desc}</span>
      <StatusBadge value={device.status} />
    </div>
  );
}
