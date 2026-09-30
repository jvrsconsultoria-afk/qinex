"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useUsdtRate } from "@/hooks/use-usdt-rate";
import { QuoteFields } from "@/components/quote-fields";
import SplitText from "@/components/split-text";
import StrokeText from "@/components/stroke-text";
import ScrollVelocity from "@/components/scroll-velocity";
import SmoothScroll from "@/components/smooth-scroll";
import ScrollVideo from "@/components/scroll-video";
import SmoothDisclosure from "@/components/smooth-disclosure";
import type { Operation } from "@/lib/quote-math";
import {
  ArrowDownUp, ChevronDown, Globe2,
  Headset, Menu, ShieldCheck, Sparkles, X,
} from "lucide-react";

const ColorBends = dynamic(() => import("@/components/color-bends"), { ssr: false });
const heroColors = ["#2453ff", "#9635ff", "#5bdcff", "#6724dc"];

const steps = [
  { number: "01", image: "/images/steps/step-conversation.webp", title: "Converse com a QINEX", description: "Informe se deseja comprar ou vender USDT e o valor que pretende negociar.", note: "Um atendimento que começa com você." },
  { number: "02", image: "/images/steps/step-confirmation.webp", title: "Confirme as condições", description: "Confira a cotação, os custos, a forma de pagamento e a rede antes de seguir.", note: "Tudo claro antes da sua decisão." },
  { number: "03", image: "/images/steps/step-wallet.webp", title: "Conclua sua operação", description: "Após a confirmação, siga as orientações para pagamento e transferência do ativo.", note: "Acompanhamento em cada etapa." },
];

const questions = [
  { title: "O que é USDT?", answer: "USDT é uma stablecoin emitida pela Tether, desenvolvida para acompanhar o valor do dólar americano. Ela pode ser transferida em redes blockchain compatíveis. Seu preço de mercado pode variar, e o ativo envolve riscos de emissor, liquidez e rede." },
  { title: "Como funciona a compra e a venda?", answer: "Você informa se deseja comprar ou vender e o valor da operação. Em seguida, solicita uma cotação e confirma as condições, a forma de pagamento e a rede de transferência com o atendimento. A operação só deve prosseguir depois dessa confirmação." },
  { title: "Como são definidos a cotação e os custos?", answer: "A cotação depende do momento da negociação, do volume e das condições da operação. Solicite o valor final, incluindo eventuais custos de serviço e de rede, antes de confirmar. Os valores não são fixados nesta página." },
  { title: "Qual rede devo utilizar para transferir USDT?", answer: "Confirme com o atendimento qual rede está disponível para sua operação. A rede de envio deve ser a mesma da carteira de destino. Endereço, ativo e rede precisam ser conferidos antes de qualquer transferência, pois um envio incorreto pode resultar em perda dos recursos." },
  { title: "Preciso ter uma carteira digital?", answer: "Para receber ou enviar USDT, é necessário um endereço compatível com a rede acordada. Ele pode pertencer a uma carteira própria ou a uma plataforma que aceite o ativo. Se tiver dúvidas, peça orientação antes de iniciar a operação." },
  { title: "A QINEX também atende empresas?", answer: "Pessoas físicas e empresas podem consultar as condições de negociação. O atendimento confirma a disponibilidade, a documentação necessária e as condições para cada perfil e volume de negociação." },
];

function Brand({ footer = false }: { footer?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (footer) return;

    const updateBrand = () => setScrolled(window.scrollY > 48);
    updateBrand();
    window.addEventListener("scroll", updateBrand, { passive: true });
    return () => window.removeEventListener("scroll", updateBrand);
  }, [footer]);

  return <a href="#inicio" className={`brand ${footer ? "brand-footer" : `brand-header${scrolled ? " is-scrolled" : ""}`}`} aria-label="QINEX Crypto, início">
    <Image className="brand-image" src="/images/qinex-brand.png" alt="" width={48} height={48} sizes="48px" />
    <span className="brand-name" aria-hidden="true">QINEX<span>CRYPTO</span></span>
  </a>;
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [operation, setOperation] = useState<Operation>("comprar");
  const [amount, setAmount] = useState("");
  const exchangeRate = useUsdtRate(operation);
  const headerRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!menuOpen) return;
    const scrollRoot = document.documentElement;
    const previousOverflow = scrollRoot.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    scrollRoot.style.overflow = "hidden";
    mobileNavRef.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab") return;
      const controls = [...(headerRef.current?.querySelectorAll<HTMLElement>("a, button") ?? [])]
        .filter(control => control.getClientRects().length && getComputedStyle(control).visibility !== "hidden");
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      scrollRoot.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", closeOnDesktop);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  function changeOperation(nextOperation: Operation) {
    if (nextOperation !== operation) setAmount("");
    setOperation(nextOperation);
  }

  return <>
    <SmoothScroll locked={menuOpen} />
    <a className="skip-link" href="#conteudo" inert={menuOpen}>Pular para o conteúdo</a>
    <header ref={headerRef} className="site-header" onClick={event => { if ((event.target as Element).closest("a")) setMenuOpen(false); }}>
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#sobre-usdt">Sobre o USDT</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <div className="header-actions">
          <a className="button button-small button-light header-quote" href="#negocie">Simular cotação</a>
          <button type="button" className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="mobile-nav">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
      <AnimatePresence initial={false}>
      {menuOpen && <motion.nav ref={mobileNavRef} id="mobile-nav" className="mobile-nav" aria-label="Navegação móvel" data-lenis-prevent
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
        transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
        {[ ["#inicio", "Início"], ["#como-funciona", "Como funciona"], ["#sobre-usdt", "Sobre o USDT"], ["#duvidas", "Dúvidas"]].map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <a className="button button-light" href="#negocie" onClick={() => setMenuOpen(false)}>Simular cotação</a>
      </motion.nav>}
      </AnimatePresence>
    </header>

    <main id="conteudo" inert={menuOpen}>
      <section className="hero-shell" id="inicio" aria-labelledby="hero-title">
        <ColorBends className="hero-color-bends" colors={heroColors} rotation={12} speed={0.12} scale={1.15} verticalStretch={3.5} frequency={1} warpStrength={1} mouseInfluence={0.06} parallax={0.12} noise={0.03} intensity={0.9} bandWidth={6} />
        <div className="hero container">
          <div className="hero-content">
            <h1 id="hero-title" aria-label="Seu próximo movimento, em USDT.">
              <span aria-hidden="true">
                <SplitText tag="span" className="hero-heading-copy" textAlign="left">Seu próximo<br />movimento,</SplitText>
                <StrokeText text="em USDT." strokeColor="var(--brand-text-blue)" fillGradient fontSize={100} fontWeight={650} letterSpacing={-6.3} trigger="mount" />
              </span>
            </h1>
            <p className="hero-description">Uma experiência direta para comprar e vender dólar digital. Condições claras e atendimento próximo, em cada etapa da sua operação.</p>
            <div className="hero-buttons">
              <a className="button button-light" href="#negocie" onClick={() => changeOperation("comprar")}>Comprar USDT</a>
              <a className="button button-outline" href="#negocie" onClick={() => changeOperation("vender")}>Vender USDT</a>
            </div>
            <p className="hero-assurance"><ShieldCheck size={16} /> Clareza para negociar. Confiança para avançar.</p>
          </div>
          <div className="hero-art">
            <div className="hero-glow" />
            <Image className="hero-logo" src="/images/qinex-hero.png" alt="Símbolo Q da QINEX Crypto em metal com reflexos azuis, violetas e ciano" width={1280} height={1280} priority sizes="(max-width: 760px) 90vw, 52vw" />
          </div>
        </div>
      </section>

      <section className="section container negotiation" id="negocie" aria-labelledby="trade-title">
        <div className="negotiation-copy">
          <SplitText tag="h2" id="trade-title" textAlign="left">Do real ao digital.<br /><span className="gradient-text">E de volta.</span></SplitText>
          <p>Compre USDT para acessar o universo do dólar digital. Venda quando precisar voltar aos reais. A QINEX aproxima os dois lados da sua operação.</p>
          <div className="trade-detail"><span className="detail-icon"><ArrowDownUp /></span><div><SplitText tag="h3" text="Compra e venda, no seu ritmo" textAlign="left" /><p>Uma cotação para o momento e o volume que fazem sentido para você.</p></div></div>
          <div className="trade-detail"><span className="detail-icon"><Headset /></span><div><SplitText tag="h3" text="Uma conversa faz a diferença" textAlign="left" /><p>Esclareça suas dúvidas diretamente com o atendimento antes de negociar.</p></div></div>
        </div>
        <div className="quote-card">
          <div className="quote-card-title"><Sparkles size={18} /><span>Simule sua cotação</span><span className="quote-brand">QINEX</span></div>
          <QuoteFields operation={operation} amount={amount} onAmountChange={setAmount} onOperationChange={changeOperation} exchangeRate={exchangeRate} idPrefix="quote" />
        </div>
      </section>

      <section className="section container" id="como-funciona" aria-labelledby="steps-title">
        <div className="section-heading centered">
          <SplitText tag="h2" id="steps-title">Seu USDT.<br /><span className="muted">Em três passos.</span></SplitText>
          <p>Você escolhe o movimento. Nós ajudamos com o caminho.</p>
        </div>
        <ol className="steps-journey" role="list" aria-label="Etapas da negociação">
          {steps.map(step => <li className="journey-step" key={step.number}>
              <div className="journey-node" aria-hidden="true">
                <Image className="journey-icon" src={step.image} alt="" width={384} height={384} sizes="(max-width: 760px) 96px, 128px" />
              </div>
              <SplitText tag="h3" text={step.title} />
              <p className="journey-description">{step.description}</p>
              <span className="journey-note">{step.note}</span>
            </li>)}
        </ol>
      </section>

      <section className="section container about-section" id="sobre-usdt" aria-labelledby="about-title">
        <div className="about-visual">
          <ScrollVideo src="/media/usdt-box-scroll.mp4" poster="/media/usdt-box-poster.webp" width={400} height={574} frames={{ directory: "/media/usdt-box-frames", count: 90, width: 320, height: 458 }} />
        </div>
        <div className="about-copy">
          <SplitText tag="h2" id="about-title" textAlign="left">O dólar digital.<br /><span className="muted">Mais perto de você.</span></SplitText>
          <p>USDT é uma stablecoin da Tether desenvolvida para acompanhar o dólar americano. Ela conecta a referência de uma moeda global à possibilidade de transferência em redes blockchain.</p>
          <p>Antes de negociar, entenda como o ativo funciona e confirme as condições de uso. Ter uma referência em dólar não elimina riscos nem garante o valor de mercado.</p>
          <a className="text-link" href="#duvidas">Entenda antes de dar o próximo passo <ChevronDown size={16} /></a>
        </div>
      </section>

      <section className="section container faq-section" id="duvidas" aria-labelledby="faq-title">
        <div className="faq-heading"><SplitText tag="h2" id="faq-title" textAlign="left">Boas perguntas.<br /><span className="muted">Respostas claras.</span></SplitText><p>O que você precisa saber para começar.</p><a className="text-button" href="#negocie"><ArrowDownUp size={17} /> Simule sua cotação</a></div>
        <div className="faq-list">{questions.map(question => <SmoothDisclosure className="faq-item" key={question.title} summary={<>{question.title}<span className="faq-plus" aria-hidden="true">+</span></>}><p>{question.answer}</p></SmoothDisclosure>)}</div>
      </section>

      <ScrollVelocity text="QINEX CRYPTO · SEU PRÓXIMO MOVIMENTO" />

      <section className="container final-cta" aria-labelledby="cta-title">
        <div className="cta-glow" />
        <SplitText tag="h2" id="cta-title">O futuro é digital.<br /><span className="gradient-text">O atendimento é humano.</span></SplitText>
        <p>Compre ou venda USDT com uma conversa clara desde o início.</p>
        <a className="button button-light" href="#negocie">Simular cotação <ArrowDownUp size={18} /></a>
        <span className="cta-signature">QINEX CRYPTO</span>
      </section>
    </main>

    <footer className="site-footer container" inert={menuOpen}>
      <div className="footer-top"><div><Brand footer /><p>Clareza em cada movimento.</p></div><nav aria-label="Navegação do rodapé"><a href="#como-funciona">Como funciona</a><a href="#sobre-usdt">Sobre o USDT</a><a href="#duvidas">Perguntas frequentes</a><a href="#negocie">Cotação</a></nav><span className="footer-locale"><Globe2 size={16} /> Português · Brasil</span></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} QINEX Crypto. Todos os direitos reservados.</span><span>Compra e venda de USDT.</span></div>
    </footer>

  </>;
}
