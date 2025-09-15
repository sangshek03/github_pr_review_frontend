import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "PR Agent - GitHub PR Reviewer Platform",
  description: "AI-powered GitHub Pull Request review platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        
          <ThemeProvider>
            {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
