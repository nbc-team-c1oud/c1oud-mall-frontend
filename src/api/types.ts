export type UserRole = "USER" | "ADMIN";
export type ProductStatus = "SALE" | "SOLD_OUT";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface ApiEnvelope<T> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  timestamp: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  pointBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  stockQuantity: number;
  category: string;
  status: ProductStatus;
}

export interface ProductDetail extends ProductListItem {
  description: string;
}

export interface PageSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}
export interface Pageable {
  sort: PageSort;
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}
export interface SpringPage<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ProductListQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface PaymentConfirmRequest {
  orderId: number;
  portonePaymentId: string;
}

export interface PaymentConfirmResponse {
  paymentId: number;
  portonePaymentId: string;
  status: PaymentStatus;
  alreadyCompleted: boolean;
}
