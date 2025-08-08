// Este archivo sigue siendo un Server Component
import './globals.css';
import { AppProviders } from './providers';

export const metadata = {
  title: 'PropAdmin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Aquí envolvemos TODO en nuestro AppProviders (Client) */}
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
