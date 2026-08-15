import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEY-Technologia",
  description: "A cinematic 3D rocket launch from Earth toward space.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
