import type { OrderStatus, PaymentStatus } from "../api/types";

export interface DerivedOrderState {
  label: string;
  badgeClass: string;
  hint?: string;
}

// 주문 상태(orderStatus)와 결제 상태(paymentStatus)를 합쳐 사용자 친화 라벨로 변환.
// BE에서 두 상태가 어긋난 케이스(paymentStatus=COMPLETED인데 orderStatus=PENDING_PAYMENT)
// 사용자에겐 paymentStatus를 신뢰해 "결제 완료"로 보여주고 hint로 보조 안내.
export function deriveOrderState(
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus,
): DerivedOrderState {
  if (orderStatus === "CANCELLED") {
    return { label: "취소됨", badgeClass: "badge-soldout" };
  }
  if (paymentStatus === "COMPLETED") {
    return {
      label: "결제 완료",
      badgeClass: "badge-brand",
      hint:
        orderStatus === "PENDING_PAYMENT"
          ? "결제는 완료되었으나 주문 확정 처리에 지연이 있을 수 있어요. 잠시 후 새로고침해주세요."
          : undefined,
    };
  }
  if (paymentStatus === "FAILED") {
    return { label: "결제 실패", badgeClass: "badge-soldout" };
  }
  if (orderStatus === "CONFIRMED") {
    return { label: "결제 진행 중", badgeClass: "badge-warn" };
  }
  return { label: "결제 대기", badgeClass: "badge-warn" };
}
