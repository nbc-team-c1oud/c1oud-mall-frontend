import { api } from "./client";
import type {
  GetOrderPreviewResponse,
  OrderByOrderIdResponse,
  OrderCheckoutRequest,
  OrderCheckoutResponse,
  OrderResponse,
} from "./types";

export function getOrderPreview(cartItemIds: number[]) {
  return api<GetOrderPreviewResponse>("/api/v1/orders/preview", {
    method: "POST",
    body: { cartItemIds },
  });
}

export function createOrder(body: OrderCheckoutRequest) {
  return api<OrderCheckoutResponse>("/api/v1/orders", {
    method: "POST",
    body,
  });
}

export function listMyOrders() {
  return api<OrderResponse[]>("/api/v1/orders");
}

export function getOrder(orderId: number) {
  return api<OrderByOrderIdResponse>(`/api/v1/orders/${orderId}`);
}

export function cancelOrder(orderId: number) {
  return api<void>(`/api/v1/orders/${orderId}/cancel`, { method: "PATCH" });
}
