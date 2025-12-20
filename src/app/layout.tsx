import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, AuthProvider } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "جمعية خير - نظام إدارة الحلقات القرآنية",
  description: "نظام متكامل لإدارة حلقات تحفيظ القرآن الكريم",
  keywords: "تحفيظ قرآن، حلقات قرآنية، إدارة طلاب، متابعة حفظ",
  authors: [{ name: "جمعية خير" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
        >
          <AuthProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
