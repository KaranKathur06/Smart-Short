'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#020617',
            color: '#e5e7eb',
            border: '1px solid #1e293b',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#020617',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#020617',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}
