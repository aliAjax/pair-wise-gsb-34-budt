import { useEffect, useMemo, useState } from "react";
import { useFireDeviceStore } from "../stores/FireDeviceStore";
import { useBuildingStore } from "../stores/BuildingStore";
import { useInspectionResultStore } from "../stores/InspectionResultStore";
import { useReviewStore } from "../stores/ReviewItemStore";
import { useRbac } from "../hooks/useRbac";
import { StatusBadge } from "../components/common/StatusBadge";
import { DeviceLocationCell } from "../components/common/DeviceLocationCell";
import { ReviewItemCard } from "../components/common/ReviewItemCard";
import { EmptyState } from "../components/common/EmptyState";
import { ApiError } from "../api/http";
import { DeviceStatus, DeviceStatusText } from "../constants/DeviceStatus";
import { formatDate, formatDeviceStatus, formatResultStatus } from "../utils/formatters";
import type { FireDevice } from "../types/FireDevice";
import type { ReviewItem } from "../types/ReviewItem";

export function DevicesPage() {
  const { rows: devices, load, changeStatus } = useFireDeviceStore();
  const { rows: buildings, load: loadBuildings } = useBuildingStore();
  const { rows: results, load: loadResults } = useInspectionResultStore();
  const { rows: reviews, load: loadReviews, resolve } = useReviewStore();
  const { isSupervisor } = useRbac();
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>(undefined);
  const [selected, setSelected] = useState<FireDevice | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load(buildingFilter).catch((e) => setError(String(e)));
    void loadBuildings();
    void loadResults();
    void loadReviews();
  }, [load, loadBuildings, loadResults, loadReviews, buildingFilter]);

  const deviceReviews = useMemo(
    () => reviews.filter((r) => r.resolution === "PENDING"),
    [reviews],
  );

  async function handleChangeStatus(device: FireDevice, status: string) {
    setError("");
    setBusy(true);
    try {
      // expected_version 走乐观锁；主管更新后旧结果失效并触发楼栋达标率重算
      await changeStatus(device.id, status, device.row_version, "主管更新设备状态");
      await Promise.all([load(buildingFilter), loadResults(), loadReviews()]);
      setSelected(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve(item: ReviewItem, resolution: "CONFIRMED" | "OVERRIDDEN") {
    setError("");
    try {
      await resolve(item.id, resolution, "台账页人工复核");
      await Promise.all([loadResults(), loadReviews()]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  const resultsOf = (deviceId: number) => results.filter((r) => r.device_id === deviceId);

  return (
    <section className="page-stack">
      <header className="page-title">
        <h1>消防设备台账</h1>
        <p>物业主管更新设备状态后，早于更新时间的旧巡检结果立即失效，楼栋达标率自动重算。</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-bar">
        <label>楼栋筛选：
          <select value={buildingFilter ?? ""} onChange={(e) => setBuildingFilter(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">全部</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>

      <div className="panel">
        {devices.length === 0 ? <EmptyState title="暂无设备" /> : (
          <table className="table">
            <thead>
              <tr><th>设备位置</th><th>类型</th><th>状态</th><th>状态更新时间</th><th>下次维保</th><th>版本</th>{isSupervisor && <th>操作</th>}</tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td><DeviceLocationCell device={d} /></td>
                  <td>{d.device_type}</td>
                  <td><StatusBadge value={d.status} /></td>
                  <td>{formatDate(d.status_changed_at)}</td>
                  <td>{formatDate(d.next_maintenance_at)}</td>
                  <td>v{d.row_version}</td>
                  {isSupervisor && (
                    <td>
                      <button className="btn" disabled={busy} onClick={() => setSelected(d)}>更新状态</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="modal-mask" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>更新 {selected.device_code} 状态</h2>
            <p className="muted">当前：{formatDeviceStatus(selected.status)}（v{selected.row_version}）</p>
            <div className="status-options">
              {DeviceStatus.map((s) => (
                <button key={s} className={`btn ${s === selected.status ? "btn-primary" : ""}`}
                  disabled={busy || s === selected.status}
                  onClick={() => handleChangeStatus(selected, s)}>
                  {DeviceStatusText[s]}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>取消</button>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>旧结果失效 / 同步冲突复核（与合规总览同一份）</h2>
        {deviceReviews.length === 0 ? <EmptyState title="暂无待复核项" /> : (
          <div className="review-grid">
            {deviceReviews.map((item) => (
              <ReviewItemCard key={item.id} item={item}
                readonly={!isSupervisor} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>巡检结果历史（含失效标记）</h2>
        <table className="table">
          <thead>
            <tr><th>设备</th><th>检查项</th><th>结果</th><th>记录时间</th><th>来源</th><th>有效性</th></tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className={r.valid ? "" : "row-invalid"}>
                <td>#{r.device_id}</td>
                <td>{r.item_code}</td>
                <td>{formatResultStatus(r.result_status)}</td>
                <td>{formatDate(r.recorded_at)}</td>
                <td>{r.source}</td>
                <td>{r.valid ? "有效" : `已失效：${r.invalid_reason ?? ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
