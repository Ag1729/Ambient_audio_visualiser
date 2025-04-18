"use client"

interface SimplePlayButtonProps {
  isPlaying: boolean
  onToggle: () => void
}

export function SimplePlayButton({ isPlaying, onToggle }: SimplePlayButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="w-20 h-20 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300"
      style={{
        backgroundColor: "#9333ea",
        borderRadius: "9999px",
        width: "5rem",
        height: "5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        cursor: "pointer",
      }}
    >
      {isPlaying ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="4" width="4" height="16" fill="currentColor" />
          <rect x="14" y="4" width="4" height="16" fill="currentColor" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4L18 12L6 20V4Z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
