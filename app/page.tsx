import AudioVisualizer from "@/components/audio-visualizer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-black">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">Ambient Audio Visualizer</h1>
        <div className="flex flex-col items-center mb-6">
          <p className="text-white text-center mb-4">Click the button below to start capturing ambient audio</p>
          <div className="animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        <AudioVisualizer />
      </div>
    </main>
  )
}
