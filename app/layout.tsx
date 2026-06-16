import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
//import { Agentation } from "agentation";

const itim = Itim({
  variable: "--font-itim",
  subsets: ["thai", "latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "HLLC Store",
  description: "ECOM store and admin backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${itim.variable} font-[family-name:var(--font-itim)] h-full antialiased`}
    >
      {/* {process.env.NODE_ENV === "development" && <Agentation />} */}
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
