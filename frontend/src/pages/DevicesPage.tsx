import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../api/request";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { DeviceLocationCell } from "../components/common/DeviceLocationCell";
import { ReviewConflictPanel } from "../components/common/ReviewConflictPanel";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useBuildingStore } from "../stores/BuildingStore";
import { useAuthStore } from "../stores/AuthStore";
import { DeviceStatus, DeviceStatusText } from "../constants/SyncStatus";
import type { InspectionResult } from "../types/InspectionResult";
import type { FireDevice } from "../types/FireDevice";
import { listInspectionResult } from "../api/InspectionResult";

export function DevicesPage() {
  const { rows, load, updateStatus } = useFireDeviceStore();
  const { overview, loadOverview } = useBuildingStore();
  const user = useAuthStore((s) => s.user);
  const isSupervisor = user?.role === "SUPERVISOR";
  const [buildingId, setBuildingId] = useState<number | "all">("all");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<FireDevice | null>(null);

  useEffect(() => {
    void load();
    void loadOverview();
  }, [load, loadOverview]);

  const filtered = useMemo(
    () => (buildingId === "all" ? rows : rows.filter((d) => d.building_id === buildingId)),
    [rows, buildingId]
  );

  const changeStatus = async (device: FireDevice, status: string) => {
    setMessage("");
    try {
      await updateStatus(device.id, status);
      await loadOverview();
      setMessage(`已将 ${device.device_code} 标记为${DeviceStatusText[status as keyof typeof DeviceStatusText]}，旧巡检结果已失效，达标率已重算`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "更新失败");
    }
  };

  const buildingRate = (id: number) => overview.find((b) => b.building_id === id);

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">device ledger</p>
          <h1>消防设备台账</h1>
        </div>
        <StatusBadge value={isSupervisor ? "IN_PROGRESS" : "REVIEWED"}
          label={isSupervisor ? "主管可改状态" : "只读视图"} />
      </section>

      <section className="metrics">
        <StatCard label="设备总数" value={filtered.length} />
        <StatCard label="达标设备" value={filtered.filter((d) => d.compliance?.compliant).length} tone="good" />
        <StatCard label="异常/漏检"
          value={filtered.filter((d) => d.compliance && !d.compliance.compliant).length} tone="bad" />
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>设备列表</h2>
          <select value={buildingId} onChange={(e) => setBuildingId(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <option value="all">全部楼栋</option>
            {overview.map((b) => <option key={b.building_id} value={b.building_id}>{b.building_name}（{b.compliance_rate}%）</option>)}
          </select>
        </div>
        {message ? <p className="inline-hint">{message}</p> : null}
        <div className="table">
          {filtered.map((d) => (
            <article key={d.id} className="row device-row">
              <DeviceLocationCell device={d} />
              <StatusBadge value={d.status} label={DeviceStatusText[d.status as keyof typeof DeviceStatusText] ?? d.status} />
              <StatusBadge value={d.compliance?.compliant ? "NORMAL" : "FAULT"}
                label={d.compliance?.compliant ? "达标" : `不达标·${d.compliance?.detail ?? ""}`} />
              <button className="btn btn-link" onClick={() => setSelected(d)}>历史结果</button>
              {isSupervisor ? (
                <select defaultValue="" onChange={(e) => {
                  if (e.target.value) void changeStatus(d, e.target.value);
                  e.currentTarget.value = "";
                }}>
                  <option value="" disabled>更新状态…</option>
                  {DeviceStatus.map((s) => <option key={s} value={s}>{DeviceStatusText[s]}</option>)}
                </select>
              ) : null}
            </article>
          ))}
        </div>
        {buildingId !== "all" && buildingRate(Number(buildingId)) ? (
          <p className="inline-hint">
            本楼栋达标率 {buildingRate(Number(buildingId))?.compliance_rate}%——与合规总览共用同一份计算结果
          </p>
        ) : null}
      </section>

      <ReviewConflictPanel scope={buildingId === "all" ? undefined : { buildingId: Number(buildingId) }} />

      {selected ? <DeviceHistoryModal device={selected} onClose={() => setSelected(null)} /> : null}
    </main>
  );
}

function DeviceHistoryModal({ device, onClose }: { device: FireDevice; onClose: () => void }) {
  const [results, setResults] = useState<InspectionResult[]>([]);
  useEffect(() => {
    void listInspectionResult(device.id).then(setResults);
  }, [device.id]);
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{device.device_code} 历史巡检结果</h2>
        <div className="table">
          {results.map((r) => (
            <article key={r.id} className="row">
              <strong>{r.item_code}</strong>
              <StatusBadge value={r.result_status} label={r.result_status === "NORMAL" ? "正常" : "异常"} />
              <span className={r.effective ? "" : "strike"}>{r.effective ? "有效" : "已失效"}</span>
              <span className="muted">{r.measured_value} · {r.captured_at.slice(0, 16).replace("T", " ")}</span>
            </article>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
