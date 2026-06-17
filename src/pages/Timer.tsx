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
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
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

interface TaskTimerItemProps {
  task: RunningTask
  onStop: (taskName: string, autoBlocked?: boolean) => void
  onPause: (taskName: string) => void
  onResume: (taskName: string) => void
}

function TaskTimerItem({ task, onStop, onPause, onResume }: TaskTimerItemProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let interval: number | undefined
    if (task.is_running) {
      const update = () => {
        const start = new Date(task.start_time).getTime()
        const now = new Date().getTime()
        const currentSessionSeconds = Math.floor((now - start) / 1000)
        setElapsed(task.accumulated * 60 + currentSessionSeconds)
      }
      update()
      interval = window.setInterval(update, 1000)
    } else {
      setElapsed(task.accumulated * 60)
    }
    return () => window.clearInterval(interval)
  }, [task])

  // Auto-stop monitor
  useEffect(() => {
    if (task.is_running && task.target_duration && task.target_duration > 0) {
      if (elapsed >= task.target_duration * 60) {
        onStop(task.task_name, true)
      }
    }
  }, [elapsed, task, onStop])

  const formatTime = (totalSeconds: number) => {
    const sign = totalSeconds < 0 ? '-' : ''
    const abs = Math.abs(totalSeconds)
    const h = Math.floor(abs / 3600)
    const m = Math.floor((abs % 3600) / 60)
    const s = abs % 60
    return `${sign}${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  let displayTimeStr = formatTime(elapsed)
  if (task.target_duration && task.target_duration > 0) {
    const remainingSeconds = task.target_duration * 60 - elapsed
    displayTimeStr = formatTime(remainingSeconds)
  }

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: task.is_running ? 'primary.main' : 'divider',
        backgroundColor: task.is_running ? 'action.hover' : 'background.paper',
        boxShadow: task.is_running ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
          borderColor: task.is_running ? 'primary.main' : 'text.disabled',
        }
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {task.task_name}
            <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
              ({task.role})
            </Typography>
            {task.source_day && (
              <Typography component="span" variant="caption" sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: 'secondary.main', color: 'secondary.contrastText', fontWeight: 'bold' }}>
                Rollover: {task.source_day}
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color={task.is_running ? 'success.main' : 'text.secondary'} sx={{ fontWeight: 'medium', mt: 0.5 }}>
            Status: {task.is_running ? '● Running' : 'Paused'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: 'monospace', 
              fontWeight: 'bold', 
              color: displayTimeStr.startsWith('-') ? 'error.main' : 'inherit',
              minWidth: 100,
              textAlign: 'right',
              mr: 2,
            }}
          >
            {displayTimeStr}
          </Typography>

          <Stack direction="row" spacing={1}>
            {task.is_running ? (
              <Button 
                variant="outlined" 
                color="warning" 
                size="small"
                onClick={() => onPause(task.task_name)} 
                startIcon={<PauseRoundedIcon />}
              >
                Pause
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="success" 
                size="small"
                onClick={() => onResume(task.task_name)} 
                startIcon={<PlayArrowRoundedIcon />}
              >
                Resume
              </Button>
            )}

            <Button 
              variant="contained" 
              color="error" 
              size="small"
              onClick={() => onStop(task.task_name)} 
              startIcon={<StopRoundedIcon />}
            >
              Stop
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default function Timer() {
  const [runningTasks, setRunningTasks] = useState<RunningTask[]>([])
  const [taskName, setTaskName] = useState('')
  const [role, setRole] = useState('work')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableTasks, setAvailableTasks] = useState<TaskResult[]>([])

  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('none')
  const [nextTaskInfo, setNextTaskInfo] = useState<NextTaskInfo | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    const snd = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq')
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

  const loadStatus = async () => {
    setError(null)
    try {
      const r = await api.getRunningTasks()
      if (r.data) {
        setRunningTasks(r.data)
      } else {
        setRunningTasks([])
      }
    } catch (e: any) {
      setRunningTasks([])
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = window.setInterval(loadStatus, 5000)
    return () => window.clearInterval(interval)
  }, [])

  const handleStart = async (e?: React.FormEvent, forceTaskInfo?: NextTaskInfo) => {
    if (e) e.preventDefault()
    setMsg(null); setError(null)
    
    let tName = forceTaskInfo ? forceTaskInfo.taskName : taskName
    let tRole = forceTaskInfo ? forceTaskInfo.role : role
    let tTarget = forceTaskInfo ? forceTaskInfo.targetDuration : undefined
    let tSource = forceTaskInfo ? forceTaskInfo.sourceDay : undefined

    if (!tName.trim()) { setError('Task name is required'); return }
    
    try {
      await api.startTask({ 
        task_name: tName, 
        role: tRole,
        target_duration: tTarget,
        source_day: tSource
      })
      setTaskName('')
      setNextTaskInfo(null)
      loadStatus()
    } catch (e: any) { setError(e.message) }
  }

  const handleStop = async (tName: string, autoBlocked: boolean = false) => {
    setMsg(null); setError(null)
    try {
      await api.stopTask({ task_name: tName })
      loadStatus()
      if (autoBlocked) {
        playBeep()
        setMsg(`Timer finished and saved for '${tName}'!`)
        if (sequenceMode !== 'none') {
          fetchNextSequenceTask()
        }
      } else {
        setMsg(`Task '${tName}' stopped and saved`)
      }
    } catch (e: any) { setError(e.message) }
  }

  const handlePause = async (tName: string) => {
    setError(null)
    try {
      await api.pauseTask({ task_name: tName })
      loadStatus()
    } catch (e: any) { setError(e.message) }
  }

  const handleResume = async (tName: string) => {
    setError(null)
    try {
      await api.resumeTask({ task_name: tName })
      loadStatus()
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
    if (sequenceMode !== 'none' && runningTasks.length === 0 && !nextTaskInfo) {
        fetchNextSequenceTask()
    }
    if (sequenceMode === 'none') {
        setNextTaskInfo(null)
    }
  }, [sequenceMode, runningTasks])

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={9}>
        <Card title="Active Timers" subtitle="Track your active and paused tasks" icon={<AvTimerOutlinedIcon />}>
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

          <Stack spacing={2} sx={{ mb: 4 }}>
            {runningTasks.length > 0 ? (
              runningTasks.map((task) => (
                <TaskTimerItem
                  key={task.task_name}
                  task={task}
                  onStop={handleStop}
                  onPause={handlePause}
                  onResume={handleResume}
                />
              ))
            ) : (
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                No tasks are currently active. Start a task below.
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            Start a Task
          </Typography>

          {nextTaskInfo && sequenceMode !== 'none' ? (
            <Stack spacing={2} width="100%" alignItems="center" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="h6" color="primary" textAlign="center">
                Next Sequence Task: <strong>{nextTaskInfo.taskName}</strong>
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({nextTaskInfo.targetDuration} min)
                </Typography>
                {nextTaskInfo.sourceDay && (
                  <Typography component="span" variant="body2" color="secondary" sx={{ ml: 1 }}>
                    [From: {nextTaskInfo.sourceDay}]
                  </Typography>
                )}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%">
                <Button variant="contained" size="large" fullWidth onClick={() => handleStart(undefined, nextTaskInfo)} startIcon={<PlayArrowRoundedIcon />}>
                  Start Gamified Task
                </Button>
                <Button variant="outlined" size="large" color="secondary" fullWidth onClick={fetchNextSequenceTask} startIcon={<SkipNextRoundedIcon />}>
                  Skip to Next
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack component="form" onSubmit={handleStart} spacing={2} width="100%" direction={{ xs: 'column', sm: 'row' }} alignItems="center">
              <Autocomplete
                options={availableTasks.map(t => t.name)}
                value={taskName}
                onChange={(_, newValue) => {
                    setTaskName(newValue || '')
                    const f = availableTasks.find(t=>t.name===newValue)
                    if(f) setRole(f.role)
                }}
                freeSolo={true}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Task Name"
                    required
                  />
                )}
              />
              <TextField 
                select 
                label="Role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                sx={{ minWidth: 140, width: { xs: '100%', sm: 'auto' } }}
              >
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="learn">Learn</MenuItem>
                <MenuItem value="rest">Rest</MenuItem>
              </TextField>
              <Button 
                variant="contained" 
                type="submit" 
                size="large" 
                startIcon={<PlayArrowRoundedIcon />}
                sx={{ py: 1.8, minWidth: 120, width: { xs: '100%', sm: 'auto' } }}
              >
                Start
              </Button>
            </Stack>
          )}
        </Card>
      </Grid>
    </Grid>
  )
}
