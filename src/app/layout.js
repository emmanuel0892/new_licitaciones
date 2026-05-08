import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import AntdProvider from "@/components/providers/AntdProvider"
import SessionProvider from "@/components/providers/SessionProvider"
import { auth } from "@/lib/auth"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HRR Licitaciones - Sistema de Gestión",
  description: "Sistema de Gestión de Licitaciones del Hospital Regional Rancagua",
};

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SessionProvider session={session}>
          <AntdProvider>{children}</AntdProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
