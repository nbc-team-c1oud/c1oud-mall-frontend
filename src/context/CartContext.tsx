import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { addCartItem } from "../api/carts";
import { ApiError } from "../api/client";

export interface CartLine {
  productId: number;
  name: string;
  price: number;
  category: string;
  quantity: number;
  addedAt: string;
}

interface CartState {
  lines: CartLine[];
  totalQuantity: number;
  totalAmount: number;
  add: (line: Omit<CartLine, "quantity" | "addedAt">, qty: number) => Promise<void>;
  setQuantity: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "c1oud.cart";

const CartCtx = createContext<CartState | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => load());

  useEffect(() => {
    save(lines);
  }, [lines]);

  const add = useCallback<CartState["add"]>(async (snap, qty) => {
    // 1) 백엔드 호출 (memberId=1L 하드코딩이라 실패해도 UX 유지)
    try {
      await addCartItem({ productId: snap.productId, quantity: qty });
    } catch (e) {
      // 401(미로그인)은 인증 없이 담기 시도 — 그래도 localStorage엔 반영
      if (!(e instanceof ApiError) || e.status !== 401) {
        throw e;
      }
    }
    // 2) localStorage 사본 갱신 (조회 API 부재 대응)
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === snap.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === snap.productId
            ? { ...l, quantity: l.quantity + qty }
            : l,
        );
      }
      return [
        ...prev,
        { ...snap, quantity: qty, addedAt: new Date().toISOString() },
      ];
    });
  }, []);

  const setQuantity = useCallback<CartState["setQuantity"]>((productId, qty) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: qty } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const remove = useCallback<CartState["remove"]>((productId) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback<CartState["clear"]>(() => {
    setLines([]);
  }, []);

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalAmount = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const value = useMemo<CartState>(
    () => ({ lines, totalQuantity, totalAmount, add, setQuantity, remove, clear }),
    [lines, totalQuantity, totalAmount, add, setQuantity, remove, clear],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
