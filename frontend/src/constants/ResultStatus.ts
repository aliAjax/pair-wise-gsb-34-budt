export const ResultStatus = ["QUALIFIED", "ABNORMAL", "NOT_DONE"] as const;
export type ResultStatus = (typeof ResultStatus)[number];
export const ResultStatusText: Record<ResultStatus, string> = {
  QUALIFIED: "合格",
  ABNORMAL: "异常",
  NOT_DONE: "未检",
};
