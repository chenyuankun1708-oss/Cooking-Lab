import type{Metadata}from"next";import"./globals.css";
export const metadata:Metadata={title:"Cooking Lab · 料理决策与学习",description:"在食材、时间、营养与预算之间做出透明的料理选择"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
