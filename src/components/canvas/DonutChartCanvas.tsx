import React, { useEffect, useRef } from 'react'
import { ROLE_THEMES, DESIGN_TOKENS } from '../../constants/themeColors'

export interface DonutSegment {
  role: string
  minutes: number
  label?: string
}

interface DonutChartCanvasProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
}

export const DonutChartCanvas: React.FC<DonutChartCanvasProps> = ({
  segments,
  size = 180,
  thickness = 14,
  centerLabel = 'Всего мин',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const totalMinutes = segments.reduce((sum, s) => sum + s.minutes, 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const center = size / 2
    const radius = center - thickness

    // If no data, render subtle track
    if (totalMinutes === 0) {
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = thickness
      ctx.stroke()
      ctx.restore()
      return
    }

    let startAngle = -Math.PI / 2
    const gapAngle = segments.filter((s) => s.minutes > 0).length > 1 ? 0.04 : 0

    segments.forEach((seg) => {
      if (seg.minutes <= 0) return

      const sliceAngle = (seg.minutes / totalMinutes) * (2 * Math.PI)
      const endAngle = startAngle + sliceAngle - gapAngle

      const theme = ROLE_THEMES[seg.role] || ROLE_THEMES.other

      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, radius, startAngle, endAngle, false)
      ctx.strokeStyle = theme.primary
      ctx.lineWidth = thickness
      ctx.lineCap = 'round'
      ctx.shadowColor = theme.glow
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.restore()

      startAngle += sliceAngle
    })

    ctx.restore()
  }, [segments, size, thickness, totalMinutes])

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
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: DESIGN_TOKENS.fontMono,
            fontSize: size > 160 ? '1.8rem' : '1.4rem',
            fontWeight: 700,
            color: DESIGN_TOKENS.textPrimary,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {totalMinutes}
        </div>
        <div
          style={{
            fontFamily: DESIGN_TOKENS.fontMain,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: DESIGN_TOKENS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: 2,
          }}
        >
          {centerLabel}
        </div>
      </div>
    </div>
  )
}
