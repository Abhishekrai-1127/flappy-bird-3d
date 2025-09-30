"use client";
import React, { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import AnimatedBackground from "./AnimatedBackground";
import axios from "axios";
import Cookie from "js-cookie";
import { addUser } from "@/app/lib/apis";
import { useRouter } from "next/navigation";

export default function HomeScreen({ onStart }) {
    const [name, setName] = useState("");
    const [topPlayers, setTopPlayers] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const playerName = Cookie.get("playerName")
        const playerId = Cookie.get("playerId")

        if (playerName && playerId) {
            window.location.href = "/Game";
        }

    }, [])



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
                // Use data.data instead of data
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
    // Fetch top players from API
    useEffect(() => {
        const fetchTopPlayers = async () => {
            try {
                const response = await axios.get("/api/getScore");
                console.log(response.data); // This should be an array

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
        <div className="relative w-full h-screen">
            {/* 3D background */}
            <video
                className="absolute top-0 left-0 w-full h-full object-cover"
                src="/flappy bird.mp4"
                autoPlay
                loop
                muted
                playsInline
            />

            {/* Overlay content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <GlassCard height={"120px"} width={"600px"}>
                    <h1 className="text-4xl font-extrabold text-black">
                        Welcome to Flappy Bird 3D
                    </h1>
                </GlassCard>

                <div className="flex gap-14 justify-center pt-10">
                    {/* Name input */}
                    <GlassCard height={"360px"} width={"280px"}>
                        <div className="flex flex-col gap-4 items-center">
                            <h2 className="text-2xl font-bold">Enter Your Name</h2>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="px-4 py-2 rounded-lg text-black focus:outline-none w-48 bg-white/80"
                            />
                            <button
                                onClick={handlePlay}
                                className="px-6 py-2 bg-sky-800 text-white rounded-lg hover:bg-gray-200 transition"
                            >
                                Play
                            </button>
                        </div>
                    </GlassCard>

                    {/* Top players list */}
                    <GlassCard height={"360px"} width={"280px"}>
                        <div className="flex flex-col items-center justify-start h-full p-4 gap-2">
                            <h2 className="text-2xl font-bold mb-2">Top Players</h2>
                            {topPlayers.length === 0 ? (
                                <p className="text-black">Top players will be displayed here soon!</p>
                            ) : (
                                <ol className="list-decimal text-black ml-6">
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
