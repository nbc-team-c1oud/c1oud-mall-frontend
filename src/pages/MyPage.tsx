import { useAuth } from "../context/AuthContext";
import { formatDateTime, formatNumber } from "../lib/format";
import "./MyPage.css";

export default function MyPage() {
  const { user, refresh } = useAuth();
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

      <section className="my-grid">
        <InfoCell label="역할" value={user.role === "ADMIN" ? "관리자" : "일반회원"} />
        <InfoCell label="전화번호" value={user.phoneNumber || "-"} />
        <InfoCell label="포인트 잔액" value={`${formatNumber(user.pointBalance)} P`} highlight />
        <InfoCell label="사용자 ID" value={`#${user.id}`} mono />
        <InfoCell label="가입일" value={formatDateTime(user.createdAt)} />
        <InfoCell label="최근 업데이트" value={formatDateTime(user.updatedAt)} />
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
