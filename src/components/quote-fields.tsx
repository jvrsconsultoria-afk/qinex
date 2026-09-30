"use client";

import { ChevronDown, RefreshCw } from "lucide-react";
import { UsdtLogo } from "@/components/usdt-logo";
import SmoothDisclosure from "@/components/smooth-disclosure";
import type { ExchangeRate } from "@/hooks/use-usdt-rate";
import { calculateReceive, formatBrl, formatRate, formatUsdt, type Operation } from "@/lib/quote-math";

function BrazilFlag() {
  return <svg className="brl-flag" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="12" fill="#009B3A" />
    <path d="M12 3.8 22 12 12 20.2 2 12Z" fill="#FFDF00" />
    <circle cx="12" cy="12" r="4.7" fill="#002776" />
    <path d="M7.35 11.35a12.6 12.6 0 0 1 8.93 2.6l.35-.87a13.5 13.5 0 0 0-9.16-2.66Z" fill="#FFF" />
    <g fill="#FFF">
      <circle cx="10" cy="12.5" r=".3" />
      <circle cx="12.3" cy="13.7" r=".3" />
      <circle cx="13.5" cy="12.9" r=".22" />
      <circle cx="11.2" cy="15" r=".22" />
      <circle cx="14.1" cy="10" r=".25" />
    </g>
  </svg>;
}

function Currency({ type }: { type: "BRL" | "USDT" }) {
  return <span className="quote-currency">{type === "BRL" ? <BrazilFlag /> : <UsdtLogo alt="" />}{type}</span>;
}

type QuoteFieldsProps = {
  operation: Operation;
  amount: string;
  onAmountChange: (value: string) => void;
  onOperationChange: (operation: Operation) => void;
  exchangeRate: ExchangeRate;
  idPrefix: string;
};

export function QuoteFields({ operation, amount, onAmountChange, onOperationChange, exchangeRate, idPrefix }: QuoteFieldsProps) {
  const buying = operation === "comprar";
  const inputCurrency = buying ? "BRL" : "USDT";
  const outputCurrency = buying ? "USDT" : "BRL";
  const receive = calculateReceive(operation, amount, exchangeRate.value);
  const hasAmount = Number(amount) > 0;
  const receivePlaceholder = !hasAmount ? "Informe um valor" : exchangeRate.loading ? "Buscando cotação..." : "Cotação indisponível";
  const receiveText = receive === null ? receivePlaceholder : buying ? formatUsdt(receive) : formatBrl(receive);
  const totalText = buying ? hasAmount ? formatBrl(Number(amount)) : "A informar" : receive === null ? "A informar" : receiveText;

  return <div className="quote-fields">
    <div className="operation-tabs" role="group" aria-label="Tipo de operação">
      <button type="button" aria-pressed={buying} className={buying ? "active" : ""} onClick={() => onOperationChange("comprar")}>Comprar</button>
      <button type="button" aria-pressed={!buying} className={!buying ? "active" : ""} onClick={() => onOperationChange("vender")}>Vender</button>
    </div>
    <div className="quote-input-group">
      <label htmlFor={`${idPrefix}-amount`}>{buying ? "Valor da compra" : "Quantidade para vender"}</label>
      <div className="quote-amount-field">
        <input
          id={`${idPrefix}-amount`}
          name="amount"
          type="number"
          inputMode="decimal"
          placeholder={buying ? "Digite o valor" : "Digite a quantidade"}
          min={buying ? "0.01" : "0.000001"}
          max="1000000000"
          step={buying ? "0.01" : "0.000001"}
          required
          value={amount}
          onChange={event => onAmountChange(event.target.value)}
        />
        <Currency type={inputCurrency} />
      </div>
    </div>
    <div className="quote-input-group quote-receive-group">
      <label htmlFor={`${idPrefix}-receive`}>Você recebe {exchangeRate.isMarketReference && hasAmount && receive !== null ? <span className="estimate-caption">(estimativa)</span> : null}</label>
      <div className="quote-amount-field quote-receive-field">
        <output className={receive === null ? "quote-result-placeholder" : undefined} id={`${idPrefix}-receive`} htmlFor={`${idPrefix}-amount`} aria-live="polite" aria-label={`Recebimento em ${outputCurrency}`}>{receiveText}</output>
        <Currency type={outputCurrency} />
      </div>
    </div>
    <div className="quote-rate-info" aria-live="polite">
      {exchangeRate.loading && !exchangeRate.value ? <span>Buscando cotação...</span> : exchangeRate.failed ? <div className="quote-rate-error"><span>Cotação indisponível. Consulte o atendimento.</span><button type="button" onClick={exchangeRate.refresh} aria-label="Buscar cotação novamente"><RefreshCw size={14} /></button></div> : exchangeRate.value ? <>
        <span className="quote-unit-rate">1 USDT ≈ {formatRate(exchangeRate.value)}</span>
        {exchangeRate.isMarketReference && <span className="quote-rate-source">Spot Coinbase{exchangeRate.spotValue ? ` ${formatRate(exchangeRate.spotValue)}` : ""}{exchangeRate.updatedAt ? ` · ${exchangeRate.updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Manaus" })}` : ""}</span>}
      </> : null}
      <span>Rede de transferência confirmada no atendimento.</span>
    </div>
    <SmoothDisclosure className="quote-fees" summary={<>
        <span>{buying ? "Valor informado" : "Recebimento estimado"}<strong>{totalText}</strong></span>
        <span className="quote-fees-toggle"><span className="fees-closed">Mostrar taxas</span><span className="fees-open">Ocultar taxas</span><ChevronDown size={14} /></span>
      </>}>
      <dl>
        <div><dt>Cotação spot</dt><dd>{exchangeRate.spotValue ? formatRate(exchangeRate.spotValue) : "Indisponível"}</dd></div>
        <div><dt>Ajuste por USDT</dt><dd>{buying ? "+ R$ 0,02" : "− R$ 0,01"}</dd></div>
        <div><dt>Cotação aplicada</dt><dd>{exchangeRate.value ? formatRate(exchangeRate.value) : "Indisponível"}</dd></div>
        <div><dt>Taxa de rede</dt><dd>A confirmar</dd></div>
      </dl>
    </SmoothDisclosure>
    <p className="quote-estimate-note">O ajuste da QINEX já está incluído na cotação. Eventuais custos de rede são confirmados no atendimento.</p>
  </div>;
}
