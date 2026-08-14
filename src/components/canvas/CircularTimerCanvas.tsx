import React, { useEffect, useRef } from 'react'
import { ROLE_THEMES, DESIGN_TOKENS } from '../../constants/themeColors'

interface CircularTimerCanvasProps {
  elapsedSeconds: number
  targetSeconds?: number
  isRunning: boolean
  role?: string
  taskName?: string
  size?: number
}

export const CircularTimerCanvas: React.FC<CircularTimerCanvasProps> = ({
  elapsedSeconds,
  targetSeconds = 0,
  isRunning,
  role = 'work',
  taskName = '',
  size = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const theme = ROLE_THEMES[role] || ROLE_THEMES.work

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let startTime = performance.now()

    const render = (now: number) => {
      const dpr = window.devicePixelRatio || 1
      const displaySize = size
      canvas.width = displaySize * dpr
      canvas.height = displaySize * dpr
      canvas.style.width = `${displaySize}px`
      canvas.style.height = `${displaySize}px`

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, displaySize, displaySize)

      const center = displaySize / 2
      const radius = center - 24
      const strokeWidth = 8

      // 1. Draw 60 radial tick marks
      const totalTicks = 60
      for (let i = 0; i < totalTicks; i++) {
        const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2
        const is5Min = i % 5 === 0
        const tickLength = is5Min ? 8 : 4
        const innerR = radius - 14 - tickLength
        const outerR = radius - 14

        const x1 = center + Math.cos(angle) * innerR
        const y1 = center + Math.sin(angle) * innerR
        const x2 = center + Math.cos(angle) * outerR
        const y2 = center + Math.sin(angle) * outerR

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = is5Min ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.07)'
        ctx.lineWidth = is5Min ? 1.5 : 1
        ctx.stroke()
      }

      // 2. Base track (faded background circle)
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.stroke()

      // 3. Calculate progress angle
      let progress = 0
      if (targetSeconds > 0) {
        progress = Math.min(elapsedSeconds / targetSeconds, 1)
      } else {
        // Continuous rotation for stopwatch mode (repeats every 60 seconds)
        progress = (elapsedSeconds % 60) / 60
      }

      const startAngle = -Math.PI / 2
      const currentAngle = startAngle + progress * 2 * Math.PI

      // 4. Conic gradient progress arc
      if (progress > 0.005) {
        ctx.save()
        // Ambient background glow underneath active arc
        if (isRunning) {
          const pulseGlow = 14 + Math.sin((now - startTime) / 250) * 4
          ctx.shadowColor = theme.glow
          ctx.shadowBlur = pulseGlow
        }

        ctx.beginPath()
        ctx.arc(center, center, radius, startAngle, currentAngle, false)

        try {
          const conic = ctx.createConicGradient(startAngle, center, center)
          conic.addColorStop(0, theme.primary)
          conic.addColorStop(Math.min(1, Math.max(0.1, progress)), theme.light)
          ctx.strokeStyle = conic
        } catch {
          ctx.strokeStyle = theme.primary
        }

        ctx.lineWidth = strokeWidth
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()

        // 5. Glowing Tip Dot indicator
        const dotX = center + Math.cos(currentAngle) * radius
        const dotY = center + Math.sin(currentAngle) * radius

        ctx.save()
        const dotPulse = isRunning ? 12 + Math.sin((now - startTime) / 200) * 4 : 8
        ctx.shadowColor = theme.primary
        ctx.shadowBlur = dotPulse

        ctx.beginPath()
        ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.restore()
      }

      ctx.restore()

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(render)
      }
    }

    render(performance.now())

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [elapsedSeconds, targetSeconds, isRunning, role, size, theme])

  // Format time display
  const formatTime = (totalSecs: number) => {
    const isNeg = totalSecs < 0
    const abs = Math.abs(totalSecs)
    const h = Math.floor(abs / 3600)
    const m = Math.floor((abs % 3600) / 60)
    const s = abs % 60
    return `${isNeg ? '-' : ''}${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  let displayStr = formatTime(elapsedSeconds)
  let subLabel = 'Прошло'
  if (targetSeconds > 0) {
    const remaining = targetSeconds - elapsedSeconds
    displayStr = formatTime(remaining)
    subLabel = remaining < 0 ? 'Сверхурочно' : 'Осталось'
  }

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          padding: '0 20px',
        }}
      >
        {taskName && (
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: DESIGN_TOKENS.textSecondary,
              maxWidth: size - 80,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 4,
              letterSpacing: '0.02em',
            }}
          >
            {taskName}
          </div>
        )}
        <div
          style={{
            fontFamily: DESIGN_TOKENS.fontMono,
            fontSize: size > 240 ? '2.4rem' : '1.9rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: displayStr.startsWith('-') ? '#EF4444' : DESIGN_TOKENS.textPrimary,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: isRunning ? `0 0 20px ${theme.glow}` : 'none',
          }}
        >
          {displayStr}
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: isRunning ? theme.light : DESIGN_TOKENS.textMuted,
            marginTop: 4,
          }}
        >
          {isRunning ? `● ${subLabel}` : 'Пауза'}
        </div>
      </div>
    </div>
  )
}
