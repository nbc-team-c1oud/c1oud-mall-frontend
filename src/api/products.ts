import { api } from "./client";
import type {
  ProductDetail,
  ProductListItem,
  ProductListQuery,
  SpringPage,
} from "./types";

export function listProducts(query: ProductListQuery = {}) {
  return api<SpringPage<ProductListItem>>("/api/v1/products", {
    auth: false,
    query: query as Record<string, string | number | boolean | undefined>,
  });
}

export function fetchProduct(productId: number) {
  return api<ProductDetail>(`/api/v1/products/${productId}`, { auth: false });
}
