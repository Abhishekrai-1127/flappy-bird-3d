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
const INITIAL_GRAVITY = 0.6;   // ✅ smaller gravity for smoother fall
const INITIAL_JUMP_STRENGTH = -8; // ✅ smaller negative jump velocity
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
  const velocityRef = useRef(0); // ✅ smooth bird motion

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

  // Jump: just set velocity upward
  const handleJump = () => {
    if (isGameOver || !gameStarted) return;
    velocityRef.current = jumpRef.current;
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
    velocityRef.current = 0;
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
      // ✅ Apply gravity to velocity
      velocityRef.current += gravityRef.current;

      // ✅ Update bird position using velocity
      setBirdY((prev) => Math.max(0, prev + velocityRef.current));

      // Move pipes
      setPipes((prevPipes) =>
        prevPipes
          .map((pipe) => {
            const newPipe = { ...pipe, x: pipe.x - gameSpeedRef.current };

            if (newPipe.x < BIRD_X && !newPipe.passed) {
              setScore((prev) => {
                const newScore = prev + 1;
                if (newScore % 10 === 0) {
                  gameSpeedRef.current += 0.5;
                  gravityRef.current += 0.05;
                  pipeIntervalRef.current = Math.max(800, pipeIntervalRef.current - 200);
                  jumpRef.current -= 0.5; // slightly stronger jump
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

      // Background scroll
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
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") handleJump();
    };
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
        style={{
          backgroundImage: "url('/flappy-bird-background.png')",
          backgroundPositionX: `${scrollX}px`,
        }}
      />

      {/* Score */}
      <div className="absolute top-4 left-4 text-3xl font-bold text-white z-10">
        Score: {score}
      </div>

      {/* Bird */}
      <div
        className="absolute"
        style={{
          left: BIRD_X,
          top: birdY,
          width: BIRD_SIZE,
          height: BIRD_SIZE,
        }}
      >
        <Image src="/bird.jpeg" alt="Bird" fill />
      </div>

      {/* Pipes */}
      {pipes.map((pipe) => (
        <div key={pipe.id}>
          <div
            className="absolute"
            style={{
              left: pipe.x,
              top: 0,
              width: PIPE_WIDTH,
              height: pipe.topHeight,
              overflow: "hidden",
            }}
          >
            <Image src="/aaa.png" alt="Top pipe" fill className="object-cover" />
          </div>
          <div
            className="absolute"
            style={{
              left: pipe.x,
              top: pipe.topHeight + PIPE_GAP,
              width: PIPE_WIDTH,
              height: pipe.bottomHeight,
              overflow: "hidden",
            }}
          >
            <Image src="/bbb.png" alt="Bottom pipe" fill className="object-cover" />
          </div>
        </div>
      ))}

      {/* Start Game Overlay with video + GlassCard */}
      {!gameStarted && (
        <div className="relative w-full h-screen overflow-hidden">
          <video
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            src="/flappy-bird.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <GlassCard height="200px" width="400px">
              <div className="flex flex-col items-center justify-center gap-4 p-4">
                <h1 className="text-4xl font-bold text-white text-center">
                  Flappy Bird 3D
                </h1>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Start Game
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Game Over Overlay with GlassCard */}
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <GlassCard height="250px" width="400px">
            <div className="flex flex-col items-center justify-center gap-4 p-4 text-white">
              <h1 className="text-4xl font-extrabold text-center mb-2">
                Game Over
              </h1>
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
