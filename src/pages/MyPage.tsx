import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listPointHistories } from "../api/points";
import type { PointHistoryResponse, PointTransactionType } from "../api/types";
import { describeError } from "../lib/errorMessage";
import { formatDateTime, formatNumber } from "../lib/format";
import "./MyPage.css";

const POINT_TYPE_LABEL: Record<PointTransactionType, string> = {
  USE: "사용",
  EARN: "적립",
  USE_CANCEL: "사용 취소",
  EARN_CANCEL: "적립 취소",
};

const POINT_TYPE_CLASS: Record<PointTransactionType, string> = {
  USE: "is-use",
  EARN: "is-earn",
  USE_CANCEL: "is-use-cancel",
  EARN_CANCEL: "is-earn-cancel",
};

// USE/EARN_CANCEL는 잔액 차감, EARN/USE_CANCEL은 증가
const isPlus = (type: PointTransactionType) =>
  type === "EARN" || type === "USE_CANCEL";

export default function MyPage() {
  const { user, refresh } = useAuth();
  const [histories, setHistories] = useState<PointHistoryResponse[] | null>(null);
  const [historiesErr, setHistoriesErr] = useState<{ code: string; message: string } | null>(null);
  const [historiesLoading, setHistoriesLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setHistoriesLoading(true);
    // 페이지 진입 시 user.pointBalance도 함께 갱신 — AuthContext 캐시가 stale일 수 있음
    void refresh();
    listPointHistories()
      .then((data) => {
        if (cancelled) return;
        setHistories(data);
        setHistoriesErr(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setHistoriesErr(describeError(e));
        setHistories([]);
      })
      .finally(() => {
        if (!cancelled) setHistoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // user.id 변화 시(다른 계정 로그인)에만 재실행. user 객체 전체를 deps로 두면 refresh가 user를 갱신하며 무한 루프.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="container my-wrap">
      <header className="my-head card">
        <div className="my-avatar">{user.name.slice(0, 1)}</div>
        <div>
          <h1>{user.name}</h1>
          <p className="my-email">{user.email}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => void refresh()}>
          새로고침
        </button>
      </header>

      <section className="my-shortcuts">
        <Link to="/orders" className="my-shortcut card">
          <div className="my-shortcut-icon" aria-hidden="true">📦</div>
          <div>
            <div className="my-shortcut-title">주문 내역</div>
            <div className="my-shortcut-sub">결제한 주문을 확인해요</div>
          </div>
          <div className="my-shortcut-arrow" aria-hidden="true">→</div>
        </Link>
        <Link to="/cart" className="my-shortcut card">
          <div className="my-shortcut-icon" aria-hidden="true">🛒</div>
          <div>
            <div className="my-shortcut-title">장바구니</div>
            <div className="my-shortcut-sub">결제 전 상품을 모아둬요</div>
          </div>
          <div className="my-shortcut-arrow" aria-hidden="true">→</div>
        </Link>
      </section>

      <section className="my-grid">
        <InfoCell label="역할" value={user.role === "ADMIN" ? "관리자" : "일반회원"} />
        <InfoCell label="전화번호" value={user.phoneNumber || "-"} />
        <InfoCell label="포인트 잔액" value={`${formatNumber(user.pointBalance)} P`} highlight />
        <InfoCell label="사용자 ID" value={`#${user.id}`} mono />
        <InfoCell label="가입일" value={formatDateTime(user.createdAt)} />
        <InfoCell label="최근 업데이트" value={formatDateTime(user.updatedAt)} />
      </section>

      <section className="card my-points-card">
        <h3>
          <span>포인트 이력</span>
          <span className="my-cell-label">최근 적립/사용 내역</span>
        </h3>
        {historiesLoading && <div className="my-points-empty">불러오는 중…</div>}
        {!historiesLoading && historiesErr && (
          <div className="alert alert-error">
            <strong>[{historiesErr.code}]</strong> {historiesErr.message}
          </div>
        )}
        {!historiesLoading && !historiesErr && histories && histories.length === 0 && (
          <div className="my-points-empty">아직 포인트 이력이 없어요.</div>
        )}
        {!historiesLoading && !historiesErr && histories && histories.length > 0 && (
          <ul className="my-points-list">
            {histories.map((h) => {
              const plus = isPlus(h.type);
              return (
                <li key={h.pointHistoryId} className="my-points-row">
                  <span className={`my-points-type ${POINT_TYPE_CLASS[h.type]}`}>
                    {POINT_TYPE_LABEL[h.type]}
                  </span>
                  <time className="my-points-date">{formatDateTime(h.createdAt)}</time>
                  <span className={`my-points-amount ${plus ? "is-plus" : "is-minus"}`}>
                    {plus ? "+" : "−"} {formatNumber(h.amount)} P
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card my-info-box">
        <h3>JWT 인증 안내</h3>
        <ul>
          <li>액세스 토큰 만료: <strong>1시간</strong></li>
          <li>리프레시 토큰: <strong>없음</strong> — 만료 시 재로그인</li>
          <li>토큰 저장 위치: <code>localStorage["c1oud.accessToken"]</code></li>
        </ul>
      </section>
    </div>
  );
}

function InfoCell({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`my-cell card${highlight ? " is-highlight" : ""}`}>
      <div className="my-cell-label">{label}</div>
      <div className={`my-cell-value${mono ? " is-mono" : ""}`}>{value}</div>
    </div>
  );
}
