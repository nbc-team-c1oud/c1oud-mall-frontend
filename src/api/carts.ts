import { api } from "./client";
import type { AddCartItemRequest } from "./types";

export function addCartItem(body: AddCartItemRequest) {
  return api<void>("/api/v1/carts/items", { method: "POST", body });
}
