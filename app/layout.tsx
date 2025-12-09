import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Memory Capsule",
  description: "Journaling powered by Craft + AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, lora.variable, "min-h-screen dark bg-background font-sans text-foreground antialiased")}>
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Link href="/" className="mr-8 flex items-center space-x-2">
              <span className="text-2xl font-serif font-bold tracking-tight text-primary">Memory Capsule</span>
            </Link>
            <div className="flex space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Dashboard
              </Link>
              <Link href="/journals" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Journals
              </Link>
              <Link href="/journal" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Process Entry
              </Link>
              <Link href="/settings" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Settings
              </Link>
            </div>
          </div>
        </nav>
      <Toaster />
        <main className="container mx-auto py-6 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
