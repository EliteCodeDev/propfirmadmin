// app/layout.tsx
import './globals.css';
import { AuthProvider } from './providers';

export const metadata = { title: 'PropAdmin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
