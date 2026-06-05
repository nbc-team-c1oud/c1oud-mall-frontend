import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/orders";
import type { OrderByOrderIdResponse, OrderStatus } from "../api/types";
import { describeError } from "../lib/errorMessage";
import { formatDateTime, formatPrice } from "../lib/format";
import "./OrderDetailPage.css";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "결제 대기",
  CONFIRMED: "결제 완료",
  CANCELLED: "취소됨",
};
const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "badge-warn",
  CONFIRMED: "badge-brand",
  CANCELLED: "badge-soldout",
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderByOrderIdResponse | null>(null);
  const [err, setErr] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(orderId);
    if (!orderId || Number.isNaN(id)) {
      setErr({ code: "ERR", message: "잘못된 주문 번호입니다." });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getOrder(id)
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setErr(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(describeError(e));
        setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container od-wrap">
        <div className="skeleton od-skel" />
        <div className="skeleton od-skel od-skel-body" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="container od-wrap">
        <Link to="/orders" className="btn btn-ghost btn-sm od-back">
          ← 주문 내역으로
        </Link>
        <div className="alert alert-error">
          <strong>[{err.code}]</strong> {err.message}
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container od-wrap">
      <Link to="/orders" className="btn btn-ghost btn-sm od-back">
        ← 주문 내역으로
      </Link>

      <header className="od-head card">
        <div className="od-head-top">
          <span className={`badge ${STATUS_CLASS[order.orderStatus]}`}>
            {STATUS_LABEL[order.orderStatus]}
          </span>
          <time className="od-head-date">{formatDateTime(order.createdAt)}</time>
        </div>
        <h1 className="od-head-name">{order.orderName}</h1>
        <div className="od-head-meta">
          <Row label="주문번호">
            <code>{order.orderNumber}</code>
          </Row>
          <Row label="주문 ID">#{order.orderId}</Row>
          {order.paymentId > 0 && <Row label="결제 ID">#{order.paymentId}</Row>}
        </div>
      </header>

      <section className="card od-items-card">
        <h3>주문 상품 ({order.orderItems.length}건)</h3>
        <ul className="od-items">
          {order.orderItems.map((item) => (
            <li key={item.productId} className="od-item">
              <Link to={`/products/${item.productId}`} className="od-item-name">
                {item.productNameSnapshot}
              </Link>
              <div className="od-item-meta">
                <span>{formatPrice(item.priceSnapshot)} × {item.quantity}개</span>
                {item.refundedQuantity > 0 && (
                  <span className="od-item-refund">
                    환불 {item.refundedQuantity}개
                  </span>
                )}
              </div>
              <div className="od-item-subtotal">{formatPrice(item.subtotal)}</div>
            </li>
          ))}
        </ul>

        <div className="od-total">
          <span>총 결제 금액</span>
          <strong>{formatPrice(order.totalAmount)}</strong>
        </div>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="od-row">
      <span className="od-row-label">{label}</span>
      <span className="od-row-value">{children}</span>
    </div>
  );
}
