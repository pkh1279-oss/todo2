import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '오늘 뭐 먹지? — 음식 추천 챗봇',
  description: '기분과 상황에 맞는 음식 메뉴를 추천해드려요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-orange-50 min-h-screen">{children}</body>
    </html>
  );
}
