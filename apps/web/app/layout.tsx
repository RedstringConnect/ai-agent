import { Geist, Geist_Mono, Roboto, Nunito_Sans } from "next/font/google"
import { Toaster } from "sonner"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCProvider } from "@/providers/trpc-provider"
import { cn } from "@workspace/ui/lib/utils";

const nunitoSansHeading = Nunito_Sans({subsets:['latin'],variable:'--font-heading'});

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", roboto.variable, nunitoSansHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
