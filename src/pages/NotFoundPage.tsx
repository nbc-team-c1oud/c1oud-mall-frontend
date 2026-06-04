import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      className="container"
      style={{
        textAlign: "center",
        padding: "120px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 64 }} aria-hidden="true">☁️</div>
      <h1>구름 너머로 길을 잃었어요</h1>
      <p style={{ color: "var(--c-text-muted)" }}>
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">홈으로 돌아가기</Link>
    </div>
  );
}
