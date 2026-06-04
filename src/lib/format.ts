const won = new Intl.NumberFormat("ko-KR");

export function formatPrice(value: number): string {
  return `${won.format(value)}원`;
}

export function formatNumber(value: number): string {
  return won.format(value);
}

export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
