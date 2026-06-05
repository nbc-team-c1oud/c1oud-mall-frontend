import { api } from "./client";
import type {
  AddCartItemRequest,
  AddCartItemResponse,
  CartListResponse,
  UpdateCartItemQuantityRequest,
} from "./types";

export function listCart() {
  return api<CartListResponse>("/api/v1/carts");
}

export function listSelectedCart(cartItemIds: number[]) {
  const search = cartItemIds.map((id) => `ids=${id}`).join("&");
  return api<CartListResponse>(`/api/v1/carts/selected?${search}`);
}

export function addCartItem(body: AddCartItemRequest) {
  return api<AddCartItemResponse | undefined>("/api/v1/carts/items", {
    method: "POST",
    body,
  });
}

export function updateCartItemQuantity(
  cartItemId: number,
  body: UpdateCartItemQuantityRequest,
) {
  return api<void>(`/api/v1/carts/items/${cartItemId}`, {
    method: "PATCH",
    body,
  });
}

export function deleteCartItem(cartItemId: number) {
  return api<void>(`/api/v1/carts/items/${cartItemId}`, { method: "DELETE" });
}

export function deleteSelectedCart(cartItemIds: number[]) {
  const search = cartItemIds.map((id) => `ids=${id}`).join("&");
  return api<void>(`/api/v1/carts/selected?${search}`, { method: "DELETE" });
}

export function clearCart() {
  return api<void>("/api/v1/carts", { method: "DELETE" });
}
