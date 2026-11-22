import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controller Home — Gestão Patrimonial",
  description: "Gestão autónoma de imóveis, contratos, rendas e documentos.",
  icons: {
    icon: "/rrs-icon.png",
    shortcut: "/rrs-icon.png",
    apple: "/rrs-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <body className="antialiased">{children}</body>
    </html>
  );
}
