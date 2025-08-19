// app/layout.js
import * as React from 'react';
import './global.css';
import ThemeRegistry from './ThemeRegistry';
export const metadata = {
  title: "DP Messaging",
  description: "For the special one",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry options={{ key: 'mui' }}>
          {children}
        </ThemeRegistry> {/* <--- This is the corrected line */}
      </body>
    </html>
  );
}
