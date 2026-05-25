import { useEffect, useState, useRef } from 'react'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import AvTimerOutlinedIcon from '@mui/icons-material/AvTimerOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import { api, RunningTask, TaskResult } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'

type SequenceMode = 'none' | 'percent' | 'backlog'

interface NextTaskInfo {
  taskName: string
  role: string
  targetDuration: number
  sourceDay?: string
  percent?: number
}

export default function Timer() {
  const [runningTask, setRunningTask] = useState<RunningTask | null>(null)
  const [taskName, setTaskName] = useState('')
  const [role, setRole] = useState('work')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [availableTasks, setAvailableTasks] = useState<TaskResult[]>([])

  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('none')
  const [nextTaskInfo, setNextTaskInfo] = useState<NextTaskInfo | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    // A simple browser beep via Audio API or base64 data URI wouldn't hurt.
    // We'll just define a base64 inline short pop/chime sound to avoid missing assets.
    const snd = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq')
    // Fallback if empty - we just rely on browser or it won't play. We'll add a proper beep using AudioContext later or try this.
    audioRef.current = snd
  }, [])

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 800
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch(e) { console.error('Audio failed', e) }
  }

  // Load available tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasks = await api.getTaskList()
        setAvailableTasks(tasks)
      } catch (e) {
        console.error("Failed to load tasks", e)
      }
    }
    loadTasks()
  }, [])

  // Timer tick
  useEffect(() => {
    let interval: number | undefined
    if (runningTask && runningTask.is_running) {
      interval = window.setInterval(() => {
        const start = new Date(runningTask.start_time).getTime()
        const now = new Date().getTime()
        const currentSessionSeconds = Math.floor((now - start) / 1000)
        setElapsed(runningTask.accumulated * 60 + currentSessionSeconds)
      }, 1000)
    } else if (runningTask && !runningTask.is_running) {
      setElapsed(runningTask.accumulated * 60)
    } else {
      setElapsed(0)
    }
    return () => window.clearInterval(interval)
  }, [runningTask])

  // Auto-stop monitor
  useEffect(() => {
    if (runningTask && runningTask.is_running && runningTask.target_duration && runningTask.target_duration > 0) {
      if (elapsed >= runningTask.target_duration * 60) {
        // Target reached!
        handleStop(true)
      }
    }
  }, [elapsed, runningTask])

  const loadStatus = async () => {
    setError(null)
    try {
      const r = await api.getTaskStatus()
      if (r.data && r.data.task_name) {
        setRunningTask(r.data)
      } else {
        setRunningTask(null)
      }
    } catch (e: any) {
      setRunningTask(null)
    }
  }

  useEffect(() => { loadStatus() }, [])

  const handleStart = async (e?: React.FormEvent, forceTaskInfo?: NextTaskInfo) => {
    if (e) e.preventDefault()
    setMsg(null); setError(null)
    
    let tName = forceTaskInfo ? forceTaskInfo.taskName : taskName
    let tRole = forceTaskInfo ? forceTaskInfo.role : role
    let tTarget = forceTaskInfo ? forceTaskInfo.targetDuration : undefined
    let tSource = forceTaskInfo ? forceTaskInfo.sourceDay : undefined

    if (!tName.trim()) { setError('Task name is required'); return }
    
    try {
      const r = await api.startTask({ 
        task_name: tName, 
        role: tRole,
        target_duration: tTarget,
        source_day: tSource
      })
      setRunningTask(r.data)
      setTaskName('')
      setNextTaskInfo(null)
    } catch (e: any) { setError(e.message) }
  }

  const handleStop = async (autoBlocked: boolean = false) => {
    setMsg(null); setError(null)
    try {
      await api.stopTask()
      setRunningTask(null)
      setElapsed(0)
      if (autoBlocked) {
        playBeep()
        setMsg('Timer finished and saved!')
        if (sequenceMode !== 'none') {
          fetchNextSequenceTask()
        }
      } else {
        setMsg('Task stopped and saved')
      }
    } catch (e: any) { setError(e.message) }
  }

  const handlePause = async () => {
    setError(null)
    try {
      const r = await api.pauseTask()
      setRunningTask(r.data)
    } catch (e: any) { setError(e.message) }
  }

  const handleResume = async () => {
    setError(null)
    try {
      const r = await api.resumeTask()
      setRunningTask(r.data)
    } catch (e: any) { setError(e.message) }
  }

  const fetchNextSequenceTask = async () => {
    setMsg(null); setError(null)
    try {
      let tName = ''
      let sourceDay = ''
      let targetDuration = 0
      let tRole = 'work'

      if (sequenceMode === 'percent') {
        const r = await api.getTaskPlanPercentWithSchedule()
        if (!r) throw new Error("No tasks available in plan percent")
        tName = r.task_name
        sourceDay = r.source_day || ''
        
        const taskDef = availableTasks.find(t => t.name === tName)
        tRole = taskDef?.role || 'work'
        
        let timeLeft = r.time_left
        let defDur = taskDef?.time_duration || 25
        targetDuration = (timeLeft > 0 && timeLeft < defDur) ? timeLeft : defDur

      } else if (sequenceMode === 'backlog') {
        const r = await api.getRolloverTasks()
        if (!r.data || !r.data.rollover_tasks || r.data.rollover_tasks.length === 0) {
            throw new Error("No backlog tasks found or all completed")
        }
        const tasks = r.data.rollover_tasks.filter((t: any) => t.remaining_time > 0)
        if (tasks.length === 0) throw new Error("All backlog tasks completed")
        
        const first = tasks[0]
        tName = first.task_name
        tRole = first.role || 'work'
        sourceDay = first.source_day || ''
        
        const taskDef = availableTasks.find(t => t.name === tName)
        let defDur = taskDef?.time_duration || 25
        targetDuration = (first.remaining_time > 0 && first.remaining_time < defDur) ? first.remaining_time : defDur
      }

      setNextTaskInfo({
        taskName: tName,
        role: tRole,
        targetDuration,
        sourceDay
      })
      setMsg(`Next task fetched: ${tName} (${targetDuration} min). Click start when ready.`)

    } catch (e: any) {
        setError(e.message)
        setSequenceMode('none')
    }
  }

  // Fetch sequence when mode changes to something active
  useEffect(() => {
    if (sequenceMode !== 'none' && !runningTask && !nextTaskInfo) {
        fetchNextSequenceTask()
    }
    if (sequenceMode === 'none') {
        setNextTaskInfo(null)
    }
  }, [sequenceMode])

  const formatTime = (totalSeconds: number) => {
    const sign = totalSeconds < 0 ? '-' : ''
    const abs = Math.abs(totalSeconds)
    const h = Math.floor(abs / 3600)
    const m = Math.floor((abs % 3600) / 60)
    const s = abs % 60
    return `${sign}${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const isRunning = runningTask !== null

  let displayTimeStr = formatTime(elapsed)
  // Target duration formatting
  if (runningTask && runningTask.target_duration && runningTask.target_duration > 0) {
      const remainingSeconds = runningTask.target_duration * 60 - elapsed
      displayTimeStr = formatTime(remainingSeconds)
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card title="Running Task" subtitle="Track your time" icon={<AvTimerOutlinedIcon />}>
            <Stack direction="row" justifyContent="flex-end" mb={2}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sequence Mode</InputLabel>
                <Select
                  label="Sequence Mode"
                  value={sequenceMode}
                  onChange={(e) => setSequenceMode(e.target.value as SequenceMode)}
                >
                  <MenuItem value="none">Manual Focus</MenuItem>
                  <MenuItem value="percent">Gamified Plan (Percent)</MenuItem>
                  <MenuItem value="backlog">Gamified Backlog</MenuItem>
                </Select>
              </FormControl>
            </Stack>

          {error && <Alert type="error">{error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}

          <Stack spacing={4} alignItems="center">
            {/* Timer Display */}
            <Typography variant="h1" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '6rem', color: displayTimeStr.startsWith('-') ? 'error.main' : 'inherit' }}>
              {displayTimeStr}
            </Typography>

            {isRunning ? (
              <Stack spacing={2} width="100%" alignItems="center">
                <Typography variant="h5" color="text.secondary">
                  {runningTask.task_name} <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>({runningTask.role})</Typography>
                  {runningTask.source_day && <Typography component="span" variant="body2" color="secondary"> [Rollover: {runningTask.source_day}]</Typography>}
                </Typography>

                <Stack direction="row" spacing={2}>
                  {runningTask.is_running ? (
                    <Button variant="outlined" color="warning" size="large" onClick={handlePause} startIcon={<PauseRoundedIcon />}>
                      Pause
                    </Button>
                  ) : (
                    <Button variant="contained" color="success" size="large" onClick={handleResume} startIcon={<PlayArrowRoundedIcon />}>
                      Resume
                    </Button>
                  )}
                  <Button variant="contained" color="error" size="large" onClick={() => handleStop(false)} startIcon={<StopRoundedIcon />}>
                    Stop
                  </Button>
                </Stack>
              </Stack>
            ) : nextTaskInfo && sequenceMode !== 'none' ? (
                <Stack spacing={2} width="100%" alignItems="center">
                    <Typography variant="h5" color="primary">
                        Next Sequence Task: {nextTaskInfo.taskName} 
                        <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                            ({nextTaskInfo.targetDuration} min)
                        </Typography>
                        {nextTaskInfo.sourceDay && <Typography component="span" variant="body2" color="secondary" sx={{ ml: 1 }}>[From: {nextTaskInfo.sourceDay}]</Typography>}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button variant="contained" size="large" onClick={() => handleStart(undefined, nextTaskInfo)} startIcon={<PlayArrowRoundedIcon />}>
                            Start Gamified Task
                        </Button>
                        <Button variant="outlined" size="large" color="secondary" onClick={fetchNextSequenceTask} startIcon={<SkipNextRoundedIcon />}>
                            Skip to Next
                        </Button>
                    </Stack>
                </Stack>
            ) : (
              <Stack component="form" onSubmit={handleStart} spacing={2} width="100%" direction={{ xs: 'column', sm: 'row' }}>
                <Autocomplete
                  options={availableTasks.map(t => t.name)}
                  value={taskName}
                  onChange={(_, newValue) => {
                      setTaskName(newValue || '')
                      const f = availableTasks.find(t=>t.name===newValue)
                      if(f) setRole(f.role)
                  }}
                  freeSolo={false}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Task Name"
                      required
                    />
                  )}
                />
                <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 120 }}>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="learn">Learn</MenuItem>
                  <MenuItem value="rest">Rest</MenuItem>
                </TextField>
                <Button variant="contained" type="submit" size="large" startIcon={<PlayArrowRoundedIcon />}>
                  Start
                </Button>
              </Stack>
            )}

          </Stack>
        </Card>
      </Grid>
    </Grid>
  )
}
