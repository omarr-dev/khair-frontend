import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
