import type { Metadata } from "next";
import { Noto_Sans_Thai, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Agentation } from "agentation";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HLLC Store",
  description: "Official HLLC online store. Discover limited edition tumblers, charm sets, and exclusive collectibles.",
  icons: {
    icon: "/store/images/HLLCLOGO.png",
    apple: "/store/images/HLLCLOGO.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSansThai.variable} ${nunito.variable} h-full antialiased`}
    >
      {/* {process.env.NODE_ENV === "development" && <Agentation />} */}
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
