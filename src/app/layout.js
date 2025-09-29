import "./globals.css";

export const metadata = {
  title: "Flappy Bird 3D",
  description: "Flappy Bird clone using Next.js + Three.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
