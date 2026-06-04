import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listProducts } from "../api/products";
import type { ProductListItem, ProductStatus, SpringPage } from "../api/types";
import { ProductCard } from "../components/ProductCard";
import "./ProductsPage.css";

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "최신순" },
  { value: "price,asc", label: "가격 낮은순" },
  { value: "price,desc", label: "가격 높은순" },
  { value: "name,asc", label: "이름순" },
];

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") ?? "0");
  const sort = params.get("sort") ?? "createdAt,desc";
  const category = params.get("category") ?? "";
  const status = (params.get("status") as ProductStatus | null) ?? null;
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  const [data, setData] = useState<SpringPage<ProductListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProducts({
      page,
      size: PAGE_SIZE,
      sort,
      category: category || undefined,
      status: status ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    })
      .then((p) => {
        if (!cancelled) setData(p);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sort, category, status, minPrice, maxPrice]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.set("page", "0");
    setParams(next, { replace: true });
  };

  return (
    <div className="container">
      <header className="pp-head">
        <div>
          <h1>전체 상품</h1>
          <p className="pp-sub">
            {data ? `총 ${data.totalElements.toLocaleString()}개` : " "}
          </p>
        </div>
        <select
          className="select pp-sort"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          aria-label="정렬"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </header>

      <div className="pp-filters card">
        <div className="field" style={{ flex: 1 }}>
          <label className="field-label" htmlFor="cat">카테고리</label>
          <input
            id="cat"
            className="input"
            placeholder="예: Electronics"
            defaultValue={category}
            onBlur={(e) => update({ category: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ category: (e.target as HTMLInputElement).value });
            }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="minP">최소가</label>
          <input
            id="minP"
            className="input"
            type="number"
            min={0}
            defaultValue={minPrice}
            onBlur={(e) => update({ minPrice: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="maxP">최대가</label>
          <input
            id="maxP"
            className="input"
            type="number"
            min={0}
            defaultValue={maxPrice}
            onBlur={(e) => update({ maxPrice: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="st">상태</label>
          <select
            id="st"
            className="select"
            value={status ?? ""}
            onChange={(e) => update({ status: e.target.value || null })}
          >
            <option value="">전체</option>
            <option value="SALE">판매중</option>
            <option value="SOLD_OUT">품절</option>
          </select>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm pp-filter-reset"
          onClick={() => setParams({}, { replace: true })}
        >
          초기화
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 16 }}>
          상품을 불러오지 못했습니다 — {error}
        </div>
      )}

      <div className="pp-grid">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card" style={{ overflow: "hidden" }}>
              <div className="skeleton" style={{ aspectRatio: "4/3", borderRadius: 0 }} />
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ height: 12, width: "30%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: "80%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: "40%" }} />
              </div>
            </div>
          ))}

        {!loading && data &&
          data.content.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!loading && data && data.content.length === 0 && (
        <div className="card" style={{ padding: "64px 16px", textAlign: "center", color: "var(--c-text-muted)", marginTop: 16 }}>
          조건에 맞는 상품이 없습니다.
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pager
          page={data.pageable.pageNumber}
          totalPages={data.totalPages}
          onChange={(p) => update({ page: String(p) })}
        />
      )}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: number[] = [];
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const end = Math.min(totalPages, start + 5);
  for (let i = start; i < end; i++) pages.push(i);

  return (
    <nav className="pp-pager" aria-label="페이지 네비게이션">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p + 1}
        </button>
      ))}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        다음
      </button>
    </nav>
  );
}
