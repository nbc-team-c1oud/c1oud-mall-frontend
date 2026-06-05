import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PortOne from "@portone/browser-sdk/v2";
import type { PaymentRequest } from "@portone/browser-sdk/v2";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import type { CartLine } from "../context/CartContext";
import { createOrder } from "../api/orders";
import { confirmPayment } from "../api/payments";
import type { OrderCheckoutResponse, PaymentConfirmResponse } from "../api/types";
import { describeError } from "../lib/errorMessage";
import { formatPrice } from "../lib/format";
import "./CheckoutPage.css";

type Step = "idle" | "init" | "portone" | "confirm" | "done";

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID ?? "";
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? "";
const HAS_PORTONE_ENV = Boolean(STORE_ID && CHANNEL_KEY);

const PAY_METHODS = [
  { value: "CARD", label: "신용/체크카드" },
  { value: "VIRTUAL_ACCOUNT", label: "가상계좌" },
  { value: "TRANSFER", label: "계좌이체" },
  { value: "EASY_PAY", label: "간편결제" },
] as const;
type PayMethodValue = (typeof PAY_METHODS)[number]["value"];

interface FailReason {
  code: string;
  message: string;
}

interface LocationState {
  cartItemIds?: number[];
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { lines, selectedLines, refresh } = useCart();

  // 결제 대상 선정 우선순위:
  //   1) route state.cartItemIds (CartPage에서 선택한 항목)
  //   2) CartContext.selectedLines (체크박스로 선택해둔 항목)
  //   3) 전체 lines
  const targetLines = useMemo<CartLine[]>(() => {
    const stateIds = (location.state as LocationState | null)?.cartItemIds;
    if (stateIds && stateIds.length > 0) {
      const idSet = new Set(stateIds);
      const matched = lines.filter((l) => idSet.has(l.cartItemId));
      if (matched.length > 0) return matched;
    }
    if (selectedLines.length > 0) return selectedLines;
    return lines;
  }, [lines, selectedLines, location.state]);

  const targetAmount = targetLines.reduce((sum, l) => sum + l.subTotal, 0);

  const [step, setStep] = useState<Step>("idle");
  const [payMethod, setPayMethod] = useState<PayMethodValue>("CARD");
  const [pointUse, setPointUse] = useState(0);

  const [order, setOrder] = useState<OrderCheckoutResponse | null>(null);
  const [fallbackPaymentId, setFallbackPaymentId] = useState<string | null>(null);
  const [sdkSuccess, setSdkSuccess] = useState<{ paymentId: string; txId: string } | null>(null);
  const [sdkFail, setSdkFail] = useState<FailReason | null>(null);
  const [confirmRes, setConfirmRes] = useState<PaymentConfirmResponse | null>(null);
  const [confirmErr, setConfirmErr] = useState<FailReason | null>(null);
  const [initErr, setInitErr] = useState<FailReason | null>(null);

  if (targetLines.length === 0) {
    return (
      <div className="container co-empty">
        <h2>결제할 상품이 없어요</h2>
        <p className="co-sub">
          {lines.length === 0
            ? "장바구니에 상품을 담아주세요."
            : "장바구니로 돌아가 결제할 상품을 선택해주세요."}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <Link to="/cart" className="btn btn-secondary">장바구니로</Link>
          <Link to="/products" className="btn btn-primary">상품 보러가기</Link>
        </div>
      </div>
    );
  }

  const pgAmount = Math.max(0, targetAmount - pointUse);
  const orderName =
    targetLines.length === 1
      ? targetLines[0].productName
      : `${targetLines[0].productName} 외 ${targetLines.length - 1}건`;

  const resetForRetry = () => {
    setOrder(null);
    setFallbackPaymentId(null);
    setSdkSuccess(null);
    setSdkFail(null);
    setConfirmRes(null);
    setConfirmErr(null);
    setInitErr(null);
    setStep("idle");
  };

  const runFlow = async () => {
    if (!HAS_PORTONE_ENV || pgAmount <= 0) return;
    setOrder(null);
    setFallbackPaymentId(null);
    setSdkSuccess(null);
    setSdkFail(null);
    setConfirmRes(null);
    setConfirmErr(null);
    setInitErr(null);

    // ① 백엔드 주문 생성 + 결제 사전등록 (POST /api/v1/orders)
    setStep("init");
    let created: OrderCheckoutResponse;
    try {
      created = await createOrder({
        cartItemIds: targetLines.map((l) => l.cartItemId),
      });
      setOrder(created);
    } catch (e) {
      const d = describeError(e);
      setInitErr(d);
      setStep("done");
      return;
    }

    // payment M3 미완료 갭: portonePaymentId가 비어있으면 FE에서 임시 UUID 생성
    let portonePaymentId = created.portonePaymentId ?? "";
    if (!portonePaymentId) {
      portonePaymentId = crypto.randomUUID();
      setFallbackPaymentId(portonePaymentId);
    }

    // ② PortOne SDK 호출 (실제 결제창)
    setStep("portone");
    let resp;
    try {
      resp = await PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        paymentId: portonePaymentId,
        orderName: created.orderName ?? orderName,
        totalAmount: pgAmount,
        currency: "CURRENCY_KRW",
        payMethod,
        customer: user
          ? {
              customerId: String(user.id),
              fullName: user.name,
              email: user.email,
              phoneNumber: user.phoneNumber,
            }
          : undefined,
        customData: {
          orderId: created.orderId,
          orderNumber: created.orderNumber,
          source: "c1oud-mall-fe",
        },
      } as PaymentRequest);
    } catch (e) {
      setSdkFail({
        code: "SDK_THROW",
        message: e instanceof Error ? e.message : "SDK 호출 중 예외 발생",
      });
      setStep("done");
      return;
    }

    if (!resp) {
      setSdkFail({
        code: "REDIRECT",
        message:
          "리디렉션 결제 흐름입니다. redirectUrl 라우트에서 결과 처리가 필요합니다.",
      });
      setStep("done");
      return;
    }

    if (resp.code) {
      setSdkFail({ code: resp.code, message: resp.message ?? "결제 실패" });
      setStep("done");
      return;
    }

    setSdkSuccess({ paymentId: resp.paymentId, txId: resp.txId });

    // ③ 백엔드 결제 확정
    setStep("confirm");
    try {
      const res = await confirmPayment({
        orderId: created.orderId,
        portonePaymentId: resp.paymentId,
      });
      setConfirmRes(res);
    } catch (e) {
      setConfirmErr(describeError(e));
    }
    setStep("done");
  };

  const finishOk = () => {
    // BE가 주문 시 cart_item을 자동 삭제 → 서버 상태로 refresh
    void refresh();
    navigate("/orders", { replace: true });
  };

  const disabled = !HAS_PORTONE_ENV || pgAmount <= 0 || (step !== "idle" && step !== "done");

  return (
    <div className="container co-wrap">
      <h1>결제하기</h1>
      <p className="co-sub">
        PortOne V2 브라우저 SDK 실연동 + 백엔드 주문 생성 API 연동입니다.
      </p>

      {!HAS_PORTONE_ENV && (
        <div className="alert alert-warn">
          <strong>⚠ PortOne 환경변수 누락</strong>
          <br />
          <code>.env</code>에 <code>VITE_PORTONE_STORE_ID</code>와{" "}
          <code>VITE_PORTONE_CHANNEL_KEY</code>를 채우고 dev 서버를 재시작해주세요.
        </div>
      )}

      <div className="co-grid">
        <section className="card co-card">
          <h3>주문 정보</h3>
          <div className="co-rows">
            <Row label="주문자">{user?.name ?? "-"}</Row>
            <Row label="이메일">{user?.email ?? "-"}</Row>
            <Row label="연락처">{user?.phoneNumber ?? "-"}</Row>
            <Row label="포인트 잔액">
              {user ? `${user.pointBalance.toLocaleString()} P` : "-"}
            </Row>
          </div>

          <h3 style={{ marginTop: 28 }}>주문 상품 ({targetLines.length}건)</h3>
          <ul className="co-items">
            {targetLines.map((l) => (
              <li key={l.cartItemId}>
                <span>{l.productName} × {l.quantity}</span>
                <span>{formatPrice(l.subTotal)}</span>
              </li>
            ))}
          </ul>

          <h3 style={{ marginTop: 28 }}>결제수단</h3>
          <div className="co-paymethods">
            {PAY_METHODS.map((m) => (
              <label
                key={m.value}
                className={`co-paymethod${payMethod === m.value ? " is-active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymethod"
                  value={m.value}
                  checked={payMethod === m.value}
                  onChange={() => setPayMethod(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>

          <h3 style={{ marginTop: 28 }}>포인트 사용</h3>
          <div className="co-points">
            <input
              className="input"
              type="number"
              min={0}
              max={Math.min(user?.pointBalance ?? 0, targetAmount)}
              value={pointUse}
              onChange={(e) =>
                setPointUse(
                  Math.max(
                    0,
                    Math.min(
                      user?.pointBalance ?? 0,
                      Math.min(targetAmount, Number(e.target.value) || 0),
                    ),
                  ),
                )
              }
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPointUse(Math.min(user?.pointBalance ?? 0, targetAmount))}
            >
              전액 사용
            </button>
          </div>
        </section>

        <aside className="card co-summary">
          <h3>결제 금액</h3>
          <dl>
            <div><dt>상품 금액</dt><dd>{formatPrice(targetAmount)}</dd></div>
            <div><dt>포인트 사용</dt><dd>− {formatPrice(pointUse)}</dd></div>
            <div><dt>배송비</dt><dd>무료</dd></div>
          </dl>
          <div className="co-pg-amount">
            <span>PG 청구 (pgAmount)</span>
            <strong>{formatPrice(pgAmount)}</strong>
          </div>

          <div className="co-meta">
            <div><span>storeId</span><code>{STORE_ID ? `${STORE_ID.slice(0, 12)}…` : "미설정"}</code></div>
            <div><span>channelKey</span><code>{CHANNEL_KEY ? `${CHANNEL_KEY.slice(0, 12)}…` : "미설정"}</code></div>
            <div>
              <span>cartItemIds</span>
              <code>[{targetLines.map((l) => l.cartItemId).join(", ")}]</code>
            </div>
          </div>

          {pgAmount <= 0 && HAS_PORTONE_ENV && (
            <div className="alert alert-info" style={{ marginBottom: 12 }}>
              PG 청구액이 0원이라 결제창을 띄울 수 없습니다.
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={runFlow}
            disabled={disabled}
          >
            {step === "idle" || step === "done" ? "PortOne으로 결제하기" : "진행 중…"}
          </button>
        </aside>
      </div>

      {step !== "idle" && (
        <FlowModal
          step={step}
          order={order}
          fallbackPaymentId={fallbackPaymentId}
          pgAmount={pgAmount}
          payMethod={payMethod}
          sdkSuccess={sdkSuccess}
          sdkFail={sdkFail}
          confirmRes={confirmRes}
          confirmErr={confirmErr}
          initErr={initErr}
          onClose={() => {
            if (step !== "done") return;
            if (confirmRes) finishOk();
            else resetForRetry();
          }}
        />
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="co-row">
      <span className="co-row-label">{label}</span>
      <span className="co-row-value">{children}</span>
    </div>
  );
}

interface FlowModalProps {
  step: Step;
  order: OrderCheckoutResponse | null;
  fallbackPaymentId: string | null;
  pgAmount: number;
  payMethod: PayMethodValue;
  sdkSuccess: { paymentId: string; txId: string } | null;
  sdkFail: FailReason | null;
  confirmRes: PaymentConfirmResponse | null;
  confirmErr: FailReason | null;
  initErr: FailReason | null;
  onClose: () => void;
}

function FlowModal({
  step,
  order,
  fallbackPaymentId,
  pgAmount,
  payMethod,
  sdkSuccess,
  sdkFail,
  confirmRes,
  confirmErr,
  initErr,
  onClose,
}: FlowModalProps) {
  const steps = [
    { key: "init", label: "① POST /api/v1/orders", state: "주문 생성 + 결제 사전등록" },
    { key: "portone", label: "② PortOne.requestPayment", state: "실제 SDK 호출" },
    { key: "confirm", label: "③ POST /api/v1/payments/confirm", state: "검증 + 주문 확정" },
  ] as const;

  const stepOrder: Record<Step, number> = { idle: -1, init: 0, portone: 1, confirm: 2, done: 3 };
  const current = stepOrder[step];
  const portoneFailed = sdkFail !== null;
  const initFailed = initErr !== null;

  const stateOf = (idx: number): "wait" | "active" | "done" | "fail" => {
    if (idx < current) {
      if (idx === 0 && initFailed) return "fail";
      if (idx === 1 && portoneFailed) return "fail";
      return "done";
    }
    if (idx === current) return "active";
    return "wait";
  };

  const portonePaymentId =
    sdkSuccess?.paymentId ?? fallbackPaymentId ?? order?.portonePaymentId ?? "-";

  return (
    <div className="co-modal" role="dialog" aria-modal="true" aria-label="결제 진행">
      <div className="co-modal-card card">
        <h3>PortOne V2 결제 흐름</h3>
        <p className="co-modal-sub">테스트 채널 — 실제 SDK가 호출됩니다.</p>

        <ol className="co-steps">
          {steps.map((s, i) => {
            const status = stateOf(i);
            return (
              <li key={s.key} className={`co-step is-${status}`}>
                <span className="co-step-dot" aria-hidden="true">
                  {status === "done"
                    ? "✓"
                    : status === "fail"
                      ? "✕"
                      : status === "active"
                        ? <span className="spinner" />
                        : i + 1}
                </span>
                <div>
                  <div className="co-step-label">{s.label}</div>
                  <div className="co-step-state">{s.state}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="co-modal-meta">
          <div><span>payMethod</span><code>{payMethod}</code></div>
          <div>
            <span>orderId</span>
            <code>{order ? `#${order.orderId} (${order.orderNumber})` : "-"}</code>
          </div>
          <div>
            <span>portonePaymentId</span>
            <code>{portonePaymentId}</code>
          </div>
          <div><span>pgAmount</span><code>{pgAmount.toLocaleString()}원</code></div>
          {sdkSuccess && (
            <div><span>SDK txId</span><code>{sdkSuccess.txId}</code></div>
          )}
        </div>

        {fallbackPaymentId && !initErr && (
          <div className="alert alert-warn" style={{ marginBottom: 12 }}>
            <strong>⚠ portonePaymentId 폴백</strong>
            <br />
            <small>
              백엔드가 portonePaymentId를 반환하지 않아 FE에서 임시 UUID를 생성했습니다.
              payment M3(OrderFacade ↔ PaymentInitiation 연동) 머지 후 자동으로 사라집니다.
            </small>
          </div>
        )}

        {step === "done" && initErr && (
          <div className="alert alert-error">
            <strong>[{initErr.code}]</strong> {initErr.message}
            <br />
            <small>※ 주문 생성에 실패했습니다. 장바구니 상태를 확인 후 다시 시도해주세요.</small>
          </div>
        )}
        {step === "done" && !initErr && sdkFail && (
          <div className="alert alert-error">
            <strong>[PortOne {sdkFail.code}]</strong> {sdkFail.message}
            <br />
            <small>※ 사용자가 결제창을 닫았거나 PG에서 거부한 경우입니다.</small>
          </div>
        )}
        {step === "done" && !initErr && !sdkFail && confirmErr && (
          <div className="alert alert-error">
            <strong>[{confirmErr.code}]</strong> {confirmErr.message}
          </div>
        )}
        {step === "done" && confirmRes && (
          <div className="alert alert-info">
            ✅ 결제 확정 성공 — paymentId={confirmRes.paymentId}, status=
            {confirmRes.status}
            {confirmRes.alreadyCompleted ? " (멱등 재호출)" : ""}
          </div>
        )}

        {step === "done" && (
          <button className="btn btn-primary btn-block" onClick={onClose}>
            {confirmRes ? "확인 (주문 내역으로 이동)" : "다시 시도하기"}
          </button>
        )}
      </div>
    </div>
  );
}
