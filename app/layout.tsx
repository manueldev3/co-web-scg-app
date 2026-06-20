import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import SCGLayout from "./components/SCGLayout";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guia de Star Citizen - Comercio Lucrativo",
  description:
    "Calcula rutas de comercio lucrativo en Star Citizen con nuestra guía y calculadora de rutas. Maximiza tus ganancias en el universo de Star Citizen con nuestras herramientas de comercio.",
  keywords:
    "Star Citizen, comercio lucrativo, calculadora de rutas, guía de comercio, ganancias en Star Citizen, rutas de comercio, materiales en Star Citizen",
};

// Next.js 16: themeColor and viewport must live in the `viewport` export,
// not in `metadata`.
export const viewport: Viewport = {
  themeColor: "#0F2C3E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 2. Colocas el script de Google dentro de <head> o directamente en el body */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5806249940542763"
          crossOrigin="anonymous"
          strategy="afterInteractive" // Controla cuándo se carga (opcional)
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AntdRegistry>
          <SCGLayout>
            <div className="h-10 flex items-center px-4 bg-[#0F2C3E]">
              <span className="text-[#82919E]">Guía de Star Citizen</span>
            </div>
            <hr className="border-gray-700" />
            <SiteHeader />
            {children}
            <SiteFooter />
          </SCGLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
