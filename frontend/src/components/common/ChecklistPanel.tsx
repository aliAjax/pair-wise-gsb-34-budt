import { useMemo, useState } from "react";
import { useChecklistProgress } from "../../hooks/useChecklistProgress";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { useSyncStore } from "../../stores/SyncStore";
import { createOfflineDraft } from "../../constructors/SyncConstructor";
import type { FireDevice } from "../../types/FireDevice";
import type { OfflineResultDraft } from "../../types/Sync";

interface ChecklistPanelProps {
  taskId: number;
  devices: FireDevice[];
}

/**
 * 巡检检查项面板：地下室断网时仍可逐条填写，结果进入本机离线队列，
 * 网络恢复后由 useOfflineSync 自动合并；base_device_version 用于服务端冲突检测。
 */
export function ChecklistPanel({ taskId, devices }: ChecklistPanelProps) {
  const [deviceId, setDeviceId] = useState<number>(devices[0]?.id ?? 1);
  const [itemCode, setItemCode] = useState("");
  const [resultStatus, setResultStatus] = useState<"NORMAL" | "ABNORMAL">("NORMAL");
  const [measured, setMeasured] = useState("");
  const [note, setNote] = useState("");

  const queueOffline = useSyncStore((s) => s.queueOffline);
  const offlineCount = useSyncStore((s) => s.offlineCount);
  const syncing = useSyncStore((s) => s.syncing);
  const lastMessage = useSyncStore((s) => s.lastMessage);
  const { online, flush } = useOfflineSync();

  const drafts = useMemo<OfflineResultDraft[]>(
    () => devices.map((d) => createOfflineDraft({ task_id: taskId, device_id: d.id })),
    [devices, taskId]
  );
  const progress = useChecklistProgress(
    drafts.map((d, i) => ({ item_code: devices[i]?.device_code ?? "", result_status: i === 0 ? resultStatus : undefined }))
  );
  void progress;

  const selected = devices.find((d) => d.id === deviceId);

  const saveDraft = () => {
    if (!itemCode.trim()) return;
    queueOffline(createOfflineDraft({
      task_id: taskId,
      device_id: deviceId,
      item_code: itemCode,
      result_status: resultStatus,
      measured_value: measured,
      note,
      base_device_version: selected?.version ?? 1
    }));
    setItemCode("");
    setMeasured("");
    setNote("");
  };

  return (
    <div className="checklist">
      <div className="checklist-head">
        <span className={`net-dot ${online ? "online" : "offline"}`}>
          {online ? "在线" : "断网"} · 本机待同步 {offlineCount} 条
        </span>
        {!online ? <em>结果保存在本机，恢复网络后自动合并</em> : null}
      </div>
      <div className="form-grid">
        <label>设备
          <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.device_code} · {d.location_desc}</option>)}
          </select>
        </label>
        <label>检查项
          <input value={itemCode} placeholder="如 HYDRANT_PRESSURE" onChange={(e) => setItemCode(e.target.value)} />
        </label>
        <label>判定
          <select value={resultStatus} onChange={(e) => setResultStatus(e.target.value as "NORMAL" | "ABNORMAL")}>
            <option value="NORMAL">正常</option>
            <option value="ABNORMAL">异常</option>
          </select>
        </label>
        <label>实测值
          <input value={measured} onChange={(e) => setMeasured(e.target.value)} placeholder="如 0.35MPa" />
        </label>
        <label className="full">备注
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </label>
      </div>
      <div className="checklist-actions">
        <button className="btn btn-ghost" onClick={saveDraft}>存入本机</button>
        <button className="btn btn-primary" disabled={offlineCount === 0 || syncing || !online} onClick={() => void flush()}>
          {syncing ? "合并中…" : "立即同步合并"}
        </button>
      </div>
      {lastMessage ? <p className="inline-hint">{lastMessage}</p> : null}
    </div>
  );
}
