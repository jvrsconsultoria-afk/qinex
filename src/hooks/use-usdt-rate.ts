"use client";

import { useCallback, useEffect, useState } from "react";
import { getQinexRate, type Operation } from "@/lib/quote-math";

export type ExchangeRate = {
  value: number | null;
  spotValue: number | null;
  unitAdjustment: number;
  loading: boolean;
  failed: boolean;
  updatedAt: Date | null;
  isMarketReference: boolean;
  refresh: () => void;
};

const configuredRate = Number(process.env.NEXT_PUBLIC_USDT_BRL_RATE);
const hasConfiguredRate = Number.isFinite(configuredRate) && configuredRate > 0;
const refreshInterval = 60_000;

export function useUsdtRate(operation: Operation): ExchangeRate {
  const [value, setValue] = useState<number | null>(hasConfiguredRate ? configuredRate : null);
  const [loading, setLoading] = useState(!hasConfiguredRate);
  const [failed, setFailed] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(key => key + 1), []);

  useEffect(() => {
    if (hasConfiguredRate) return;
    let disposed = false;
    let controller: AbortController | null = null;

    async function loadRate() {
      controller?.abort();
      controller = new AbortController();
      const activeController = controller;
      const timeout = window.setTimeout(() => activeController.abort(), 12_000);
      setLoading(true);
      setFailed(false);
      try {
        const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDT", {
          signal: activeController.signal,
          cache: "no-store",
          credentials: "omit",
        });
        if (!response.ok) throw new Error("Cotação indisponível");
        const payload = await response.json();
        const nextRate = Number(payload?.data?.rates?.BRL);
        if (payload?.data?.currency !== "USDT" || !Number.isFinite(nextRate) || nextRate <= 0) {
          throw new Error("Cotação inválida");
        }
        if (!disposed) {
          setValue(nextRate);
          setUpdatedAt(new Date());
        }
      } catch {
        if (!disposed) {
          setValue(null);
          setUpdatedAt(null);
          setFailed(true);
        }
      } finally {
        window.clearTimeout(timeout);
        if (!disposed) setLoading(false);
      }
    }

    void loadRate();
    const interval = window.setInterval(() => void loadRate(), refreshInterval);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  // Compra e venda no formulário são do ponto de vista do cliente.
  // A QINEX vende ao cliente por spot + R$ 0,02 e compra dele por spot - R$ 0,01.
  const unitAdjustment = operation === "comprar" ? 0.02 : -0.01;
  const validRate = getQinexRate(operation, value);

  return { value: validRate, spotValue: value, unitAdjustment, loading, failed: failed || (value !== null && validRate === null), updatedAt, isMarketReference: !hasConfiguredRate, refresh };
}
