import { Link } from "react-router-dom";
import type { ProductListItem } from "../api/types";
import { formatPrice } from "../lib/format";
import "./ProductCard.css";

interface Props {
  product: ProductListItem;
}

export function ProductCard({ product }: Props) {
  const soldOut = product.status === "SOLD_OUT" || product.stockQuantity <= 0;
  return (
    <Link to={`/products/${product.id}`} className={`p-card${soldOut ? " is-soldout" : ""}`}>
      <div className="p-card-thumb">
        <ProductThumb name={product.name} />
        {soldOut && <span className="badge badge-soldout p-card-status">품절</span>}
        {!soldOut && product.stockQuantity < 5 && (
          <span className="badge badge-warn p-card-status">
            재고 {product.stockQuantity}개
          </span>
        )}
      </div>
      <div className="p-card-body">
        <div className="p-card-cat">{product.category}</div>
        <h3 className="p-card-name">{product.name}</h3>
        <div className="p-card-price">{formatPrice(product.price)}</div>
      </div>
    </Link>
  );
}

function ProductThumb({ name }: { name: string }) {
  // 백엔드에 이미지 URL 필드가 아직 없음 — 이름 기반 그라데이션 thumb
  const hue = hashHue(name);
  const initial = name.slice(0, 1) || "?";
  const bg = `linear-gradient(135deg,
    hsl(${hue} 80% 88%) 0%,
    hsl(${(hue + 50) % 360} 80% 78%) 100%)`;
  return (
    <div className="p-card-thumb-fallback" style={{ background: bg }}>
      <span aria-hidden="true">{initial}</span>
    </div>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}
