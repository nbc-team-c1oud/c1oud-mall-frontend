import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortOne from "@portone/browser-sdk/v2";
import type { PaymentRequest } from "@portone/browser-sdk/v2";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { confirmPayment } from "../api/payments";
import { ApiError } from "../api/client";
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, totalAmount, clear } = useCart();

  const [step, setStep] = useState<Step>("idle");
  const [paymentId, setPaymentId] = useState(() => crypto.randomUUID());
  const fakeOrderId = useMemo(() => Math.floor(Math.random() * 9000) + 1000, []);
  const [payMethod, setPayMethod] = useState<PayMethodValue>("CARD");
  const [pointUse, setPointUse] = useState(0);

  // 결과 상태
  const [sdkSuccess, setSdkSuccess] = useState<{ paymentId: string; txId: string } | null>(null);
  const [sdkFail, setSdkFail] = useState<FailReason | null>(null);
  const [confirmRes, setConfirmRes] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<FailReason | null>(null);

  if (lines.length === 0) {
    return (
      <div className="container co-empty">
        <h2>결제할 상품이 없어요</h2>
        <Link to="/products" className="btn btn-primary">상품 보러가기</Link>
      </div>
    );
  }

  const pgAmount = Math.max(0, totalAmount - pointUse);
  const orderName =
    lines.length === 1
      ? lines[0].name
      : `${lines[0].name} 외 ${lines.length - 1}건`;

  const resetForRetry = () => {
    setPaymentId(crypto.randomUUID());
    setSdkSuccess(null);
    setSdkFail(null);
    setConfirmRes(null);
    setConfirmErr(null);
    setStep("idle");
  };

  const runFlow = async () => {
    if (!HAS_PORTONE_ENV || pgAmount <= 0) return;
    setSdkSuccess(null);
    setSdkFail(null);
    setConfirmRes(null);
    setConfirmErr(null);

    // ① 백엔드 주문/결제 사전등록 — 현재 API 부재로 mock pause
    setStep("init");
    await new Promise((r) => setTimeout(r, 500));

    // ② PortOne SDK 호출 (실제 결제창)
    setStep("portone");
    let resp;
    try {
      resp = await PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        paymentId,
        orderName,
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
        customData: { orderId: fakeOrderId, source: "c1oud-mall-fe" },
      } as PaymentRequest);
    } catch (e) {
      setSdkFail({
        code: "SDK_THROW",
        message: e instanceof Error ? e.message : "SDK 호출 중 예외 발생",
      });
      setStep("done");
      return;
    }

    // 모바일 redirect 모드 — 데스크탑 테스트에서는 거의 발생하지 않음
    if (!resp) {
      setSdkFail({
        code: "REDIRECT",
        message:
          "리디렉션 결제 흐름입니다. redirectUrl 라우트에서 결과 처리가 필요합니다.",
      });
      setStep("done");
      return;
    }

    // PortOne이 실패/취소 응답
    if (resp.code) {
      setSdkFail({ code: resp.code, message: resp.message ?? "결제 실패" });
      setStep("done");
      return;
    }

    setSdkSuccess({ paymentId: resp.paymentId, txId: resp.txId });

    // ③ 백엔드 결제 확정 (검증 7단계)
    setStep("confirm");
    try {
      const res = await confirmPayment({
        orderId: fakeOrderId,
        portonePaymentId: resp.paymentId,
      });
      setConfirmRes(
        `paymentId=${res.paymentId}, status=${res.status}${res.alreadyCompleted ? " (멱등 재호출)" : ""}`,
      );
    } catch (e) {
      setConfirmErr(
        e instanceof ApiError
          ? { code: e.code, message: e.message }
          : { code: "ERR", message: "알 수 없는 오류" },
      );
    }
    setStep("done");
  };

  const finishOk = () => {
    clear();
    navigate("/", { replace: true });
  };

  const disabled = !HAS_PORTONE_ENV || pgAmount <= 0 || (step !== "idle" && step !== "done");

  return (
    <div className="container co-wrap">
      <h1>결제하기</h1>
      <p className="co-sub">
        PortOne V2 브라우저 SDK 실연동입니다. 테스트 채널키로 결제창이 실제로 열립니다.
        백엔드 주문 사전등록 API가 아직 없어 ③ <code>/payments/confirm</code>은{" "}
        <strong>PM008</strong> (Payment not found)으로 응답되는 게 정상입니다.
      </p>

      {!HAS_PORTONE_ENV && (
        <div className="alert alert-warn">
          <strong>⚠ PortOne 환경변수 누락</strong>
          <br />
          <code>.env</code>에 <code>VITE_PORTONE_STORE_ID</code>와{" "}
          <code>VITE_PORTONE_CHANNEL_KEY</code>를 채우고 dev 서버를 재시작해주세요.
          PortOne 콘솔 → 결제연동 → 채널에서 <strong>테스트 채널</strong> 키를 발급받습니다.
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

          <h3 style={{ marginTop: 28 }}>주문 상품 ({lines.length}건)</h3>
          <ul className="co-items">
            {lines.map((l) => (
              <li key={l.productId}>
                <span>{l.name} × {l.quantity}</span>
                <span>{formatPrice(l.price * l.quantity)}</span>
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
              max={Math.min(user?.pointBalance ?? 0, totalAmount)}
              value={pointUse}
              onChange={(e) =>
                setPointUse(
                  Math.max(
                    0,
                    Math.min(
                      user?.pointBalance ?? 0,
                      Math.min(totalAmount, Number(e.target.value) || 0),
                    ),
                  ),
                )
              }
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPointUse(Math.min(user?.pointBalance ?? 0, totalAmount))}
            >
              전액 사용
            </button>
          </div>
        </section>

        <aside className="card co-summary">
          <h3>결제 금액</h3>
          <dl>
            <div><dt>상품 금액</dt><dd>{formatPrice(totalAmount)}</dd></div>
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
            <div><span>orderId</span><code>#{fakeOrderId} (mock)</code></div>
            <div><span>paymentId</span><code>{paymentId.slice(0, 8)}…</code></div>
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
          paymentId={paymentId}
          orderId={fakeOrderId}
          pgAmount={pgAmount}
          payMethod={payMethod}
          sdkSuccess={sdkSuccess}
          sdkFail={sdkFail}
          confirmRes={confirmRes}
          confirmErr={confirmErr}
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
  paymentId: string;
  orderId: number;
  pgAmount: number;
  payMethod: PayMethodValue;
  sdkSuccess: { paymentId: string; txId: string } | null;
  sdkFail: FailReason | null;
  confirmRes: string | null;
  confirmErr: FailReason | null;
  onClose: () => void;
}

function FlowModal({
  step,
  paymentId,
  orderId,
  pgAmount,
  payMethod,
  sdkSuccess,
  sdkFail,
  confirmRes,
  confirmErr,
  onClose,
}: FlowModalProps) {
  const steps = [
    { key: "init", label: "① 백엔드 주문/결제 사전등록", state: "현재 mock (API 부재)" },
    { key: "portone", label: "② PortOne.requestPayment", state: "실제 SDK 호출" },
    { key: "confirm", label: "③ POST /api/v1/payments/confirm", state: "검증 7단계" },
  ] as const;

  const stepOrder: Record<Step, number> = { idle: -1, init: 0, portone: 1, confirm: 2, done: 3 };
  const current = stepOrder[step];
  const portoneFailed = sdkFail !== null;

  const stateOf = (idx: number): "wait" | "active" | "done" | "fail" => {
    if (idx < current) {
      // portone(1) 단계에서 실패하면 confirm(2)은 wait로 남음
      if (idx === 1 && portoneFailed) return "fail";
      return "done";
    }
    if (idx === current) return "active";
    return "wait";
  };

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
          <div><span>paymentId</span><code>{paymentId}</code></div>
          <div><span>orderId</span><code>#{orderId}</code></div>
          <div><span>pgAmount</span><code>{pgAmount.toLocaleString()}원</code></div>
          {sdkSuccess && (
            <div><span>SDK txId</span><code>{sdkSuccess.txId}</code></div>
          )}
        </div>

        {step === "done" && sdkFail && (
          <div className="alert alert-error">
            <strong>[PortOne {sdkFail.code}]</strong> {sdkFail.message}
            <br />
            <small>
              ※ 사용자가 결제창을 닫았거나 PG에서 거부한 경우입니다. 다시 시도할 수 있습니다.
            </small>
          </div>
        )}
        {step === "done" && !sdkFail && confirmErr && (
          <div className="alert alert-error">
            <strong>[{confirmErr.code}]</strong> {confirmErr.message}
            <br />
            <small>
              ※ paymentId가 백엔드 DB에 없어 <code>PM008</code> 응답이 정상입니다.
              실제 결제 확정은 백엔드에 <code>POST /api/v1/orders</code> +
              {" "}<code>POST /api/v1/payments</code> 추가 후 가능합니다.
            </small>
          </div>
        )}
        {step === "done" && confirmRes && (
          <div className="alert alert-info">✅ 결제 확정 성공 — {confirmRes}</div>
        )}

        {step === "done" && (
          <button className="btn btn-primary btn-block" onClick={onClose}>
            {confirmRes ? "확인 (장바구니 비우고 홈으로)" : "다시 시도하기"}
          </button>
        )}
      </div>
    </div>
  );
}
