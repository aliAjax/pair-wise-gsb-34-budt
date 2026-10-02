import { DeviceStatusText } from "../constants/DeviceStatus";
import { ResultStatusText } from "../constants/ResultStatus";
import { RectifyStatusText } from "../constants/RectifyStatus";
import {
  ConflictTypeText,
  ReviewKindText,
  ReviewResolutionText,
} from "../constants/Review";

/** 混合格式化工具：日期/数字/状态/风险等级/达标率/冲突文案，多页面共用。 */

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("zh-CN") : "—";

export const formatDay = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("zh-CN") : "—";

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const RISK_TEXT: Record<string, string> = { LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重" };
export const formatRisk = (value: string) => RISK_TEXT[value] ?? value;
export const formatSeverity = formatRisk;

export function formatDeviceStatus(value: string): string {
  return DeviceStatusText[value as keyof typeof DeviceStatusText] ?? value;
}

export function formatResultStatus(value: string): string {
  return ResultStatusText[value as keyof typeof ResultStatusText] ?? value;
}

export function formatRectifyStatus(value: string): string {
  return RectifyStatusText[value as keyof typeof RectifyStatusText] ?? value;
}

/** 通用兜底：优先匹配设备/结果/整改状态，再退回枚举原文。 */
export function formatStatus(value: string): string {
  return formatDeviceStatus(value) && DeviceStatusText[value as keyof typeof DeviceStatusText]
    ? formatDeviceStatus(value)
    : value;
}

export const formatConflictType = (value: string) => ConflictTypeText[value] ?? value;
export const formatReviewKind = (value: string) => ReviewKindText[value] ?? value;
export const formatReviewResolution = (value: string) =>
  ReviewResolutionText[value as keyof typeof ReviewResolutionText] ?? value;
