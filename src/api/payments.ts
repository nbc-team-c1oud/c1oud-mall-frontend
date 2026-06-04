import { api } from "./client";
import type { PaymentConfirmRequest, PaymentConfirmResponse } from "./types";

export function confirmPayment(body: PaymentConfirmRequest) {
  return api<PaymentConfirmResponse>("/api/v1/payments/confirm", {
    method: "POST",
    body,
  });
}
