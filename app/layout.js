// app/layout.js
import * as React from 'react';
import ThemeRegistry from './ThemeRegistry';
import './style.css'; // Make sure your CSS file is imported here

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
