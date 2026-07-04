import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

/* Root layout — every page gets the same
   Nav, Footer and theme automatically. */

export const metadata: Metadata = {
  title: "JAJ Hub",
  description: "A retro launchpad for tools and experiments.",
};

export const viewport: Viewport = { themeColor: "#232327" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
