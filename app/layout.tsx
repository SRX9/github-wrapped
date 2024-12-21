import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GitHub Wrapped 2024",
  description: "Get your GitHub Year end stats wrapped in a nice package",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="13734342-5b4a-4057-bbe4-604f1bca096f"
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
