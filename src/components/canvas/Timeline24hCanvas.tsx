import React, { useEffect, useRef, useState } from 'react'
import { ROLE_THEMES, DESIGN_TOKENS } from '../../constants/themeColors'

export interface TimelineSession {
  id?: string
  taskName: string
  role: string
  startSeconds: number // Seconds from 00:00:00 (0..86400)
  durationSeconds: number
  isLive?: boolean
}

interface Timeline24hCanvasProps {
  sessions?: TimelineSession[]
  height?: number
}

interface HoverState {
  x: number
  y: number
  session: TimelineSession
}

export const Timeline24hCanvas: React.FC<Timeline24hCanvasProps> = ({
  sessions = [],
  height = 100,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const [canvasWidth, setCanvasWidth] = useState<number>(600)

  // Track container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const hasLiveSession = sessions.some((s) => s.isLive)

  // Render High-DPI canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let startTime = performance.now()

    const render = (time: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = canvasWidth
      const h = height

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, w, h)

      const padding = { left: 24, right: 24, top: 12, bottom: 28 }
      const usableWidth = w - padding.left - padding.right
      const barY = padding.top
      const barHeight = h - padding.top - padding.bottom
      const barRadius = 6

      // 1. Background Track
      ctx.beginPath()
      if (typeof (ctx as any).roundRect === 'function') {
        ;(ctx as any).roundRect(padding.left, barY, usableWidth, barHeight, barRadius)
      } else {
        ctx.rect(padding.left, barY, usableWidth, barHeight)
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
      ctx.fill()
      ctx.strokeStyle = DESIGN_TOKENS.borderColor
      ctx.lineWidth = 1
      ctx.stroke()

      // 2. Hour Grid lines and Labels (00:00, 04:00, 08:00, 12:00, 16:00, 20:00, 24:00)
      const hours = [0, 4, 8, 12, 16, 20, 24]
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.font = `500 10px ${DESIGN_TOKENS.fontMono}`

      hours.forEach((hour) => {
        const x = padding.left + (hour / 24) * usableWidth
        // Grid tick
        ctx.beginPath()
        ctx.moveTo(x, barY + barHeight)
        ctx.lineTo(x, barY + barHeight + 4)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Time label
        ctx.fillStyle = DESIGN_TOKENS.textMuted
        const hourStr = `${hour.toString().padStart(2, '0')}:00`
        ctx.fillText(hourStr, x, barY + barHeight + 7)
      })

      // 3. Render Session Blocks
      sessions.forEach((s) => {
        const startFrac = Math.max(0, Math.min(1, s.startSeconds / 86400))
        const endFrac = Math.max(0, Math.min(1, (s.startSeconds + s.durationSeconds) / 86400))
        const sessionX = padding.left + startFrac * usableWidth
        const sessionW = Math.max(4, (endFrac - startFrac) * usableWidth)

        const theme = ROLE_THEMES[s.role] || ROLE_THEMES.work
        const isHovered = hover && hover.session.id === s.id

        ctx.save()
        ctx.beginPath()
        if (typeof (ctx as any).roundRect === 'function') {
          ;(ctx as any).roundRect(sessionX, barY + 2, sessionW, barHeight - 4, 4)
        } else {
          ctx.rect(sessionX, barY + 2, sessionW, barHeight - 4)
        }

        if (s.isLive) {
          // Live pulse animation
          const pulseBlur = 8 + Math.sin((time - startTime) / 200) * 5
          ctx.fillStyle = theme.primary
          ctx.shadowColor = theme.primary
          ctx.shadowBlur = pulseBlur
        } else {
          ctx.fillStyle = theme.primary
          ctx.shadowColor = theme.glow
          ctx.shadowBlur = isHovered ? 12 : 4
        }

        ctx.fill()

        // Inner text if width > 45px
        if (sessionW > 45) {
          ctx.save()
          ctx.beginPath()
          ctx.rect(sessionX, barY, sessionW, barHeight)
          ctx.clip()
          ctx.fillStyle = '#0B0F17'
          ctx.font = `700 10px ${DESIGN_TOKENS.fontMain}`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(s.taskName, sessionX + 6, barY + barHeight / 2)
          ctx.restore()
        }
        ctx.restore()
      })

      // 4. Current Time Marker
      const now = new Date()
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      const nowX = padding.left + (currentSeconds / 86400) * usableWidth

      ctx.save()
      // Vertical line
      ctx.beginPath()
      ctx.moveTo(nowX, barY - 4)
      ctx.lineTo(nowX, barY + barHeight + 4)
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1.5
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
      ctx.shadowBlur = 6
      ctx.stroke()

      // Glowing head dot
      ctx.beginPath()
      ctx.arc(nowX, barY - 4, 3.5, 0, 2 * Math.PI)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.restore()

      ctx.restore()

      if (hasLiveSession) {
        animFrameRef.current = requestAnimationFrame(render)
      }
    }

    render(performance.now())

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [sessions, canvasWidth, height, hover, hasLiveSession])

  // Mouse Move listener for interactive tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const padding = { left: 24, right: 24, top: 12, bottom: 28 }
    const usableWidth = canvasWidth - padding.left - padding.right
    const barY = padding.top
    const barHeight = height - padding.top - padding.bottom

    if (mouseY >= barY && mouseY <= barY + barHeight) {
      const match = sessions.find((s) => {
        const startFrac = s.startSeconds / 86400
        const endFrac = (s.startSeconds + s.durationSeconds) / 86400
        const sessionX = padding.left + startFrac * usableWidth
        const sessionW = Math.max(4, (endFrac - startFrac) * usableWidth)
        return mouseX >= sessionX && mouseX <= sessionX + sessionW
      })

      if (match) {
        setHover({ x: mouseX, y: mouseY, session: match })
        return
      }
    }
    setHover(null)
  }

  const formatSecondsToTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600) % 24
    const m = Math.floor((totalSecs % 3600) / 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', cursor: hover ? 'pointer' : 'default' }}
      />
      {hover && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hover.x + 12, canvasWidth - 180),
            top: hover.y - 54,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${ROLE_THEMES[hover.session.role]?.primary || DESIGN_TOKENS.borderColor}`,
            borderRadius: 8,
            padding: '6px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: DESIGN_TOKENS.textPrimary }}>
            {hover.session.taskName} {hover.session.isLive ? '● (В процессе)' : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: DESIGN_TOKENS.textSecondary, marginTop: 2 }}>
            <span style={{ color: ROLE_THEMES[hover.session.role]?.primary, fontWeight: 600 }}>
              {ROLE_THEMES[hover.session.role]?.label || hover.session.role}
            </span>{' '}
            • {formatSecondsToTime(hover.session.startSeconds)} –{' '}
            {formatSecondsToTime(hover.session.startSeconds + hover.session.durationSeconds)} (
            {Math.round(hover.session.durationSeconds / 60)} мин)
          </div>
        </div>
      )}
    </div>
  )
}
