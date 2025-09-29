import Image from "next/image";
import Game from "@/components/Game";

export default function GamePage() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* ✅ SSR Background */}
      <Image
        src="/flappy-bird-background.jpg"
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* ✅ CSR Game (bird + pipes) */}
      <Game />
    </main>
  );
} 