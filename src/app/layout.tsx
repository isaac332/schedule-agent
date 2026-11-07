import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "juntosxsiempre • Estudio Fotográfico | AI SMS Coordinator",
  description:
    "Agente inteligente de reservaciones por SMS y WhatsApp para juntosxsiempre, estudio fotográfico mexicano en Nogales, Sonora, México. Disponibilidad en tiempo real, cotizador y confirmación de citas.",
  applicationName: "juntosxsiempre",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fbf7f4] text-[#2d1822]">
        {children}
      </body>
    </html>
  );
}
