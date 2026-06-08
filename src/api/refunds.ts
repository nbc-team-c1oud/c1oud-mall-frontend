import { api } from "./client";
import type { RefundRequest, RefundResponse } from "./types";

export function refundOrder(orderId: number, body: RefundRequest) {
  return api<RefundResponse>(`/api/v1/orders/${orderId}/refunds`, {
    method: "POST",
    body,
  });
}
