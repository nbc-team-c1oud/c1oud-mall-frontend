import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../api/products";
import type { ProductListItem } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import "./HomePage.css";

export default function HomePage() {
  const [featured, setFeatured] = useState<ProductListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProducts({ size: 8, sort: "createdAt,desc" })
      .then((page) => {
        if (!cancelled) setFeatured(page.content);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="badge badge-brand hero-badge">⚡ Spring Boot · PortOne V2</span>
            <h1 className="hero-title">
              구름 위에서 <br />쇼핑하는 것처럼
            </h1>
            <p className="hero-sub">
              가볍고 빠른 결제 경험. JWT 인증부터 PortOne 결제 확정까지,
              c1oud-mall이 안전하게 처리합니다.
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn btn-primary btn-lg">상품 둘러보기</Link>
              <Link to="/signup" className="btn btn-secondary btn-lg">3초 회원가입</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="container home-section">
        <div className="home-section-head">
          <div>
            <h2>새로 들어온 상품</h2>
            <p className="home-section-sub">방금 들어온 신선한 상품들을 만나보세요.</p>
          </div>
          <Link to="/products" className="btn btn-ghost btn-sm">전체 보기 →</Link>
        </div>

        {error && (
          <div className="alert alert-error">
            상품을 불러오지 못했습니다 — {error}
          </div>
        )}

        {!featured && !error && (
          <div className="home-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card" style={{ overflow: "hidden" }}>
                <div className="skeleton" style={{ aspectRatio: "4/3", borderRadius: 0 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 12, width: "30%", marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: "80%", marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 20, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {featured && featured.length === 0 && (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--c-text-muted)" }}>
            아직 등록된 상품이 없습니다.
          </div>
        )}

        {featured && featured.length > 0 && (
          <div className="home-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="container home-section">
        <div className="home-feats">
          <Feat title="JWT 인증" desc="1시간 토큰, 안전한 stateless 세션" icon="🔐" />
          <Feat title="PortOne V2" desc="검증 7단계 + 자동 보상 트랜잭션" icon="💳" />
          <Feat title="포인트 적립" desc="결제 시 사용 가능한 포인트 시스템" icon="✨" />
        </div>
      </section>
    </>
  );
}

function Feat({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="feat card">
      <div className="feat-icon" aria-hidden="true">{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 360 320" width="100%" height="100%" role="presentation">
      <defs>
        <linearGradient id="ha1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="ha2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="180" cy="160" r="120" fill="url(#ha1)" />
      <circle cx="180" cy="160" r="72" fill="white" />
      <g transform="translate(120 100)">
        <rect width="120" height="120" rx="18" fill="url(#ha2)" />
        <path
          d="M30 50 L55 75 L92 38"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <circle cx="80" cy="60" r="6" fill="#8b5cf6" opacity="0.5" />
      <circle cx="300" cy="90" r="10" fill="#3b82f6" opacity="0.45" />
      <circle cx="290" cy="260" r="7" fill="#a78bfa" opacity="0.5" />
    </svg>
  );
}
