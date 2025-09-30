"use client"; // Client component
import React from "react";
import HomeScreen from "@/components/HomeScreen";

export default function GamePage() {

  
  const startGame = (name) => {
    return
  }

  return (
    <main className="relative w-full h-screen overflow-hidden">
        <HomeScreen onStart={startGame} />
    </main>
  );
}
