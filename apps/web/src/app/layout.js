import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'EventSphere AI - Event Management Platform',
  description: 'Multi-tenant event management and QR-based tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
