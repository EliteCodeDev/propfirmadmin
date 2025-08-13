import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../hooks/useTheme';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PropFirm Dashboard',
  description: 'Sistema de gestión de trading y retiros',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}