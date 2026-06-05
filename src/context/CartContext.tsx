import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  deleteSelectedCart,
  listCart,
  updateCartItemQuantity,
} from "../api/carts";
import { ApiError } from "../api/client";
import type { CartListItemResponse } from "../api/types";
import { useAuth } from "./AuthContext";

export type CartLine = CartListItemResponse;

interface CartState {
  lines: CartLine[];
  totalQuantity: number;
  totalAmount: number;
  loading: boolean;
  error: string | null;

  selectedIds: number[];
  selectedLines: CartLine[];
  selectedAmount: number;
  selectedQuantity: number;

  refresh: () => Promise<void>;
  add: (productId: number, qty: number) => Promise<void>;
  setQuantity: (cartItemId: number, qty: number) => Promise<void>;
  remove: (cartItemId: number) => Promise<void>;
  removeSelected: (cartItemIds: number[]) => Promise<void>;
  clear: () => Promise<void>;

  toggleSelect: (cartItemId: number) => void;
  selectAll: () => void;
  unselectAll: () => void;
  isSelected: (cartItemId: number) => boolean;
}

const CartCtx = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (status !== "authed") {
      setLines([]);
      setSelectedIds([]);
      setLoading(false);
      setError(null);
      return;
    }
    const myReq = ++reqIdRef.current;
    setLoading(true);
    try {
      const data = await listCart();
      if (myReq !== reqIdRef.current) return;
      setLines(data.items);
      setError(null);
    } catch (e) {
      if (myReq !== reqIdRef.current) return;
      // 401은 AuthContext가 처리 — 여기선 단순 빈 카트로
      if (e instanceof ApiError && e.status === 401) {
        setLines([]);
      } else {
        setError(e instanceof Error ? e.message : "장바구니를 불러오지 못했습니다.");
      }
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }, [status]);

  // 인증 상태 변경 시 자동 동기화
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // lines 변경 시 selected 정리 (없어진 cartItemId 제거)
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(lines.map((l) => l.cartItemId));
      const next = prev.filter((id) => valid.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [lines]);

  const add = useCallback<CartState["add"]>(
    async (productId, qty) => {
      await addCartItem({ productId, quantity: qty });
      await refresh();
    },
    [refresh],
  );

  const setQuantity = useCallback<CartState["setQuantity"]>(
    async (cartItemId, qty) => {
      if (qty <= 0) {
        await deleteCartItem(cartItemId);
        setLines((prev) => prev.filter((l) => l.cartItemId !== cartItemId));
        return;
      }
      // optimistic 업데이트 — 서버 응답이 200이면 그대로, 실패 시 refresh로 복구
      setLines((prev) =>
        prev.map((l) =>
          l.cartItemId === cartItemId
            ? { ...l, quantity: qty, subTotal: l.price * qty }
            : l,
        ),
      );
      try {
        await updateCartItemQuantity(cartItemId, { quantity: qty });
      } catch (e) {
        await refresh();
        throw e;
      }
    },
    [refresh],
  );

  const remove = useCallback<CartState["remove"]>(async (cartItemId) => {
    await deleteCartItem(cartItemId);
    setLines((prev) => prev.filter((l) => l.cartItemId !== cartItemId));
  }, []);

  const removeSelected = useCallback<CartState["removeSelected"]>(
    async (cartItemIds) => {
      if (cartItemIds.length === 0) return;
      await deleteSelectedCart(cartItemIds);
      const removeSet = new Set(cartItemIds);
      setLines((prev) => prev.filter((l) => !removeSet.has(l.cartItemId)));
    },
    [],
  );

  const clear = useCallback<CartState["clear"]>(async () => {
    await clearCart();
    setLines([]);
    setSelectedIds([]);
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
  const totalAmount = lines.reduce((sum, l) => sum + l.subTotal, 0);

  const selectedLines = useMemo(() => {
    const sel = new Set(selectedIds);
    return lines.filter((l) => sel.has(l.cartItemId));
  }, [lines, selectedIds]);
  const selectedAmount = selectedLines.reduce((sum, l) => sum + l.subTotal, 0);
  const selectedQuantity = selectedLines.reduce((sum, l) => sum + l.quantity, 0);

  const value = useMemo<CartState>(
    () => ({
      lines,
      totalQuantity,
      totalAmount,
      loading,
      error,
      selectedIds,
      selectedLines,
      selectedAmount,
      selectedQuantity,
      refresh,
      add,
      setQuantity,
      remove,
      removeSelected,
      clear,
      toggleSelect,
      selectAll,
      unselectAll,
      isSelected,
    }),
    [
      lines,
      totalQuantity,
      totalAmount,
      loading,
      error,
      selectedIds,
      selectedLines,
      selectedAmount,
      selectedQuantity,
      refresh,
      add,
      setQuantity,
      remove,
      removeSelected,
      clear,
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
