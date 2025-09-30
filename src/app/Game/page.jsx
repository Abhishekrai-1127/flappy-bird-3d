"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import axios from "axios";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";

const BIRD_SIZE = 40;
const PIPE_WIDTH = 60;
const PIPE_GAP = 300;
const INITIAL_GRAVITY = 10;
const INITIAL_JUMP_STRENGTH = -70;
const INITIAL_GAME_SPEED = 2;
const INITIAL_PIPE_INTERVAL = 2000;
const BIRD_X = 100;
const BACKGROUND_WIDTH = 800;

export default function Game({ playerName }) {
    const [birdY, setBirdY] = useState(200);
    const [pipes, setPipes] = useState([]);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [scrollX, setScrollX] = useState(0);

    const gameContainerRef = useRef(null);
    const gravityRef = useRef(INITIAL_GRAVITY);
    const jumpRef = useRef(INITIAL_JUMP_STRENGTH);
    const gameSpeedRef = useRef(INITIAL_GAME_SPEED);
    const pipeIntervalRef = useRef(INITIAL_PIPE_INTERVAL);

    const router = useRouter();

    // Redirect to home if no player cookie
    useEffect(() => {
        const playerName = Cookie.get("playerName");
        const playerId = Cookie.get("playerId");
        if (!playerName && !playerId) router.push("/");
    }, []);

    const handleLogout = () => {
        Object.keys(Cookie.get()).forEach((key) => Cookie.remove(key));
        router.push("/");
    };

    // Create a new pipe
    const createPipes = useCallback(() => {
        const gameHeight = gameContainerRef.current?.clientHeight || 0;
        const topHeight = Math.random() * (gameHeight - PIPE_GAP - 100) + 50;
        const bottomHeight = gameHeight - topHeight - PIPE_GAP;

        setPipes((prev) => [
            ...prev,
            {
                id: Date.now(),
                x: gameContainerRef.current.clientWidth,
                topHeight,
                bottomHeight,
                passed: false,
            },
        ]);
    }, []);

    const handleJump = () => {
        if (isGameOver || !gameStarted) return;
        setBirdY((prev) => Math.max(0, prev + jumpRef.current));
    };

    const handleStartGame = () => {
        setGameStarted(true);
        setBirdY(200);
        setPipes([]);
        setScore(0);
        setIsGameOver(false);
        setScrollX(0);
        gravityRef.current = INITIAL_GRAVITY;
        jumpRef.current = INITIAL_JUMP_STRENGTH;
        gameSpeedRef.current = INITIAL_GAME_SPEED;
        pipeIntervalRef.current = INITIAL_PIPE_INTERVAL;
    };

    const handleRestart = () => {
        handleStartGame();
    };

    // Game loop
    useEffect(() => {
        if (!gameStarted || isGameOver) return;

        let pipeInterval = setInterval(createPipes, pipeIntervalRef.current);
        let animationId;

        const loop = () => {
            setBirdY((prev) => prev + gravityRef.current / 3);

            setPipes((prevPipes) =>
                prevPipes
                    .map((pipe) => {
                        const newPipe = { ...pipe, x: pipe.x - gameSpeedRef.current };

                        if (newPipe.x < BIRD_X && !newPipe.passed) {
                            setScore((prev) => {
                                const newScore = prev + 1;

                                if (newScore % 10 === 0) {
                                    gameSpeedRef.current += 0.5;
                                    gravityRef.current += 0.001;
                                    pipeIntervalRef.current = Math.max(800, pipeIntervalRef.current - 200);
                                    jumpRef.current += 5;
                                    clearInterval(pipeInterval);
                                    pipeInterval = setInterval(createPipes, pipeIntervalRef.current);
                                }

                                return newScore;
                            });
                            newPipe.passed = true;
                        }

                        return newPipe;
                    })
                    .filter((pipe) => pipe.x > -PIPE_WIDTH)
            );

            setScrollX((prev) => (prev - gameSpeedRef.current) % BACKGROUND_WIDTH);

            animationId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            clearInterval(pipeInterval);
            cancelAnimationFrame(animationId);
        };
    }, [gameStarted, isGameOver, createPipes]);

    // Collision detection
    useEffect(() => {
        if (!gameStarted || isGameOver) return;

        const gameHeight = gameContainerRef.current?.clientHeight || 0;
        if (birdY < 0 || birdY > gameHeight - BIRD_SIZE) {
            setIsGameOver(true);
            return;
        }

        const birdRect = { x: BIRD_X, y: birdY, width: BIRD_SIZE, height: BIRD_SIZE };
        pipes.forEach((pipe) => {
            const topRect = { x: pipe.x, y: 0, width: PIPE_WIDTH, height: pipe.topHeight };
            const bottomRect = { x: pipe.x, y: pipe.topHeight + PIPE_GAP, width: PIPE_WIDTH, height: pipe.bottomHeight };
            const collide = (r1, r2) =>
                r1.x < r2.x + r2.width &&
                r1.x + r1.width > r2.x &&
                r1.y < r2.y + r2.height &&
                r1.y + r1.height > r2.y;
            if (collide(birdRect, topRect) || collide(birdRect, bottomRect)) setIsGameOver(true);
        });
    }, [birdY, pipes, gameStarted]);

    // Jump on key press
    useEffect(() => {
        const handleKeyDown = () => handleJump();
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameStarted, isGameOver]);

    // Submit score on game over
 useEffect(() => {
    if (isGameOver) {
        const id = Cookie.get("playerId");
        if (!id) return;

        axios
            .post("/api/addScore", { id, currScore: score })
            .then((res) => console.log("Score submitted:", res.data))
            .catch((err) => console.error("Score submit error:", err));
    }
}, [isGameOver, score]);

    return (
        <div
            ref={gameContainerRef}
            className="absolute inset-0 overflow-hidden cursor-pointer"
            onClick={handleJump}
        >
            {/* Scrolling Background */}    
            <div
                className="absolute inset-0 bg-repeat"
                style={{ backgroundImage: "url('/flappy-bird-background.png')", backgroundPositionX: `${scrollX}px` }}
            />

            {/* Score */}
            <div className="absolute top-4 left-4 text-3xl font-bold text-white z-10">Score: {score}</div>

            {/* Bird */}
            <div className="absolute" style={{ left: BIRD_X, top: birdY, width: BIRD_SIZE, height: BIRD_SIZE }}>
                <Image src="/bird.jpeg" alt="Bird" fill />
            </div>

            {/* Pipes */}
            {pipes.map((pipe) => (
                <div key={pipe.id}>
                    <div className="absolute" style={{ left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.topHeight, overflow: "hidden" }}>
                        <Image src="/aaa.png" alt="Top pipe" fill className="object-cover" />
                    </div>
                    <div className="absolute" style={{ left: pipe.x, top: pipe.topHeight + PIPE_GAP, width: PIPE_WIDTH, height: pipe.bottomHeight, overflow: "hidden" }}>
                        <Image src="/bbb.png" alt="Bottom pipe" fill className="object-cover" />
                    </div>
                </div>
            ))}

            {/* Start Game Overlay */}
            {!gameStarted && (
                <div className="relative w-full h-screen overflow-hidden">
  {/* ✅ Video Background */}
  <video
    className="absolute top-0 left-0 w-full h-full object-cover z-0"
    src="/flappy-bird.mp4" // put video in public folder
    autoPlay
    loop
    muted
    playsInline
  />

  {/*Overlay with GlassCard */}
  <div className="absolute inset-0 flex items-center justify-center z-10">
    <GlassCard height="200px" width="400px">
      <div className="flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-4xl font-bold text-white text-center">
          Flappy Bird 3D
        </h1>
        <button
          onClick={handleStartGame} // your start game function
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Start Game
        </button>
      </div>
    </GlassCard>
  </div>
</div>

            )}

            {/* Game Over Overlay */}
            {isGameOver && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
    <GlassCard height="250px" width="400px">
      <div className="flex flex-col items-center justify-center gap-4 p-4 text-white">
        <h1 className="text-4xl font-extrabold text-center mb-2">Game Over</h1>
        <p className="text-2xl text-center mb-4">Final Score: {score}</p>
        <div className="flex justify-evenly gap-4 w-full">
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
          >
            Play Again
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </GlassCard>
  </div>
            )}
        </div>
    );
}
