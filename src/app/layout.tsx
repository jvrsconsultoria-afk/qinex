import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./brand.css";
import "./quote.css";
import "./surfaces.css";
import "./steps.css";
import "./hero.css";
import "./motion.css";
import "./typography.css";
import "./responsive.css";

export const metadata: Metadata = {
  title: "QINEX Crypto | Compra e venda de USDT",
  description: "Compre e venda USDT com a QINEX Crypto. Atendimento próximo, condições transparentes e orientação em cada etapa da sua operação.",
  applicationName: "QINEX Crypto",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "QINEX Crypto | Seu próximo movimento, em USDT.",
    description: "Uma experiência direta para comprar e vender USDT, com condições claras e atendimento especializado.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
