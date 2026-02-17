import type React from "react"
import type { Metadata } from "next"
import { Poppins, Montserrat } from "next/font/google"
import "./globals.css"
import { TranslationProvider } from "@/components/translation-provider"

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
})

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Hobease - Learn Skills, Teach Skills",
  description: "A modern skill-learning marketplace connecting learners with expert teachers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable} antialiased`}>
      <body className="font-sans">
        <TranslationProvider>{children}</TranslationProvider>
      </body>
    </html>
  )
}
