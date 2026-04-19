import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bambu Lab MCP",
  description: "Connect Claude to your Bambu Lab account",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0f0f0f",
          color: "#f0f0f0",
        }}
      >
        {children}
      </body>
    </html>
  );
}
