import { api } from "./client";
import type { AddCartItemRequest, AddCartItemResponse } from "./types";

export function addCartItem(body: AddCartItemRequest) {
  return api<AddCartItemResponse | undefined>("/api/v1/carts/items", {
    method: "POST",
    body,
  });
}
