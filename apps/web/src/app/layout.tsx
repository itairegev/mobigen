import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mobigen - AI-Powered Mobile App Generator',
  description: 'Generate production-ready mobile apps with AI',
};

console.log('[layout.tsx] Module loaded');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log('[layout.tsx] RootLayout rendering');
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
