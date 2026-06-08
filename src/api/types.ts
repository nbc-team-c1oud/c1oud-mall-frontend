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

export interface UpdateCartItemQuantityRequest {
  quantity: number;
}

export interface CartListItemResponse {
  cartItemId: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  /** BE 필드명: subTotal (camelCase 대문자 T) */
  subTotal: number;
}

export interface CartListResponse {
  items: CartListItemResponse[];
  totalPrice: number;
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
  pointUsedAmount: number;
}

export interface OrderCheckoutResponse {
  orderId: number;
  portonePaymentId: string;
  orderNumber: string;
  orderName: string;
  /** BE typo 잔존: 소문자 s (v3 §13) */
  orderstatus: OrderStatus;
  totalAmount: number;
  /** PortOne SDK totalAmount 인자에 넘기는 값 = totalAmount − pointUsedAmount */
  pgAmount: number;
  pointUsedAmount: number;
}

export interface OrderItemResponse {
  /** 환불 요청 시 필요. BE OrderItemResponse 갱신 후부터 항상 존재. */
  orderItemId?: number;
  productNameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  productId?: number;
  refundedQuantity?: number;
  subtotal?: number;
}

export interface OrderResponse {
  orderId: number;
  paymentId: number;
  paymentStatus: PaymentStatus;
  orderNumber: string;
  orderName: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  pgAmount: number;
  pointUsedAmount: number;
  pointEarnedAmount: number;
  /** BE typo 잔존: createdAt 아님 (v3 §13) */
  createAt: string;
  orderItems: OrderItemResponse[];
}

export type OrderByOrderIdResponse = OrderResponse;

/* === Point === */

export type PointTransactionType =
  | "USE"
  | "EARN"
  | "USE_CANCEL"
  | "EARN_CANCEL";

export interface PointBalanceResponse {
  pointBalance: number;
}

export interface PointHistoryResponse {
  pointHistoryId: number;
  type: PointTransactionType;
  amount: number;
  /** 여긴 정상 createdAt (v3 §9.2 주석) */
  createdAt: string;
}

/* === Refund === */

export type RefundStatus =
  | "REQUESTED"
  | "DB_COMMITTED"
  | "PG_CANCELLED"
  | "FAILED";

export interface RefundItemRequest {
  orderItemId: number;
  quantity: number;
}

export interface RefundRequest {
  items: RefundItemRequest[];
  reason: string;
}

export interface RefundResponse {
  refundId: number;
  refundStatus: RefundStatus;
  pgRefundAmount: number;
  pointRefundAmount: number;
  /** 202(DB_COMMITTED) 응답에만 포함 */
  warning?: string;
}
