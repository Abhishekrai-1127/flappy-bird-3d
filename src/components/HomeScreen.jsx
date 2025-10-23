"use client";
import React, { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import axios from "axios";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";

export default function HomeScreen() {
  const [name, setName] = useState("");
  const [topPlayers, setTopPlayers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const playerName = Cookie.get("playerName");
    const playerId = Cookie.get("playerId");

    if (playerName && playerId) {
      router.push("/Game");
    }
  }, []);

  const handlePlay = async () => {
    if (!name.trim()) {
      alert("Please enter your name!");
      return;
    }

    try {
      const response = await fetch("/api/addPlayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (response.ok && data?.data) {
        Cookie.set("playerName", data.data.name.trim());
        Cookie.set("playerId", data.data._id.toString());

        router.push("/Game");
      } else {
        alert(data.error || "Failed to add user.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const response = await axios.get("/api/getScore");
        if (response.data && Array.isArray(response.data)) {
          const top5 = response.data
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5);
          setTopPlayers(top5);
        } else {
          setTopPlayers([]);
        }
      } catch (error) {
        console.error("Failed to fetch top players:", error);
        setTopPlayers([]);
      }
    };

    fetchTopPlayers();
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      {/* Background video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="/flappy bird.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-start z-10 px-4 pt-16 md:pt-24 space-y-8">
        {/* Welcome Title Card */}
        <GlassCard
          height="auto"
          width="full"
          className="w-full max-w-full sm:max-w-xl md:max-w-3xl p-4 sm:p-6 md:p-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-center text-black leading-tight">
            Welcome to Flappy Bird 3D
          </h1>
        </GlassCard>

        {/* Input + Top Players Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 w-full max-w-5xl">
          {/* Name Input Card */}
          <GlassCard height="auto" width="full" className="flex-1 p-6 min-w-[220px]">
            <div className="flex flex-col gap-4 items-center w-full">
              <h2 className="text-2xl font-bold">Enter Your Name</h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="px-4 py-2 rounded-lg text-black focus:outline-none w-44 sm:w-56 md:w-64 bg-white/80"
              />
              <button
                onClick={handlePlay}
                className="px-6 py-2 bg-sky-800 text-white rounded-lg hover:bg-gray-200 transition mt-2"
              >
                Play
              </button>
            </div>
          </GlassCard>

          {/* Top Players Card */}
          <GlassCard height="auto" width="full" className="flex-1 p-6 min-w-[220px]">
            <div className="flex flex-col items-center justify-start gap-2 w-full">
              <h2 className="text-2xl font-bold mb-2">Top Players</h2>
              {topPlayers.length === 0 ? (
                <p className="text-black text-sm md:text-base text-center">
                  Top players will be displayed here soon!
                </p>
              ) : (
                <ol className="list-decimal text-black ml-4 md:ml-6 text-sm md:text-base w-full">
                  {topPlayers.map((player, index) => (
                    <li key={index}>
                      {player.name} - {player.score}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
