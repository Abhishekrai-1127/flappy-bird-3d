"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import ScoreApi from "../app/lib/apis";

const BIRD_SIZE = 40;
const PIPE_WIDTH = 60;
const PIPE_GAP = 300;
const INITIAL_GRAVITY = 8;
const INITIAL_JUMP_STRENGTH = -50;
const INITIAL_GAME_SPEED = 2;
const INITIAL_PIPE_INTERVAL = 2000;
const BIRD_X = 100; // Fixed bird x-position
const BACKGROUND_WIDTH = 800; // Background image width

export default function Game({ playerName }) {
  const [birdY, setBirdY] = useState(200);
  const [pipes, setPipes] = useState([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scrollX, setScrollX] = useState(0);

  const gameContainerRef = useRef(null);

  const gravityRef = useRef(INITIAL_GRAVITY);
  const jumpRef = useRef(INITIAL_JUMP_STRENGTH);
  const gameSpeedRef = useRef(INITIAL_GAME_SPEED);
  const pipeIntervalRef = useRef(INITIAL_PIPE_INTERVAL);

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
    if (isGameOver) return;
    setBirdY((prev) => Math.max(0, prev + jumpRef.current));
  };

  const handleRestart = () => {
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

  useEffect(() => {
    if (isGameOver) return;

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
  }, [isGameOver, createPipes]);

  // Collision detection & game over
  useEffect(() => {
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
  }, [birdY, pipes]);

  // Jump on key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleJump(); // jump on any key
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Submit score on game over
  useEffect(() => {
    if (isGameOver && playerName) {
      ScoreApi({ name: playerName, score })
        .then((res) => console.log("Score submitted:", res))
        .catch((err) => console.error("Score submit error:", err));
    }
  }, [isGameOver, playerName, score]);

  return (
    <div
      ref={gameContainerRef}
      className="absolute inset-0 overflow-hidden cursor-pointer"
      onClick={handleJump}
    >
      {/* Background */}
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
        style={{ left: BIRD_X, top: birdY, width: BIRD_SIZE, height: BIRD_SIZE }}
      >
        <Image src="/bird.jpeg" alt="Bird" fill />
      </div>

      {/* Pipes */}
      {pipes.map((pipe) => (
        <div key={pipe.id}>
          <div
            className="absolute"
            style={{ left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.topHeight, overflow: "hidden" }}
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

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white z-20">
          <h1 className="text-6xl font-extrabold mb-4">Game Over</h1>
          <p className="text-2xl mb-8">Final Score: {score}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRestart();
            }}
            className="px-6 py-3 bg-blue-600 rounded-md text-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}