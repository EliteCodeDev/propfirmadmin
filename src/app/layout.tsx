// Este archivo sigue siendo un Server Component
import './globals.css';
import { AuthProvider } from './providers';

export const metadata = {
  title: 'PropAdmin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Aquí envolvemos TODO en nuestro AuthProvider (Client) */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
