import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchProduct } from "../api/products";
import type { ProductDetail } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ApiError } from "../api/client";
import { formatPrice } from "../lib/format";
import "./ProductDetailPage.css";

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { status } = useAuth();
  const { add } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(productId)) {
      setError("잘못된 상품 ID입니다.");
      return;
    }
    let cancelled = false;
    fetchProduct(productId)
      .then((p) => !cancelled && setProduct(p))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <Link to="/products" className="btn btn-secondary" style={{ marginTop: 16 }}>
          상품 목록으로
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container pd-skel">
        <div className="skeleton pd-skel-img" />
        <div className="pd-skel-body">
          <div className="skeleton" style={{ height: 14, width: "20%", marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 32, width: "70%", marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 24, width: "30%", marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 80, width: "100%" }} />
        </div>
      </div>
    );
  }

  const soldOut = product.status === "SOLD_OUT" || product.stockQuantity <= 0;

  const handleAdd = async () => {
    if (status !== "authed") {
      navigate("/login", { state: { from: `/products/${product.id}` } });
      return;
    }
    setAdding(true);
    setFlash(null);
    try {
      await add(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
        },
        qty,
      );
      setFlash(`장바구니에 ${qty}개 담았습니다.`);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "장바구니에 담지 못했습니다.";
      setFlash(`⚠ ${msg}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container pd">
      <div className="pd-img" aria-hidden="true">
        <ThumbBig name={product.name} />
      </div>
      <div className="pd-body">
        <div className="pd-cat">{product.category}</div>
        <h1 className="pd-name">{product.name}</h1>
        <div className="pd-status-row">
          {soldOut ? (
            <span className="badge badge-soldout">품절</span>
          ) : (
            <span className="badge badge-brand">
              재고 {product.stockQuantity}개
            </span>
          )}
        </div>

        <div className="pd-price">{formatPrice(product.price)}</div>

        <p className="pd-desc">{product.description}</p>

        {!soldOut && (
          <div className="pd-qty">
            <label className="field-label" htmlFor="qty">수량</label>
            <div className="pd-qty-row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="감소"
              >−</button>
              <input
                id="qty"
                className="input pd-qty-input"
                type="number"
                min={1}
                max={product.stockQuantity}
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.min(
                      product.stockQuantity,
                      Math.max(1, Number(e.target.value) || 1),
                    ),
                  )
                }
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  setQty((q) => Math.min(product.stockQuantity, q + 1))
                }
                aria-label="증가"
              >＋</button>
            </div>
          </div>
        )}

        {flash && (
          <div
            className={`alert ${flash.startsWith("⚠") ? "alert-error" : "alert-info"}`}
            style={{ marginTop: 12 }}
          >
            {flash}
          </div>
        )}

        <div className="pd-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={handleAdd}
            disabled={soldOut || adding}
          >
            {adding ? <span className="spinner" /> : null}
            {soldOut ? "품절된 상품" : "장바구니 담기"}
          </button>
          <Link to="/cart" className="btn btn-secondary btn-lg btn-block">
            장바구니로 가기
          </Link>
        </div>

        <p className="pd-hint">
          ※ 결제 흐름은 백엔드 주문 API 추가 후 활성화됩니다.{" "}
          <Link to="/checkout">checkout 미리보기</Link>
        </p>
      </div>
    </div>
  );
}

function ThumbBig({ name }: { name: string }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  return (
    <div
      className="pd-img-fallback"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 80% 88%) 0%, hsl(${(hue + 50) % 360} 80% 78%) 100%)`,
      }}
    >
      <span>{name.slice(0, 1)}</span>
    </div>
  );
}
