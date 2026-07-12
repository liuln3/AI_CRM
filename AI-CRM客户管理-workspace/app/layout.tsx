import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI+CRM 客户管理",
  description: "轻量级 AI+CRM，对话式录入，让销售不再抗拒写 CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
