import { ApiError } from "../api/client";

const CODE_MESSAGES: Record<string, string> = {
  /* === 주문 (OD) === */
  OD001: "주문을 찾을 수 없습니다.",
  OD002: "이미 처리되었거나 변경할 수 없는 주문 상태입니다.",

  /* === 결제 (PM) === */
  PM001: "결제 정보를 찾을 수 없습니다.",
  PM002: "이미 완료된 결제입니다.",
  PM003: "결제 금액이 일치하지 않습니다.",
  PM004: "PG사 결제 상태를 확인할 수 없습니다.",
  PM005: "결제가 승인되지 않았습니다. 다시 시도해주세요.",
  PM006: "결제 사전등록에 실패했습니다.",
  PM007: "포인트 사용 정보가 올바르지 않습니다.",
  PM008: "백엔드에 등록된 결제 건을 찾을 수 없습니다.",
  PM009: "결제 정보 소유자가 일치하지 않습니다.",
  PM010: "주문과 결제가 매칭되지 않습니다. 다시 시도해주세요.",

  /* === 클라이언트 인프라 === */
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
