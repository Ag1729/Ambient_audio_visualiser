"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Mic, MicOff, Settings, AudioWaveformIcon as Waveform, BarChart3, Circle, Waves } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type VisualizerType = "waveform" | "bars" | "circular" | "arcticWave" | "pulseWave" | "mirrorWave"

export default function AudioVisualizer() {
  const [isListening, setIsListening] = useState(false)
  const [sensitivity, setSensitivity] = useState(1.5)
  const [visualizerType, setVisualizerType] = useState<VisualizerType>("arcticWave")
  const [colorScheme, setColorScheme] = useState("monochrome")
  const [landscapeMode, setLandscapeMode] = useState(false)
  const [trailEffect, setTrailEffect] = useState(0.3)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number>(0)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const previousDataRef = useRef<Uint8Array | null>(null)

  // Initialize audio context and analyzer
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Initialize audio context if not already done
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      // Create analyzer node
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048

      // Create source from microphone stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
      sourceRef.current.connect(analyserRef.current)

      // Create data array for analyzer
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
      previousDataRef.current = new Uint8Array(bufferLength)

      setIsListening(true)
      draw()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopListening = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    setIsListening(false)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const getGradient = (ctx: CanvasRenderingContext2D, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)

    if (colorScheme === "monochrome") {
      gradient.addColorStop(0, "#ffffff")
      gradient.addColorStop(1, "#ffffff")
      return gradient
    }

    if (colorScheme === "gradient-purple") {
      gradient.addColorStop(0, "#9333ea")
      gradient.addColorStop(0.5, "#7e22ce")
      gradient.addColorStop(1, "#4c1d95")
    } else if (colorScheme === "gradient-blue") {
      gradient.addColorStop(0, "#2563eb")
      gradient.addColorStop(0.5, "#1d4ed8")
      gradient.addColorStop(1, "#1e40af")
    } else if (colorScheme === "gradient-green") {
      gradient.addColorStop(0, "#10b981")
      gradient.addColorStop(0.5, "#059669")
      gradient.addColorStop(1, "#047857")
    } else if (colorScheme === "gradient-red") {
      gradient.addColorStop(0, "#ef4444")
      gradient.addColorStop(0.5, "#dc2626")
      gradient.addColorStop(1, "#b91c1c")
    }

    return gradient
  }

  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

    ctx.lineWidth = 2
    ctx.strokeStyle = getGradient(ctx, height)
    ctx.beginPath()

    const sliceWidth = width / dataArrayRef.current.length
    let x = 0

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = (dataArrayRef.current[i] / 128.0) * sensitivity
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }

  const drawBars = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    const barWidth = width / (dataArrayRef.current.length / 4)
    let x = 0

    ctx.fillStyle = getGradient(ctx, height)

    for (let i = 0; i < dataArrayRef.current.length; i += 4) {
      const barHeight = dataArrayRef.current[i] * sensitivity
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
      x += barWidth
    }
  }

  const drawCircular = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 4

    ctx.strokeStyle = getGradient(ctx, height)
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.stroke()

    const barCount = 180
    const angleStep = (2 * Math.PI) / barCount

    for (let i = 0; i < barCount; i++) {
      const sampleIndex = Math.floor((i * dataArrayRef.current.length) / barCount)
      const value = dataArrayRef.current[sampleIndex] * sensitivity

      const barHeight = (value / 256) * radius

      const angle = i * angleStep

      const x1 = centerX + Math.cos(angle) * radius
      const y1 = centerY + Math.sin(angle) * radius
      const x2 = centerX + Math.cos(angle) * (radius + barHeight)
      const y2 = centerY + Math.sin(angle) * (radius + barHeight)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }

  // Arctic Monkeys style center waveform
  const drawArcticWave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

    // Apply trail effect by not fully clearing the canvas
    ctx.fillStyle = "rgba(0, 0, 0, " + (1 - trailEffect) + ")"
    ctx.fillRect(0, 0, width, height)

    const centerY = height / 2

    // Draw the center line
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()

    // Draw the waveform
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2

    // Only use the middle portion of the data for a more focused waveform
    const startPoint = Math.floor(dataArrayRef.current.length * 0.4)
    const endPoint = Math.floor(dataArrayRef.current.length * 0.6)
    const usableDataLength = endPoint - startPoint

    // Scale to fit the width
    const sliceWidth = width / usableDataLength

    let x = 0
    for (let i = startPoint; i < endPoint; i++) {
      const v = (dataArrayRef.current[i] / 128.0) * sensitivity
      const y = centerY + ((v - 1) * height) / 4

      if (i === startPoint) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.stroke()
  }

  // Pulse wave visualization (inspired by the horizontal line with pulse)
  const drawPulseWave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analyserRef.current || !dataArrayRef.current || !previousDataRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    // Apply trail effect
    ctx.fillStyle = "rgba(0, 0, 0, " + (1 - trailEffect) + ")"
    ctx.fillRect(0, 0, width, height)

    const centerY = height / 2

    // Calculate the average frequency value for pulse intensity
    let sum = 0
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i]
    }
    const avgFrequency = sum / dataArrayRef.current.length

    // Smooth transition between frames
    if (previousDataRef.current) {
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        previousDataRef.current[i] = previousDataRef.current[i] * 0.7 + dataArrayRef.current[i] * 0.3
      }
    } else {
      previousDataRef.current = new Uint8Array(dataArrayRef.current)
    }

    // Draw the center line
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 1
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()

    // Draw the pulse
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2

    // Start at left edge
    ctx.moveTo(0, centerY)

    // Draw flat line to pulse start
    const pulseStartX = width * 0.4
    ctx.lineTo(pulseStartX, centerY)

    // Draw the pulse
    const pulseWidth = width * 0.2 // 20% of width
    const pulsePoints = 40
    const pointWidth = pulseWidth / pulsePoints

    for (let i = 0; i < pulsePoints; i++) {
      const x = pulseStartX + i * pointWidth
      const idx = Math.floor((i * previousDataRef.current.length) / pulsePoints)
      const normalized = (previousDataRef.current[idx] / 255) * sensitivity
      const amplitude = normalized * height * 0.2 // 20% of height

      // Create a sine-like wave for the pulse
      const y = centerY + Math.sin((i / pulsePoints) * Math.PI * 2) * amplitude
      ctx.lineTo(x, y)
    }

    // Draw flat line to end
    ctx.lineTo(width, centerY)
    ctx.stroke()
  }

  // Mirror wave visualization (inspired by the AM album cover)
  const drawMirrorWave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    // Apply trail effect
    ctx.fillStyle = "rgba(0, 0, 0, " + (1 - trailEffect) + ")"
    ctx.fillRect(0, 0, width, height)

    const centerY = height / 2

    // Draw the waveform
    ctx.beginPath()
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2

    // Use a subset of the frequency data for a cleaner wave
    const startIdx = Math.floor(dataArrayRef.current.length * 0.1)
    const endIdx = Math.floor(dataArrayRef.current.length * 0.3)
    const dataPoints = endIdx - startIdx

    const sliceWidth = width / dataPoints
    let x = 0

    // Draw the top wave
    for (let i = startIdx; i < endIdx; i++) {
      const normalized = (dataArrayRef.current[i] / 255) * sensitivity
      const y = centerY - normalized * (height / 4)

      if (i === startIdx) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    // Mirror and draw the bottom wave (in reverse)
    x -= sliceWidth // Move back one step

    for (let i = endIdx - 1; i >= startIdx; i--) {
      const normalized = (dataArrayRef.current[i] / 255) * sensitivity
      const y = centerY + normalized * (height / 4)

      ctx.lineTo(x, y)
      x -= sliceWidth
    }

    // Close the path to create a solid shape
    ctx.closePath()

    // Fill with a subtle gradient
    if (colorScheme === "monochrome") {
      ctx.strokeStyle = "#ffffff"
      ctx.stroke()
    } else {
      const gradient = ctx.createLinearGradient(0, centerY - height / 4, 0, centerY + height / 4)
      if (colorScheme === "gradient-purple") {
        gradient.addColorStop(0, "rgba(147, 51, 234, 0.7)")
        gradient.addColorStop(1, "rgba(76, 29, 149, 0.7)")
      } else if (colorScheme === "gradient-blue") {
        gradient.addColorStop(0, "rgba(37, 99, 235, 0.7)")
        gradient.addColorStop(1, "rgba(30, 64, 175, 0.7)")
      } else if (colorScheme === "gradient-green") {
        gradient.addColorStop(0, "rgba(16, 185, 129, 0.7)")
        gradient.addColorStop(1, "rgba(4, 120, 87, 0.7)")
      } else if (colorScheme === "gradient-red") {
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.7)")
        gradient.addColorStop(1, "rgba(185, 28, 28, 0.7)")
      }
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.stroke()
    }
  }

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Set canvas dimensions to match its display size
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const width = canvas.width
    const height = canvas.height

    // Clear canvas (only fully clear for non-trail visualizations)
    if (visualizerType !== "arcticWave" && visualizerType !== "pulseWave" && visualizerType !== "mirrorWave") {
      ctx.clearRect(0, 0, width, height)
    }

    // Draw based on selected visualizer type
    if (visualizerType === "waveform") {
      drawWaveform(ctx, width, height)
    } else if (visualizerType === "bars") {
      drawBars(ctx, width, height)
    } else if (visualizerType === "circular") {
      drawCircular(ctx, width, height)
    } else if (visualizerType === "arcticWave") {
      drawArcticWave(ctx, width, height)
    } else if (visualizerType === "pulseWave") {
      drawPulseWave(ctx, width, height)
    } else if (visualizerType === "mirrorWave") {
      drawMirrorWave(ctx, width, height)
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(draw)
  }

  return (
    <div className="flex flex-col items-center space-y-6 font-['Quicksand',_sans-serif]">
      <div className="flex flex-wrap items-center justify-between w-full gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="gap-2"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>

          <Select value={visualizerType} onValueChange={(value) => setVisualizerType(value as VisualizerType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Visualizer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arcticWave">
                <div className="flex items-center gap-2">
                  <Waveform size={16} />
                  <span>Arctic Wave</span>
                </div>
              </SelectItem>
              <SelectItem value="pulseWave">
                <div className="flex items-center gap-2">
                  <Waves size={16} />
                  <span>Pulse Wave</span>
                </div>
              </SelectItem>
              <SelectItem value="mirrorWave">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 12h18M7 8c1.5 0 3 4 3 4s1.5 4 3 4 3-4 3-4 1.5-4 3-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Mirror Wave</span>
                </div>
              </SelectItem>
              <SelectItem value="waveform">
                <div className="flex items-center gap-2">
                  <Waveform size={16} />
                  <span>Classic Wave</span>
                </div>
              </SelectItem>
              <SelectItem value="bars">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  <span>Frequency Bars</span>
                </div>
              </SelectItem>
              <SelectItem value="circular">
                <div className="flex items-center gap-2">
                  <Circle size={16} />
                  <span>Circular</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h3 className="font-medium">Settings</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="sensitivity" className="text-sm">
                    Sensitivity: {sensitivity.toFixed(1)}
                  </label>
                </div>
                <Slider
                  id="sensitivity"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={[sensitivity]}
                  onValueChange={(value) => setSensitivity(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="trail" className="text-sm">
                    Trail Effect: {(trailEffect * 100).toFixed(0)}%
                  </label>
                </div>
                <Slider
                  id="trail"
                  min={0}
                  max={0.95}
                  step={0.05}
                  value={[trailEffect]}
                  onValueChange={(value) => setTrailEffect(value[0])}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Color Scheme</label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monochrome">Monochrome (AM Style)</SelectItem>
                    <SelectItem value="gradient-purple">Purple Gradient</SelectItem>
                    <SelectItem value="gradient-blue">Blue Gradient</SelectItem>
                    <SelectItem value="gradient-green">Green Gradient</SelectItem>
                    <SelectItem value="gradient-red">Red Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setLandscapeMode(!landscapeMode)}
          className="relative"
          aria-label="Toggle landscape mode"
        >
          <span className={`transform transition-transform ${landscapeMode ? "rotate-90" : "rotate-0"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 8 20 0" />
            </svg>
          </span>
        </Button>
      </div>
      <div
        className={`w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 transition-all duration-300 ${
          landscapeMode ? "transform rotate-90 h-[80vw] -mx-[calc(40vw-40%)]" : ""
        }`}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {landscapeMode && (
        <p className="text-center text-sm text-gray-400 mt-4 italic">
          Rotate your device for the best landscape experience
        </p>
      )}
    </div>
  )
}
