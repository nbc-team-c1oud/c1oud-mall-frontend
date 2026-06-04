import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import "./CartPage.css";

export default function CartPage() {
  const { lines, totalAmount, totalQuantity, setQuantity, remove, clear } = useCart();

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

  return (
    <div className="container cart-wrap">
      <header className="cart-head">
        <h1>장바구니</h1>
        <button className="btn btn-ghost btn-sm" onClick={clear}>전체 비우기</button>
      </header>

      <div className="alert alert-warn cart-note">
        ※ 백엔드 장바구니 조회 API가 아직 없어 localStorage에 사본을 보관하고 있습니다.
        담기 요청은 서버에도 함께 전송됩니다 (memberId=1L 하드코딩).
      </div>

      <div className="cart-grid">
        <div className="cart-lines">
          {lines.map((l) => (
            <div key={l.productId} className="cart-line card">
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
          ))}
        </div>

        <aside className="cart-summary card">
          <h3>주문 요약</h3>
          <dl>
            <div><dt>상품 수</dt><dd>{totalQuantity}개</dd></div>
            <div><dt>상품 금액</dt><dd>{formatPrice(totalAmount)}</dd></div>
            <div><dt>배송비</dt><dd>무료</dd></div>
          </dl>
          <div className="cart-total">
            <span>총 결제 예정</span>
            <strong>{formatPrice(totalAmount)}</strong>
          </div>
          <Link to="/checkout" className="btn btn-primary btn-lg btn-block">
            결제하기
          </Link>
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
