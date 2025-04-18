"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Mic, MicOff, Settings, AudioWaveformIcon as Waveform, BarChart3, Circle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PlayButton } from "./play-button"

type VisualizerType = "waveform" | "bars" | "circular"

export default function AudioVisualizer() {
  const [isListening, setIsListening] = useState(false)
  const [sensitivity, setSensitivity] = useState(1.5)
  const [visualizerType, setVisualizerType] = useState<VisualizerType>("waveform")
  const [colorScheme, setColorScheme] = useState("gradient-purple")
  const [audioPermissionGranted, setAudioPermissionGranted] = useState<boolean | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number>(0)
  const dataArrayRef = useRef<Uint8Array | null>(null)

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
      setAudioPermissionGranted(true)

      // Initialize audio context if not already done
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
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

      setIsListening(true)
      draw()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setAudioPermissionGranted(false)
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

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw based on selected visualizer type
    if (visualizerType === "waveform") {
      drawWaveform(ctx, width, height)
    } else if (visualizerType === "bars") {
      drawBars(ctx, width, height)
    } else if (visualizerType === "circular") {
      drawCircular(ctx, width, height)
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(draw)
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative">
        <canvas ref={canvasRef} className="w-full h-full" />

        {!isListening && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center text-center w-full">
              <PlayButton isPlaying={isListening} onToggle={toggleListening} size="lg" />
              <p className="text-white mt-4 font-medium">Click to start audio visualization</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between w-full gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="gap-2 px-6 py-6 text-lg font-medium"
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>

          <Select value={visualizerType} onValueChange={(value) => setVisualizerType(value as VisualizerType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Visualizer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="waveform">
                <div className="flex items-center gap-2">
                  <Waveform size={16} />
                  <span>Waveform</span>
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
                <label className="text-sm">Color Scheme</label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
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
      </div>
    </div>
  )
}
