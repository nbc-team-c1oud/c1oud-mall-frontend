import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Header.css";

export function Header() {
  const { user, status, logout } = useAuth();
  const { totalQuantity } = useCart();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    logout();
    if (loc.pathname.startsWith("/me")) navigate("/", { replace: true });
  };

  return (
    <header className="c-header">
      <div className="container c-header-inner">
        <Link to="/" className="c-brand" aria-label="c1oud mall 홈으로">
          <span className="c-brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 18a4 4 0 0 1 .6-7.96 6 6 0 0 1 11.74 1.24A3.5 3.5 0 0 1 18 18H6Z"
                fill="url(#g)"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="24" y2="24">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="c-brand-text">
            c1oud<span className="c-brand-dot">·</span>mall
          </span>
        </Link>

        <nav className="c-nav" aria-label="주요 메뉴">
          <NavLink to="/products" className="c-nav-link">상품</NavLink>
          <NavLink to="/cart" className="c-nav-link">
            장바구니
            {totalQuantity > 0 && (
              <span className="c-cart-badge" aria-label={`${totalQuantity}개 담김`}>
                {totalQuantity}
              </span>
            )}
          </NavLink>
          {status === "authed" && (
            <NavLink to="/orders" className="c-nav-link">주문내역</NavLink>
          )}
        </nav>

        <div className="c-header-actions">
          {status === "loading" ? (
            <span className="spinner" aria-label="로딩 중" />
          ) : status === "authed" && user ? (
            <>
              <NavLink to="/me" className="c-user-pill">
                <span className="c-user-avatar" aria-hidden="true">
                  {user.name.slice(0, 1)}
                </span>
                <span className="c-user-name">{user.name}</span>
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">로그인</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
