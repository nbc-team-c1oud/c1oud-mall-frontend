import { api } from "./client";
import type { PointBalanceResponse, PointHistoryResponse } from "./types";

export function getPointBalance() {
  return api<PointBalanceResponse>("/api/v1/points/balance");
}

// BE 경로 typo: histoties (v3 §9.2). 백엔드 수정 전까지 그대로 호출.
export function listPointHistories() {
  return api<PointHistoryResponse[]>("/api/v1/points/histoties");
}
