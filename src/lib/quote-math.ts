export type Operation = "comprar" | "vender";

// A interface usa o ponto de vista do cliente, inverso ao da QINEX.
export function getQinexRate(operation: Operation, spot: number | null) {
  if (spot === null || !Number.isFinite(spot) || spot <= 0) return null;
  const adjustment = operation === "comprar" ? 0.02 : -0.01;
  const price = Number((spot + adjustment).toFixed(4));
  return price > 0 ? price : null;
}

export function calculateReceive(operation: Operation, amount: string, rate: number | null) {
  const input = Number(amount);
  if (rate === null || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(input) || input <= 0) return null;
  const result = operation === "comprar" ? input / rate : input * rate;
  const precision = operation === "comprar" ? 1_000_000 : 100;
  return Math.floor(result * precision + 1e-7) / precision;
}

export const formatBrl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const formatRate = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 4 });
export const formatUsdt = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
