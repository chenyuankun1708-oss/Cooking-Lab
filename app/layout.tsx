import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Cooking Lab · 料理决策与烹饪学习实验室", template: "%s · Cooking Lab" },
  description: "根据食材、时间、营养、预算和厨具条件发现适合的料理，并理解每一步为什么这样做。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
