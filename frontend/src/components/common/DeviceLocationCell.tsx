import type { FireDevice } from "../../types/FireDevice";

export function DeviceLocationCell({ device }: { device: Pick<FireDevice, "floor" | "location_desc" | "device_code"> }) {
  return (
    <div className="location-cell">
      <strong>{device.device_code}</strong>
      <span>{device.floor} · {device.location_desc}</span>
    </div>
  );
}
