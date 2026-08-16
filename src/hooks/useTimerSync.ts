import { useEffect, useRef, useState, useCallback } from 'react'
import { api, RunningTask, getTimerWebSocketUrl } from '../api/client'

export interface TimerEvent {
  type: 'TASK_STARTED' | 'TASK_PAUSED' | 'TASK_RESUMED' | 'TASK_STOPPED' | 'HEARTBEAT_ACK' | 'STATE_SYNC'
  task_name?: string
  role?: string
  duration?: number
  reason?: string
  server_time: number
  data?: any
}

export function useTimerSync(onServerAutoStop?: (taskName: string, reason?: string) => void) {
  const [runningTasks, setRunningTasks] = useState<RunningTask[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [serverTimeOffset, setServerTimeOffset] = useState(0) // serverTime - localTime

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const runningTasksRef = useRef<RunningTask[]>([])
  runningTasksRef.current = runningTasks

  const onServerAutoStopRef = useRef(onServerAutoStop)
  onServerAutoStopRef.current = onServerAutoStop

  // Manual fallback fetch
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.getRunningTasks()
      setRunningTasks(res.data || [])
    } catch (e) {
      console.error('Failed to fetch running tasks via HTTP fallback', e)
    }
  }, [])

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false

    const connect = () => {
      if (unmounted) return

      try {
        const wsUrl = getTimerWebSocketUrl()
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (unmounted) {
            ws.close()
            return
          }
          setIsConnected(true)
          reconnectAttemptsRef.current = 0
          console.log('⚡ Timer WebSocket connected to', wsUrl)
        }

        ws.onmessage = (event) => {
          try {
            const data: TimerEvent = JSON.parse(event.data)
            if (data.server_time) {
              setServerTimeOffset(data.server_time - Date.now())
            }

            switch (data.type) {
              case 'STATE_SYNC':
                if (Array.isArray(data.data)) {
                  setRunningTasks(data.data)
                }
                break

              case 'TASK_STARTED':
              case 'TASK_RESUMED':
                if (data.data && data.data.task_name) {
                  setRunningTasks((prev) => [
                    ...prev.filter((t) => t.task_name !== data.data.task_name),
                    data.data,
                  ])
                }
                break

              case 'TASK_PAUSED':
                if (data.data && data.data.task_name) {
                  setRunningTasks((prev) =>
                    prev.map((t) => (t.task_name === data.data.task_name ? data.data : t))
                  )
                }
                break

              case 'TASK_STOPPED':
                if (data.task_name) {
                  setRunningTasks((prev) => prev.filter((t) => t.task_name !== data.task_name))
                  if (data.reason && data.reason !== 'manual') {
                    onServerAutoStopRef.current?.(data.task_name, data.reason)
                  }
                }
                break

              case 'HEARTBEAT_ACK':
                if (data.data && data.data.task_name) {
                  setRunningTasks((prev) =>
                    prev.map((t) => (t.task_name === data.data.task_name ? data.data : t))
                  )
                }
                break
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message', err)
          }
        }

        ws.onerror = (err) => {
          console.warn('Timer WebSocket encountered error', err)
        }

        ws.onclose = () => {
          setIsConnected(false)
          wsRef.current = null
          if (!unmounted) {
            // Exponential backoff reconnect
            const delay = Math.min(10000, 1000 * Math.pow(1.5, reconnectAttemptsRef.current))
            reconnectAttemptsRef.current += 1
            reconnectTimeoutRef.current = window.setTimeout(connect, delay)
          }
        }
      } catch (err) {
        console.warn('Failed to initiate WebSocket connection, falling back to HTTP', err)
        setIsConnected(false)
        if (!unmounted) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 5000)
        }
      }
    }

    // Initial fetch to have data instantly
    fetchStatus()
    connect()

    return () => {
      unmounted = true
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [fetchStatus])

  // Periodic heartbeat every 25 seconds for active running tasks
  useEffect(() => {
    const interval = window.setInterval(() => {
      const active = runningTasksRef.current.find((t) => t.is_running)
      if (active) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'heartbeat', task_name: active.task_name }))
        } else {
          // HTTP fallback heartbeat
          api.sendHeartbeat(active.task_name).catch((e) => console.warn('Heartbeat HTTP fallback failed', e))
        }
      }
    }, 25000)

    return () => window.clearInterval(interval)
  }, [])

  // Re-sync on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus()
        const active = runningTasksRef.current.find((t) => t.is_running)
        if (active && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'heartbeat', task_name: active.task_name }))
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchStatus])

  return {
    runningTasks,
    setRunningTasks,
    isConnected,
    serverTimeOffset,
    refreshStatus: fetchStatus,
  }
}
