import { useEffect } from "react";
import { useOfflineStore } from "../stores/OfflineStore";

/** 挂载浏览器 online/offline 监听：断网可继续填，恢复后自动合并本机队列。 */
export function useConnectivity() {
  const setOnline = useOfflineStore((s) => s.setOnline);
  const online = useOfflineStore((s) => s.online);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [setOnline]);

  return online;
}
