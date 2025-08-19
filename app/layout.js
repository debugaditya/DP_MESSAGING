// app/layout.js
import * as React from 'react';
import ThemeRegistry from './ThemeRegistry';

export const metadata = {
  title: 'DP Messaging', // You can change this
  description: 'A messaging app', // You can change this
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry options={{ key: 'mui' }}>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
