import { ApiError } from "../api/client";

// v3 §13: 백엔드 message가 SSOT — 그대로 표시 권장.
// 도메인 코드(CT*/CRT*/OD*/PT*/PM*)는 자체 매핑 없이 ApiError.message를 그대로 노출.
// 클라이언트 인프라 코드만 자체 메시지 유지.
const CODE_MESSAGES: Record<string, string> = {
  NET: "네트워크 연결을 확인해주세요.",
  HTTP: "요청 처리 중 오류가 발생했습니다.",
  PARSE: "서버 응답을 해석할 수 없습니다.",
};

const STATUS_FALLBACK: Record<number, string> = {
  400: "요청이 올바르지 않습니다.",
  401: "로그인이 필요합니다.",
  403: "접근 권한이 없습니다.",
  404: "요청한 자원을 찾을 수 없습니다.",
  409: "현재 상태에서 처리할 수 없는 요청입니다.",
  500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

export function describeError(err: unknown): { code: string; message: string } {
  if (err instanceof ApiError) {
    const mapped = CODE_MESSAGES[err.code];
    if (mapped) return { code: err.code, message: mapped };
    const fromStatus = STATUS_FALLBACK[err.status];
    if (fromStatus) return { code: err.code, message: fromStatus };
    return { code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    return { code: "ERR", message: err.message };
  }
  return { code: "ERR", message: "알 수 없는 오류가 발생했습니다." };
}
