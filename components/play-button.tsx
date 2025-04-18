"use client"

import { useState, useEffect } from "react"
import { Play, Pause } from "lucide-react"

interface PlayButtonProps {
  isPlaying: boolean
  onToggle: () => void
  size?: "sm" | "md" | "lg"
}

export function PlayButton({ isPlaying, onToggle, size = "md" }: PlayButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isPlaying) {
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
    }
  }, [isPlaying])

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  }

  return (
    <button
      onClick={onToggle}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black`}
    >
      {isPlaying ? (
        <Pause className={isAnimating ? "animate-pulse" : ""} size={size === "lg" ? 32 : size === "md" ? 24 : 16} />
      ) : (
        <Play className="ml-1" size={size === "lg" ? 32 : size === "md" ? 24 : 16} />
      )}
    </button>
  )
}
