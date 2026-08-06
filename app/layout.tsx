import type { Metadata } from "next";
import "./globals.css";
import BottomNavigation from "./components/layout/BottomNavigation";

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
        {children}
        <BottomNavigation />
      </body>
    </html>
  );
}
