import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelOrder, getOrder } from "../api/orders";
import type { OrderByOrderIdResponse } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { describeError } from "../lib/errorMessage";
import { formatDateTime, formatPrice } from "../lib/format";
import { deriveOrderState } from "../lib/orderStatus";
import OrderRefundDialog from "./OrderRefundDialog";
import "./OrderDetailPage.css";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { refresh: refreshAuth } = useAuth();
  const [order, setOrder] = useState<OrderByOrderIdResponse | null>(null);
  const [err, setErr] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<{ code: string; message: string } | null>(null);
  const [showRefund, setShowRefund] = useState(false);

  const reload = async (id: number) => {
    const fresh = await getOrder(id);
    setOrder(fresh);
  };

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

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm("이 주문을 취소할까요?")) return;
    setCancelling(true);
    setCancelErr(null);
    try {
      await cancelOrder(order.orderId);
      await reload(order.orderId);
      void refreshAuth();
    } catch (e) {
      setCancelErr(describeError(e));
    } finally {
      setCancelling(false);
    }
  };

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

  const state = deriveOrderState(order.orderStatus, order.paymentStatus);

  // 취소 가능 조건: 결제 대기 + 결제가 PENDING/FAILED인 경우 (v3 §7.5)
  const canCancel =
    order.orderStatus === "PENDING_PAYMENT" &&
    order.paymentStatus !== "COMPLETED";

  // 환불 가능 조건: 결제 완료 + 환불 가능한 항목 보유 + orderItemId 사용 가능
  const hasOrderItemIds = order.orderItems.every((it) => it.orderItemId != null);
  const hasRefundableQty = order.orderItems.some(
    (it) => it.quantity - (it.refundedQuantity ?? 0) > 0,
  );
  const refundEligible = order.paymentStatus === "COMPLETED" && hasRefundableQty;
  const refundBlockedByBe = refundEligible && !hasOrderItemIds;
  const canRefund = refundEligible && hasOrderItemIds;

  return (
    <div className="container od-wrap">
      <Link to="/orders" className="btn btn-ghost btn-sm od-back">
        ← 주문 내역으로
      </Link>

      <header className="od-head card">
        <div className="od-head-top">
          <span className={`badge ${state.badgeClass}`}>{state.label}</span>
          <time className="od-head-date">{formatDateTime(order.createAt)}</time>
        </div>
        <h1 className="od-head-name">{order.orderName}</h1>
        <div className="od-head-meta">
          <Row label="주문번호">
            <code>{order.orderNumber}</code>
          </Row>
          <Row label="주문 ID">#{order.orderId}</Row>
          {order.paymentId > 0 && <Row label="결제 ID">#{order.paymentId}</Row>}
          <Row label="주문 상태">
            <code>{order.orderStatus}</code>
          </Row>
          <Row label="결제 상태">
            <code>{order.paymentStatus}</code>
          </Row>
        </div>
      </header>

      {state.hint && (
        <div className="alert alert-info">{state.hint}</div>
      )}

      <section className="card od-items-card">
        <h3>주문 상품 ({order.orderItems.length}건)</h3>
        <ul className="od-items">
          {order.orderItems.map((item, idx) => {
            const subtotal =
              item.subtotal ?? item.priceSnapshot * item.quantity;
            return (
              <li key={item.orderItemId ?? item.productId ?? idx} className="od-item">
                {item.productId ? (
                  <Link to={`/products/${item.productId}`} className="od-item-name">
                    {item.productNameSnapshot}
                  </Link>
                ) : (
                  <span className="od-item-name">{item.productNameSnapshot}</span>
                )}
                <div className="od-item-meta">
                  <span>
                    {formatPrice(item.priceSnapshot)} × {item.quantity}개
                  </span>
                  {item.refundedQuantity != null && item.refundedQuantity > 0 && (
                    <span className="od-item-refund">
                      환불 {item.refundedQuantity}개
                    </span>
                  )}
                </div>
                <div className="od-item-subtotal">{formatPrice(subtotal)}</div>
              </li>
            );
          })}
        </ul>

        <dl className="od-summary">
          <div>
            <dt>상품 합계</dt>
            <dd>{formatPrice(order.totalAmount)}</dd>
          </div>
          <div>
            <dt>포인트 사용</dt>
            <dd>− {formatPrice(order.pointUsedAmount)}</dd>
          </div>
          <div>
            <dt>PG 청구액</dt>
            <dd>{formatPrice(order.pgAmount)}</dd>
          </div>
          {order.pointEarnedAmount > 0 && (
            <div>
              <dt>적립 포인트</dt>
              <dd>+ {formatPrice(order.pointEarnedAmount)} P</dd>
            </div>
          )}
        </dl>

        <div className="od-total">
          <span>총 결제 금액</span>
          <strong>{formatPrice(order.totalAmount)}</strong>
        </div>
      </section>

      {cancelErr && (
        <div className="alert alert-error">
          <strong>[{cancelErr.code}]</strong> {cancelErr.message}
        </div>
      )}

      {canCancel && (
        <div className="od-actions">
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "취소 중…" : "주문 취소"}
          </button>
        </div>
      )}

      {canRefund && (
        <div className="od-actions">
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => setShowRefund(true)}
          >
            환불 요청
          </button>
        </div>
      )}

      {refundBlockedByBe && (
        <div className="alert alert-warn">
          환불 기능을 사용하려면 백엔드 OrderItemResponse에 <code>orderItemId</code> 필드 노출이 필요합니다.
        </div>
      )}

      {showRefund && (
        <OrderRefundDialog
          order={order}
          onClose={() => {
            setShowRefund(false);
            void reload(order.orderId);
          }}
          onRefunded={() => {
            // 모달이 결과 화면을 보여주는 동안 백그라운드에서 최신 주문/잔액 미리 로드
            void reload(order.orderId);
            void refreshAuth();
          }}
        />
      )}
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
