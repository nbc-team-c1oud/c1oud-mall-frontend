import { useMemo, useState } from "react";
import { refundOrder } from "../api/refunds";
import type {
  OrderByOrderIdResponse,
  RefundItemRequest,
  RefundResponse,
} from "../api/types";
import { describeError } from "../lib/errorMessage";
import { formatPrice } from "../lib/format";
import "./OrderRefundDialog.css";

interface Props {
  order: OrderByOrderIdResponse;
  onClose: () => void;
  onRefunded: (res: RefundResponse) => void;
}

interface Row {
  orderItemId: number;
  productName: string;
  priceSnapshot: number;
  available: number;
  selected: number;
}

export default function OrderRefundDialog({ order, onClose, onRefunded }: Props) {
  const initialRows: Row[] = useMemo(
    () =>
      order.orderItems
        .filter((it) => it.orderItemId != null)
        .map((it) => ({
          orderItemId: it.orderItemId as number,
          productName: it.productNameSnapshot,
          priceSnapshot: it.priceSnapshot,
          available: Math.max(0, it.quantity - (it.refundedQuantity ?? 0)),
          selected: 0,
        })),
    [order.orderItems],
  );

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<{ code: string; message: string } | null>(null);
  const [result, setResult] = useState<RefundResponse | null>(null);

  const expectedTotal = rows.reduce(
    (sum, r) => sum + r.priceSnapshot * r.selected,
    0,
  );
  const hasSelection = rows.some((r) => r.selected > 0);
  const canSubmit = hasSelection && reason.trim().length > 0 && !submitting;

  const updateSelected = (orderItemId: number, value: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.orderItemId === orderItemId
          ? { ...r, selected: Math.max(0, Math.min(r.available, value)) }
          : r,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    const items: RefundItemRequest[] = rows
      .filter((r) => r.selected > 0)
      .map((r) => ({ orderItemId: r.orderItemId, quantity: r.selected }));
    try {
      const res = await refundOrder(order.orderId, { items, reason: reason.trim() });
      setResult(res);
      onRefunded(res);
    } catch (e) {
      setErr(describeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rd-modal" role="dialog" aria-modal="true" aria-label="환불 요청">
      <div className="rd-card card">
        <header className="rd-head">
          <h3>환불 요청</h3>
          <button
            type="button"
            className="rd-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        {!result && (
          <>
            <p className="rd-sub">
              환불할 상품과 수량을 선택해주세요. 실제 환불 금액은 백엔드에서 계산되어 응답으로 반환됩니다.
            </p>

            <ul className="rd-items">
              {rows.map((r) => (
                <li key={r.orderItemId} className="rd-item">
                  <div className="rd-item-info">
                    <div className="rd-item-name">{r.productName}</div>
                    <div className="rd-item-meta">
                      단가 {formatPrice(r.priceSnapshot)} · 환불 가능 {r.available}개
                    </div>
                  </div>
                  <div className="rd-item-qty">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateSelected(r.orderItemId, r.selected - 1)}
                      disabled={r.selected <= 0 || submitting}
                      aria-label="수량 감소"
                    >
                      −
                    </button>
                    <input
                      className="input rd-qty-input"
                      type="number"
                      min={0}
                      max={r.available}
                      value={r.selected}
                      onChange={(e) =>
                        updateSelected(r.orderItemId, Number(e.target.value) || 0)
                      }
                      disabled={submitting || r.available === 0}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateSelected(r.orderItemId, r.selected + 1)}
                      disabled={r.selected >= r.available || submitting}
                      aria-label="수량 증가"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rd-reason">
              <label htmlFor="rd-reason-input">환불 사유</label>
              <textarea
                id="rd-reason-input"
                className="input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 단순 변심, 상품 불량 등"
                disabled={submitting}
              />
            </div>

            <div className="rd-total">
              <span>예상 환불 금액</span>
              <strong>{formatPrice(expectedTotal)}</strong>
            </div>

            {err && (
              <div className="alert alert-error">
                <strong>[{err.code}]</strong> {err.message}
              </div>
            )}

            <div className="rd-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? "처리 중…" : "환불 요청"}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            {result.refundStatus === "PG_CANCELLED" ? (
              <div className="alert alert-info">
                ✅ 환불이 완료되었습니다.
                <ul className="rd-result">
                  <li>환불 번호: #{result.refundId}</li>
                  <li>PG 환불 금액: {formatPrice(result.pgRefundAmount)}</li>
                  <li>포인트 환불: {formatPrice(result.pointRefundAmount)}</li>
                </ul>
              </div>
            ) : (
              <div className="alert alert-warn">
                ⏳ 환불 접수가 처리되었습니다. PG 취소는 진행 중입니다.
                {result.warning && <div className="rd-warning">{result.warning}</div>}
                <ul className="rd-result">
                  <li>환불 번호: #{result.refundId}</li>
                  <li>상태: {result.refundStatus}</li>
                  <li>PG 환불 금액(예정): {formatPrice(result.pgRefundAmount)}</li>
                  <li>포인트 환불: {formatPrice(result.pointRefundAmount)}</li>
                </ul>
              </div>
            )}
            <div className="rd-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
