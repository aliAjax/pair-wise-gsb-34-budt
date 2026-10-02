import { useEffect } from "react";
import { useSyncStore } from "../stores/SyncStore";

/**
 * 监听浏览器联网状态：
 * - 断网时巡检结果继续写入本机离线队列；
 * - 恢复网络后自动 flush，合并成功的部分出队，失败项保留重试。
 */
export function useOfflineSync(autoFlush = true) {
  const online = useSyncStore((s) => s.online);
  const setOnline = useSyncStore((s) => s.setOnline);
  const refreshOutbox = useSyncStore((s) => s.refreshOutbox);
  const flush = useSyncStore((s) => s.flush);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleOutbox = () => refreshOutbox();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-outbox-changed", handleOutbox);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-outbox-changed", handleOutbox);
    };
  }, [setOnline, refreshOutbox]);

  useEffect(() => {
    if (autoFlush && navigator.onLine) void flush();
    // 仅在挂载时尝试一次自动合并，避免循环刷新。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { online, flush };
}
