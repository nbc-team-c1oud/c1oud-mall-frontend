import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    lines,
    totalAmount,
    totalQuantity,
    setQuantity,
    remove,
    clear,
    selectedIds,
    selectedLines,
    selectedAmount,
    selectedQuantity,
    toggleSelect,
    selectAll,
    unselectAll,
    isSelected,
  } = useCart();

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

  const handleCheckout = () => {
    if (!hasSelection) return;
    navigate("/checkout", {
      state: {
        // 선택 정보는 표시용. 실제 송신은 CheckoutPage가 BE 우회로 빈 배열로 보냄.
        selectedProductIds: selectedLines.map((l) => l.productId),
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
        <button className="btn btn-ghost btn-sm" onClick={clear}>전체 비우기</button>
      </header>

      <div className="alert alert-warn cart-note">
        ⚠ 백엔드에 장바구니 조회 API가 추가되기 전(cart M4)까지는 결제 시
        <strong> 장바구니 전체가 함께 결제</strong>됩니다. 아래 선택 UI는 향후 자동 활성화됩니다.
      </div>

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
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={unselectAll}
          disabled={selectedIds.length === 0}
        >
          선택 해제
        </button>
      </div>

      <div className="cart-grid">
        <div className="cart-lines">
          {lines.map((l) => {
            const checked = isSelected(l.productId);
            return (
              <div
                key={l.productId}
                className={`cart-line card${checked ? " is-selected" : ""}`}
              >
                <label className="cart-line-check" aria-label={`${l.name} 선택`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(l.productId)}
                  />
                </label>
                <Link to={`/products/${l.productId}`} className="cart-line-thumb">
                  <ThumbMini name={l.name} />
                </Link>
                <div className="cart-line-info">
                  <div className="cart-line-cat">{l.category}</div>
                  <Link to={`/products/${l.productId}`} className="cart-line-name">
                    {l.name}
                  </Link>
                  <div className="cart-line-unit">{formatPrice(l.price)}</div>
                </div>
                <div className="cart-line-qty">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setQuantity(l.productId, l.quantity - 1)}
                    aria-label="감소"
                  >−</button>
                  <span aria-live="polite">{l.quantity}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setQuantity(l.productId, l.quantity + 1)}
                    aria-label="증가"
                  >＋</button>
                </div>
                <div className="cart-line-total">
                  {formatPrice(l.price * l.quantity)}
                </div>
                <button
                  className="btn btn-ghost btn-sm cart-line-del"
                  onClick={() => remove(l.productId)}
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
