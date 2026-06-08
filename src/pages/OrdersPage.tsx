import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyOrders } from "../api/orders";
import type { OrderResponse } from "../api/types";
import { describeError } from "../lib/errorMessage";
import { formatDateTime, formatPrice } from "../lib/format";
import { deriveOrderState } from "../lib/orderStatus";
import "./OrdersPage.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [err, setErr] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMyOrders()
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
        setErr(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(describeError(e));
        setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container orders-wrap">
      <header className="orders-head">
        <h1>주문 내역</h1>
        <p className="orders-sub">결제한 주문을 최신순으로 보여드려요.</p>
      </header>

      {loading && (
        <div className="orders-skeletons">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton orders-skel" />
          ))}
        </div>
      )}

      {!loading && err && (
        <div className="alert alert-error">
          <strong>[{err.code}]</strong> {err.message}
        </div>
      )}

      {!loading && !err && orders && orders.length === 0 && (
        <div className="orders-empty card">
          <div className="orders-empty-icon" aria-hidden="true">📦</div>
          <h3>아직 주문이 없어요</h3>
          <p>마음에 드는 상품을 담아 결제해보세요.</p>
          <Link to="/products" className="btn btn-primary">상품 보러가기</Link>
        </div>
      )}

      {!loading && !err && orders && orders.length > 0 && (
        <ul className="orders-list">
          {orders.map((o) => {
            const state = deriveOrderState(o.orderStatus, o.paymentStatus);
            return (
            <li key={o.orderId}>
              <Link to={`/orders/${o.orderId}`} className="orders-card card">
                <div className="orders-card-head">
                  <span className={`badge ${state.badgeClass}`}>
                    {state.label}
                  </span>
                  <time className="orders-card-date">{formatDateTime(o.createAt)}</time>
                </div>
                <div className="orders-card-name">{o.orderName}</div>
                <div className="orders-card-meta">
                  <code className="orders-card-no">{o.orderNumber}</code>
                  <span>주문번호 {o.orderId}</span>
                  {o.paymentId > 0 && <span>결제번호 {o.paymentId}</span>}
                </div>
                <div className="orders-card-total">
                  <span>총 결제 금액</span>
                  <strong>{formatPrice(o.totalAmount)}</strong>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
