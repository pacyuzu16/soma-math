import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Soma Math — AI Tutor for Rwanda Secondary Students",
  description:
    "Free AI-powered mathematics tutor for Rwandan O-Level and A-Level students. Step-by-step solutions, exam prep, and concept explanations.",
  keywords: ["math tutor", "Rwanda", "secondary school", "O-Level", "A-Level", "AI tutor"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
