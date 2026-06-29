import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 Fantasy Predictor",
  description: "AI-powered F1 Fantasy team optimizer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
