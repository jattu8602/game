"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const GRID_SIZE = 9 // 3x3
const GAME_SECONDS = 30
const MOLE_INTERVAL_MS = 700
const LS_KEY_HIGH_SCORE = "wam_high_score_v1"

export default function WhackAMole() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const moleRef = useRef<NodeJS.Timeout | null>(null)

  // load persisted high score
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY_HIGH_SCORE) : null
      if (raw) setHighScore(Number(raw) || 0)
    } catch {
      // ignore localStorage errors
    }
  }, [])

  // persist high score when it updates
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_KEY_HIGH_SCORE, String(highScore))
      }
    } catch {
      // ignore localStorage errors
    }
  }, [highScore])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
    }
  }, [score, highScore])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (moleRef.current) clearInterval(moleRef.current)
    }
  }, [])

  function startGame() {
    // reset state
    setIsPlaying(true)
    setScore(0)
    setTimeLeft(GAME_SECONDS)
    setActiveIndex(null)

    // timer
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopGame()
          return 0
        }
        return t - 1
      })
    }, 1000)

    // mole spawner
    if (moleRef.current) clearInterval(moleRef.current)
    moleRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        let next = Math.floor(Math.random() * GRID_SIZE)
        // avoid repeat to feel more dynamic
        if (prev !== null && next === prev) {
          next = (next + 1) % GRID_SIZE
        }
        return next
      })
    }, MOLE_INTERVAL_MS)
  }

  function stopGame() {
    setIsPlaying(false)
    setActiveIndex(null)
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (moleRef.current) {
      clearInterval(moleRef.current)
      moleRef.current = null
    }
    setHighScore((hs) => (score > hs ? score : hs))
  }

  function handleCellTap(idx: number) {
    if (!isPlaying) return
    if (idx === activeIndex) {
      setScore((s) => s + 1)
      // immediately move the mole to prevent double-tap on same cell
      setActiveIndex(null)
    } else {
      // optional: small penalty for wrong tap
      setScore((s) => (s > 0 ? s - 1 : 0))
    }
  }

  return (
    <div className="w-full">
      {/* Scoreboard */}
      <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className="text-xl font-semibold">{score}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">High</span>
          <span className="text-xl font-semibold">{highScore}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Time</span>
          <span className="text-xl font-semibold">{timeLeft}s</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={isPlaying ? stopGame : startGame}
          className={cn(
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
            "bg-primary text-primary-foreground hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-pressed={isPlaying}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isPlaying) stopGame()
            setScore(0)
            setTimeLeft(GAME_SECONDS)
            setActiveIndex(null)
          }}
          className={cn(
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
            "bg-secondary text-secondary-foreground hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear saved high score on this device?")) {
              setHighScore(0)
              try {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(LS_KEY_HIGH_SCORE)
                }
              } catch {
                // ignore
              }
            }
          }}
          className={cn(
            "ml-auto inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium",
            "bg-accent text-accent-foreground hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          Clear High Score
        </button>
      </div>

      {/* Grid */}
      <div className="mt-5 grid grid-cols-3 gap-3" role="grid" aria-label="Whack a mole grid">
        {Array.from({ length: GRID_SIZE }).map((_, idx) => {
          const isActive = idx === activeIndex
          return (
            <button
              key={idx}
              role="gridcell"
              aria-label={isActive ? "Active tile" : "Inactive tile"}
              onClick={() => handleCellTap(idx)}
              className={cn(
                "relative w-full aspect-square rounded-lg border",
                "bg-muted text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "transition-colors",
                isActive && "bg-primary text-primary-foreground",
              )}
            >
              <span className="sr-only">{isActive ? "Tap me!" : "Empty"}</span>
              {/* Simple visual pulse when active */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary-foreground animate-pulse"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tips */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Mobile-friendly: big tap targets and simple visuals for smooth play.
      </p>
    </div>
  )
}
