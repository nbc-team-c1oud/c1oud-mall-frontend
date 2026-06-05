export type UserRole = "USER" | "ADMIN";
export type ProductStatus = "SALE" | "SOLD_OUT";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";
export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";

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

export interface AddCartItemResponse {
  cartItemId: number;
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

/* === Order === */

export interface GetOrderPreviewResponse {
  items: OrderPreviewItem[];
  totalPrice: number;
}

export interface OrderPreviewItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderCheckoutRequest {
  cartItemIds: number[];
}

export interface OrderCheckoutResponse {
  orderId: number;
  portonePaymentId: string | null;
  orderNumber: string;
  orderName: string;
  orderStatus: OrderStatus;
  totalPrice: number;
}

export interface OrderItemResponse {
  productId: number;
  productNameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  refundedQuantity: number;
  subtotal: number;
}

export interface OrderResponse {
  orderId: number;
  orderNumber: string;
  orderName: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  paymentId: number;
  createdAt: string;
}

export interface OrderByOrderIdResponse {
  orderId: number;
  orderNumber: string;
  orderName: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  paymentId: number;
  createdAt: string;
  orderItems: OrderItemResponse[];
}
