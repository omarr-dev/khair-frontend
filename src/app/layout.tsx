import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider, AuthProvider, TenantProvider } from "@/components/providers";
import { Toaster } from "sonner";
import { OfflineBanner } from "@/components/shared/offline-banner";

export const metadata: Metadata = {
  title: "نظام إدارة الحلقات القرآنية",
  description: "نظام متكامل لإدارة حلقات تحفيظ القرآن الكريم",
  keywords: "تحفيظ قرآن، حلقات قرآنية، إدارة طلاب، متابعة حفظ",
  authors: [{ name: "نظام الحلقات" }],
  // Icons are set dynamically by TenantProvider based on tenant branding
  icons: null,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Google Ads tag (gtag.js) */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=AW-17902349140"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17902349140');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          <TenantProvider>
            <AuthProvider>
              <OfflineBanner />
              {children}
              <Toaster
                position="top-center"
                richColors
                closeButton
                dir="rtl"
                toastOptions={{
                  style: {
                    fontFamily: 'Cairo, Noto Sans Arabic, sans-serif',
                  },
                }}
              />
            </AuthProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

