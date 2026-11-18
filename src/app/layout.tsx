import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const notoSansSc = localFont({
  src: [
    {
      path: "../fonts/NotoSansSC-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/NotoSansSC-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/NotoSansSC-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "名光微云服务",
  description: "名光微云服务。登录、注册，或使用第三方账号进入名光智能。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={notoSansSc.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
