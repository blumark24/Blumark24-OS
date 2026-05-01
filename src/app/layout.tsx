import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blumark24 OS – نظام إدارة الأعمال بالذكاء الاصطناعي",
  description: "منصة متكاملة لإدارة جميع عمليات الشركات السعودية بذكاء",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2L3 7v10l9 5 9-5V7L12 2z' fill='%2322d3ee'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
