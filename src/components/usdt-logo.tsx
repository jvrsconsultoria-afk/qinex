import Image from "next/image";

export function UsdtLogo({ size = "small", alt = "Logo do USDT (Tether)" }: { size?: "small" | "large"; alt?: string }) {
  const dimension = size === "large" ? 44 : 24;
  return <Image src="/images/usdt-logo.svg" className={`usdt-logo usdt-logo-${size}`} alt={alt} width={dimension} height={dimension} />;
}
