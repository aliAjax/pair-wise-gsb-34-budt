import { useState } from "react";
import { closeHazardTicket } from "../api/HazardTicket";
import { ApiError } from "../api/http";
import { ERROR_MESSAGES } from "../constants/errorMessages";

export type HazardFlowState = {
  closing: boolean;
  error: string;
  closeTicket: (ticketId: number, note: string) => Promise<boolean>;
  reset: () => void;
};

/**
 * 隐患复验关闭流程。
 * 关闭成功后，离线端再提交该结果的旧记录会被后端转成 TICKET_CLOSED 冲突，
 * 不会覆盖现场 —— 这里只负责关闭动作与错误文案归一。
 */
export function useHazardFlow(onClosed?: () => void): HazardFlowState {
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  async function closeTicket(ticketId: number, note: string) {
    if (!note.trim()) {
      setError("复验备注不能为空");
      return false;
    }
    setClosing(true);
    setError("");
    try {
      await closeHazardTicket(ticketId, note);
      onClosed?.();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : ERROR_MESSAGES.INTERNAL_ERROR);
      return false;
    } finally {
      setClosing(false);
    }
  }

  return { closing, error, closeTicket, reset: () => setError("") };
}
