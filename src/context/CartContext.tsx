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
  cartItemId: number;
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
  selectedIds: number[];
  selectedLines: CartLine[];
  selectedAmount: number;
  selectedQuantity: number;
  add: (line: Omit<CartLine, "quantity" | "addedAt" | "cartItemId">, qty: number) => Promise<void>;
  setQuantity: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  clearByIds: (cartItemIds: number[]) => void;
  toggleSelect: (cartItemId: number) => void;
  selectAll: () => void;
  unselectAll: () => void;
  isSelected: (cartItemId: number) => boolean;
}

const STORAGE_KEY = "c1oud.cart";

const CartCtx = createContext<CartState | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CartLine>[];
    if (!Array.isArray(parsed)) return [];
    // 과거 스키마(cartItemId 없음) 호환: productId를 임시 cartItemId로 채움
    return parsed
      .filter((l): l is CartLine =>
        typeof l?.productId === "number" && typeof l?.name === "string",
      )
      .map((l) => ({
        ...l,
        cartItemId: typeof l.cartItemId === "number" ? l.cartItemId : l.productId,
      }));
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
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    load().map((l) => l.cartItemId),
  );

  useEffect(() => {
    save(lines);
  }, [lines]);

  // lines가 줄어들면 selectedIds도 동기화
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(lines.map((l) => l.cartItemId));
      const next = prev.filter((id) => valid.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [lines]);

  const add = useCallback<CartState["add"]>(async (snap, qty) => {
    let serverCartItemId: number | null = null;
    try {
      const res = await addCartItem({ productId: snap.productId, quantity: qty });
      if (res && typeof res.cartItemId === "number") {
        serverCartItemId = res.cartItemId;
      }
    } catch (e) {
      // 401(미로그인)은 인증 없이 담기 시도 — 그래도 localStorage엔 반영
      if (!(e instanceof ApiError) || e.status !== 401) {
        throw e;
      }
    }

    setLines((prev) => {
      const existing = prev.find((l) => l.productId === snap.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === snap.productId
            ? {
                ...l,
                quantity: l.quantity + qty,
                cartItemId: serverCartItemId ?? l.cartItemId,
              }
            : l,
        );
      }
      const newLine: CartLine = {
        ...snap,
        cartItemId: serverCartItemId ?? snap.productId,
        quantity: qty,
        addedAt: new Date().toISOString(),
      };
      return [...prev, newLine];
    });

    setSelectedIds((prev) => {
      const fallbackId = serverCartItemId ?? snap.productId;
      if (prev.includes(fallbackId)) return prev;
      return [...prev, fallbackId];
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
    setSelectedIds([]);
  }, []);

  const clearByIds = useCallback<CartState["clearByIds"]>((cartItemIds) => {
    const remove = new Set(cartItemIds);
    setLines((prev) => prev.filter((l) => !remove.has(l.cartItemId)));
  }, []);

  const toggleSelect = useCallback<CartState["toggleSelect"]>((cartItemId) => {
    setSelectedIds((prev) =>
      prev.includes(cartItemId)
        ? prev.filter((id) => id !== cartItemId)
        : [...prev, cartItemId],
    );
  }, []);

  const selectAll = useCallback<CartState["selectAll"]>(() => {
    setSelectedIds(lines.map((l) => l.cartItemId));
  }, [lines]);

  const unselectAll = useCallback<CartState["unselectAll"]>(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback<CartState["isSelected"]>(
    (cartItemId) => selectedIds.includes(cartItemId),
    [selectedIds],
  );

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalAmount = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const selectedLines = useMemo(() => {
    const sel = new Set(selectedIds);
    return lines.filter((l) => sel.has(l.cartItemId));
  }, [lines, selectedIds]);
  const selectedAmount = selectedLines.reduce(
    (sum, l) => sum + l.price * l.quantity,
    0,
  );
  const selectedQuantity = selectedLines.reduce((sum, l) => sum + l.quantity, 0);

  const value = useMemo<CartState>(
    () => ({
      lines,
      totalQuantity,
      totalAmount,
      selectedIds,
      selectedLines,
      selectedAmount,
      selectedQuantity,
      add,
      setQuantity,
      remove,
      clear,
      clearByIds,
      toggleSelect,
      selectAll,
      unselectAll,
      isSelected,
    }),
    [
      lines,
      totalQuantity,
      totalAmount,
      selectedIds,
      selectedLines,
      selectedAmount,
      selectedQuantity,
      add,
      setQuantity,
      remove,
      clear,
      clearByIds,
      toggleSelect,
      selectAll,
      unselectAll,
      isSelected,
    ],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
