import type { Metadata } from "next";
import "./globals.css";
import AppChrome from "./components/layout/AppChrome";

export const metadata: Metadata = {
  title: "LinkUp",
  description:
    "Discover and organize real-world activities in your school community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
