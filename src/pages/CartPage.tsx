import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { describeError } from "../lib/errorMessage";
import { formatPrice } from "../lib/format";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const {
    lines,
    totalAmount,
    totalQuantity,
    loading,
    error,
    setQuantity,
    remove,
    removeSelected,
    clear,
    selectedIds,
    selectedLines,
    selectedAmount,
    selectedQuantity,
    toggleSelect,
    selectAll,
    unselectAll,
    isSelected,
    refresh,
  } = useCart();

  const [actionError, setActionError] = useState<string | null>(null);

  if (status === "guest") {
    return (
      <div className="container cart-empty">
        <div className="cart-empty-icon" aria-hidden="true">🔒</div>
        <h2>로그인이 필요합니다</h2>
        <p>장바구니는 로그인 후 이용할 수 있어요.</p>
        <Link to="/login" className="btn btn-primary btn-lg">로그인하러 가기</Link>
      </div>
    );
  }

  if (loading && lines.length === 0) {
    return (
      <div className="container cart-wrap">
        <header className="cart-head">
          <h1>장바구니</h1>
        </header>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 112, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container cart-wrap">
        <header className="cart-head">
          <h1>장바구니</h1>
        </header>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => void refresh()}>
          다시 시도
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container cart-empty">
        <div className="cart-empty-icon" aria-hidden="true">🛒</div>
        <h2>장바구니가 비어있어요</h2>
        <p>마음에 드는 상품을 담아보세요.</p>
        <Link to="/products" className="btn btn-primary btn-lg">상품 보러가기</Link>
      </div>
    );
  }

  const allSelected = selectedIds.length === lines.length;
  const someSelected = selectedIds.length > 0 && !allSelected;
  const hasSelection = selectedLines.length > 0;

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      const d = describeError(e);
      setActionError(`[${d.code}] ${d.message}`);
    }
  };

  const handleCheckout = () => {
    if (!hasSelection) return;
    navigate("/checkout", {
      state: {
        cartItemIds: selectedLines.map((l) => l.cartItemId),
      },
    });
  };

  const toggleAll = () => {
    if (allSelected) unselectAll();
    else selectAll();
  };

  return (
    <div className="container cart-wrap">
      <header className="cart-head">
        <h1>장바구니</h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => void runAction(clear)}
          disabled={lines.length === 0}
        >
          전체 비우기
        </button>
      </header>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="cart-toolbar card">
        <label className="cart-toolbar-all">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            aria-label="전체 선택"
          />
          <span>전체 선택 ({selectedIds.length}/{lines.length})</span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={unselectAll}
            disabled={selectedIds.length === 0}
          >
            선택 해제
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() =>
              void runAction(() => removeSelected(selectedIds))
            }
            disabled={selectedIds.length === 0}
          >
            선택 삭제 ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="cart-grid">
        <div className="cart-lines">
          {lines.map((l) => {
            const checked = isSelected(l.cartItemId);
            return (
              <div
                key={l.cartItemId}
                className={`cart-line card${checked ? " is-selected" : ""}`}
              >
                <label className="cart-line-check" aria-label={`${l.productName} 선택`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(l.cartItemId)}
                  />
                </label>
                <Link to={`/products/${l.productId}`} className="cart-line-thumb">
                  <ThumbMini name={l.productName} />
                </Link>
                <div className="cart-line-info">
                  <Link to={`/products/${l.productId}`} className="cart-line-name">
                    {l.productName}
                  </Link>
                  <div className="cart-line-unit">{formatPrice(l.price)}</div>
                </div>
                <div className="cart-line-qty">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      void runAction(() => setQuantity(l.cartItemId, l.quantity - 1))
                    }
                    aria-label="감소"
                  >−</button>
                  <span aria-live="polite">{l.quantity}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      void runAction(() => setQuantity(l.cartItemId, l.quantity + 1))
                    }
                    aria-label="증가"
                  >＋</button>
                </div>
                <div className="cart-line-total">
                  {formatPrice(l.subTotal)}
                </div>
                <button
                  className="btn btn-ghost btn-sm cart-line-del"
                  onClick={() => void runAction(() => remove(l.cartItemId))}
                  aria-label="삭제"
                  title="삭제"
                >×</button>
              </div>
            );
          })}
        </div>

        <aside className="cart-summary card">
          <h3>주문 요약</h3>
          <dl>
            <div>
              <dt>선택 상품</dt>
              <dd>{selectedQuantity}개 / 전체 {totalQuantity}개</dd>
            </div>
            <div>
              <dt>선택 합계</dt>
              <dd>{formatPrice(selectedAmount)}</dd>
            </div>
            <div>
              <dt>장바구니 총액</dt>
              <dd>{formatPrice(totalAmount)}</dd>
            </div>
            <div><dt>배송비</dt><dd>무료</dd></div>
          </dl>
          <div className="cart-total">
            <span>총 결제 예정</span>
            <strong>{formatPrice(selectedAmount)}</strong>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={handleCheckout}
            disabled={!hasSelection}
          >
            {hasSelection
              ? `선택 ${selectedLines.length}건 결제하기`
              : "결제할 상품을 선택하세요"}
          </button>
          <Link to="/products" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 8 }}>
            계속 쇼핑하기
          </Link>
        </aside>
      </div>
    </div>
  );
}

function ThumbMini({ name }: { name: string }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  return (
    <div
      className="cart-thumb-mini"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 80% 88%) 0%, hsl(${(hue + 50) % 360} 80% 78%) 100%)`,
      }}
    >
      <span>{name.slice(0, 1)}</span>
    </div>
  );
}
