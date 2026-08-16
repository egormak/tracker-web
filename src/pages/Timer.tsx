import { useEffect, useState, useRef, useCallback } from 'react'
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
import Chip from '@mui/material/Chip'
import AvTimerOutlinedIcon from '@mui/icons-material/AvTimerOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'

import { api, RunningTask, TaskResult } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'
import { CircularTimerCanvas } from '../components/canvas/CircularTimerCanvas'
import { soundSynth } from '../utils/audio'
import { useHotkeys } from '../hooks/useHotkeys'
import { useTimerSync } from '../hooks/useTimerSync'
import { ROLE_THEMES, ROLE_TAGS, TIMER_PRESETS, DESIGN_TOKENS } from '../constants/themeColors'

type SequenceMode = 'none' | 'percent' | 'backlog'
type TimerMode = 'pomodoro' | 'free'

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
  onAdjustDuration?: (deltaMin: number) => void
  serverTimeOffset?: number
}

function TaskTimerItem({ task, onStop, onPause, onResume, onAdjustDuration, serverTimeOffset }: TaskTimerItemProps) {
  const [elapsed, setElapsed] = useState(0)
  const autoStoppedRef = useRef(false)

  useEffect(() => {
    let interval: number | undefined
    if (task.is_running) {
      const update = () => {
        const start = new Date(task.start_time).getTime()
        const now = new Date().getTime() + (serverTimeOffset || 0)
        const currentSessionSeconds = Math.max(0, Math.floor((now - start) / 1000))
        setElapsed(task.accumulated * 60 + currentSessionSeconds)
      }
      update()
      interval = window.setInterval(update, 1000)
    } else {
      setElapsed(task.accumulated * 60)
    }
    return () => window.clearInterval(interval)
  }, [task, serverTimeOffset])

  // Reset the auto-stop guard whenever this timer session stops being active
  useEffect(() => {
    if (!task.is_running) autoStoppedRef.current = false
  }, [task.is_running])

  // Auto-stop monitor
  useEffect(() => {
    if (task.is_running && task.target_duration && task.target_duration > 0) {
      if (elapsed >= task.target_duration * 60 && !autoStoppedRef.current) {
        autoStoppedRef.current = true
        onStop(task.task_name, true)
      }
    }
  }, [elapsed, task, onStop])

  const theme = ROLE_THEMES[task.role] || ROLE_THEMES.work
  const targetSeconds = (task.target_duration || 0) * 60

  return (
    <Box
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 3.5,
        border: '1px solid',
        borderColor: task.is_running ? theme.primary : DESIGN_TOKENS.borderColor,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: task.is_running ? `0 16px 40px ${theme.glow}` : '0 10px 30px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
        {/* Circular Canvas Timer */}
        <Box sx={{ flexShrink: 0 }}>
          <CircularTimerCanvas
            elapsedSeconds={elapsed}
            targetSeconds={targetSeconds}
            isRunning={task.is_running}
            role={task.role}
            size={240}
          />
        </Box>

        {/* Task Info & Controls */}
        <Stack spacing={2} sx={{ width: '100%', minWidth: 0, alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, width: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                label={theme.label}
                sx={{
                  bgcolor: theme.badgeBg,
                  color: theme.primary,
                  fontWeight: 700,
                  border: `1px solid ${theme.primary}40`,
                  fontSize: '0.75rem',
                }}
              />
              {task.target_duration ? (
                <Chip
                  size="small"
                  label={`Цель: ${task.target_duration} мин`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    color: DESIGN_TOKENS.textSecondary,
                    fontSize: '0.75rem',
                  }}
                />
              ) : (
                <Chip
                  size="small"
                  label="Свободный фокус"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    color: DESIGN_TOKENS.textSecondary,
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {task.source_day && (
                <Chip
                  size="small"
                  label={`Rollover: ${task.source_day}`}
                  sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: DESIGN_TOKENS.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {task.task_name}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: task.is_running ? theme.light : DESIGN_TOKENS.textMuted,
                fontWeight: 600,
              }}
            >
              {task.is_running ? '● Сессия в процессе' : '⏸ На паузе'}
            </Typography>
          </Box>

          {/* Quick delta buttons (+5m / -5m) */}
          {onAdjustDuration && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                Коррекция времени:
              </Typography>
              <Chip
                size="small"
                icon={<RemoveRoundedIcon fontSize="small" />}
                label="5 мин"
                onClick={() => onAdjustDuration(-5)}
                sx={{ cursor: 'pointer', bgcolor: 'rgba(255, 255, 255, 0.05)', color: DESIGN_TOKENS.textSecondary }}
              />
              <Chip
                size="small"
                icon={<AddRoundedIcon fontSize="small" />}
                label="5 мин"
                onClick={() => onAdjustDuration(5)}
                sx={{ cursor: 'pointer', bgcolor: 'rgba(255, 255, 255, 0.05)', color: DESIGN_TOKENS.textSecondary }}
              />
            </Stack>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ width: '100%', pt: 0.5 }}>
            {task.is_running ? (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onPause(task.task_name)}
                startIcon={<PauseRoundedIcon />}
                sx={{
                  py: 1.2,
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  color: '#FBBF24',
                  '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.1)' },
                }}
              >
                Пауза (Space)
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                onClick={() => onResume(task.task_name)}
                startIcon={<PlayArrowRoundedIcon />}
                sx={{
                  py: 1.2,
                  bgcolor: theme.primary,
                  color: '#0B0F17',
                  boxShadow: `0 4px 16px ${theme.glow}`,
                  '&:hover': { bgcolor: theme.light },
                }}
              >
                Возобновить (Space)
              </Button>
            )}

            <Button
              variant="contained"
              fullWidth
              color="error"
              onClick={() => onStop(task.task_name)}
              startIcon={<StopRoundedIcon />}
              sx={{
                py: 1.2,
                bgcolor: 'rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.3)', borderColor: '#EF4444' },
              }}
            >
              Завершить
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default function Timer() {
  const [taskName, setTaskName] = useState('')
  const [role, setRole] = useState<'work' | 'learn' | 'rest'>('work')
  const [targetMinutes, setTargetMinutes] = useState<number>(25)
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro')

  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableTasks, setAvailableTasks] = useState<TaskResult[]>([])

  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('none')
  const [nextTaskInfo, setNextTaskInfo] = useState<NextTaskInfo | null>(null)

  const handleServerAutoStop = useCallback((tName: string, reason?: string) => {
    soundSynth.playComplete()
    if (reason === 'target_reached') {
      setMsg(`🎉 Спринт завершен по дедлайну для '${tName}'!`)
    } else if (reason === 'safety_cap_reached') {
      setMsg(`⏹ Сессия для '${tName}' завершена по лимиту безопасности (20 мин).`)
    } else if (reason === 'heartbeat_timeout') {
      setMsg(`⏸ Сессия для '${tName}' приостановлена из-за таймаута активности.`)
    } else {
      setMsg(`Задача '${tName}' завершена`)
    }
  }, [])

  const { runningTasks, setRunningTasks, isConnected, serverTimeOffset } = useTimerSync(handleServerAutoStop)

  // Load available tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasks = await api.getTaskList()
        setAvailableTasks(tasks)
      } catch (e) {
        console.error('Failed to load tasks', e)
      }
    }
    loadTasks()
  }, [])

  const handleStart = async (e?: React.FormEvent, forceTaskInfo?: NextTaskInfo) => {
    if (e) e.preventDefault()
    setMsg(null)
    setError(null)

    let tName = forceTaskInfo ? forceTaskInfo.taskName : taskName
    let tRole = forceTaskInfo ? forceTaskInfo.role : role
    let tTarget = forceTaskInfo
      ? forceTaskInfo.targetDuration
      : timerMode === 'pomodoro'
      ? targetMinutes
      : undefined
    let tSource = forceTaskInfo ? forceTaskInfo.sourceDay : undefined

    tName = tName.trim()
    if (!tName) {
      setError('Введите название задачи')
      return
    }

    if (!forceTaskInfo) {
      const match = availableTasks.find((t) => t.name.trim().toLowerCase() === tName.toLowerCase())
      if (match) {
        tName = match.name
        tRole = (match.role as 'work' | 'learn' | 'rest') || role
      }
    }

    if (runningTasks.some((t) => t.task_name.toLowerCase() === tName.toLowerCase())) {
      setError(`Задача '${tName}' уже активна`)
      return
    }

    try {
      const r = await api.startTask({
        task_name: tName,
        role: tRole,
        target_duration: tTarget,
        source_day: tSource,
      })
      soundSynth.playStart()
      setRunningTasks((prev) => [...prev.filter((t) => t.task_name !== tName), r.data])
      setTaskName('')
      setNextTaskInfo(null)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleStop = async (tName: string, autoBlocked: boolean = false) => {
    setMsg(null)
    setError(null)
    try {
      await api.stopTask({ task_name: tName })
      setRunningTasks((prev) => prev.filter((t) => t.task_name !== tName))
      if (autoBlocked) {
        soundSynth.playComplete()
        setMsg(`🎉 Спринт завершен и сохранен для '${tName}'!`)
      } else {
        soundSynth.playPause()
        setMsg(`Задача '${tName}' остановлена и сохранена`)
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handlePause = async (tName: string) => {
    setError(null)
    try {
      const r = await api.pauseTask({ task_name: tName })
      soundSynth.playPause()
      setRunningTasks((prev) => prev.map((t) => (t.task_name === tName ? r.data : t)))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleResume = async (tName: string) => {
    setError(null)
    try {
      const r = await api.resumeTask({ task_name: tName })
      soundSynth.playStart()
      setRunningTasks((prev) => prev.map((t) => (t.task_name === tName ? r.data : t)))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleAdjustRunningDuration = (deltaMin: number) => {
    setRunningTasks((prev) =>
      prev.map((t) => {
        const cur = t.target_duration || targetMinutes
        const next = Math.max(5, cur + deltaMin)
        return { ...t, target_duration: next }
      })
    )
  }

  // Hotkeys handling
  const togglePlayActive = useCallback(() => {
    if (runningTasks.length > 0) {
      const active = runningTasks[0]
      if (active.is_running) {
        handlePause(active.task_name)
      } else {
        handleResume(active.task_name)
      }
    }
  }, [runningTasks])

  useHotkeys({
    onTogglePlay: togglePlayActive,
    onSelectRole: (newRole) => setRole(newRole),
  })

  const fetchingNextRef = useRef(false)
  const fetchNextSequenceTask = async () => {
    if (fetchingNextRef.current) return
    fetchingNextRef.current = true
    setMsg(null)
    setError(null)
    try {
      let tName = ''
      let sourceDay = ''
      let targetDuration = 0
      let tRole = 'work'

      if (sequenceMode === 'percent') {
        const r = await api.getTaskPlanPercentWithSchedule()
        if (!r) throw new Error('No tasks available in plan percent')
        tName = r.task_name
        sourceDay = r.source_day || ''

        const taskDef = availableTasks.find((t) => t.name === tName)
        tRole = taskDef?.role || 'work'

        const timeLeft = r.time_left
        const defDur = taskDef?.time_duration || 25
        targetDuration = timeLeft > 0 && timeLeft < defDur ? timeLeft : defDur
      } else if (sequenceMode === 'backlog') {
        const r = await api.getRolloverTasks()
        if (!r.data || !r.data.rollover_tasks || r.data.rollover_tasks.length === 0) {
          throw new Error('No backlog tasks found or all completed')
        }
        const tasks = r.data.rollover_tasks.filter((t: any) => t.remaining_time > 0)
        if (tasks.length === 0) throw new Error('All backlog tasks completed')

        const first = tasks[0]
        tName = first.task_name
        tRole = first.role || 'work'
        sourceDay = first.source_day || ''

        const taskDef = availableTasks.find((t) => t.name === tName)
        const defDur = taskDef?.time_duration || 25
        targetDuration = first.remaining_time > 0 && first.remaining_time < defDur ? first.remaining_time : defDur
      }

      setNextTaskInfo({
        taskName: tName,
        role: tRole,
        targetDuration,
        sourceDay,
      })
      setMsg(`Следующая задача: ${tName} (${targetDuration} мин). Нажмите "Старт" для запуска.`)
    } catch (e: any) {
      setError(e.message)
      setSequenceMode('none')
    } finally {
      fetchingNextRef.current = false
    }
  }

  // Fetch sequence when mode changes
  useEffect(() => {
    if (sequenceMode !== 'none' && runningTasks.length === 0 && !nextTaskInfo) {
      fetchNextSequenceTask()
    }
    if (sequenceMode === 'none') {
      setNextTaskInfo(null)
    }
  }, [sequenceMode, runningTasks])

  // Contextual Quick Tags: Combine standard role tags + tasks available in schedule for this role
  const quickTags = [
    ...(ROLE_TAGS[role] || []),
    ...availableTasks.filter((t) => t.role === role).map((t) => t.name),
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={10} lg={9} sx={{ mx: 'auto' }}>
        <Card
          title="Интерактивный таймер"
          subtitle="TimeFlow Canvas — фокус, трекинг и помодоро-спринты"
          icon={<AvTimerOutlinedIcon />}
        >
          {/* Sequence mode selector & Hotkey hint */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
                Горячие клавиши: <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontFamily: DESIGN_TOKENS.fontMono }}>Space</kbd> Старт/Пауза, <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontFamily: DESIGN_TOKENS.fontMono }}>1-3</kbd> Категории
              </Typography>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{ color: DESIGN_TOKENS.textSecondary }}>Режим последовательности</InputLabel>
              <Select
                label="Режим последовательности"
                value={sequenceMode}
                onChange={(e) => setSequenceMode(e.target.value as SequenceMode)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.6)',
                  color: DESIGN_TOKENS.textPrimary,
                }}
              >
                <MenuItem value="none">Ручной выбор (Manual)</MenuItem>
                <MenuItem value="percent">Геймификация плана (%)</MenuItem>
                <MenuItem value="backlog">Геймификация бэклога</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {error && <Alert type="error">{error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}

          {/* Active Running Task Display */}
          <Stack spacing={2.5} sx={{ mb: 4 }}>
            {runningTasks.length > 0 ? (
              runningTasks.map((task) => (
                <TaskTimerItem
                  key={task.id || `${task.task_name}-${task.start_time}`}
                  task={task}
                  onStop={handleStop}
                  onPause={handlePause}
                  onResume={handleResume}
                  onAdjustDuration={handleAdjustRunningDuration}
                  serverTimeOffset={serverTimeOffset}
                />
              ))
            ) : (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 3.5,
                  border: `1px dashed ${DESIGN_TOKENS.borderColor}`,
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ color: DESIGN_TOKENS.textSecondary, mb: 0.5 }}>
                  Нет активных таймеров
                </Typography>
                <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textMuted }}>
                  Выберите категорию, длительность или быстрый тег ниже для старта сессии
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 3.5, borderColor: DESIGN_TOKENS.borderColor }} />

          {/* Gamified Next Task or Manual Start Form */}
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.01em' }}>
            Запустить сессию
          </Typography>

          {nextTaskInfo && sequenceMode !== 'none' ? (
            <Box
              sx={{
                p: 3,
                bgcolor: 'rgba(19, 27, 42, 0.85)',
                border: `1px solid ${ROLE_THEMES[nextTaskInfo.role]?.primary || DESIGN_TOKENS.borderColor}`,
                borderRadius: 3,
                boxShadow: `0 8px 30px ${ROLE_THEMES[nextTaskInfo.role]?.glow || 'none'}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <FlashOnRoundedIcon sx={{ color: ROLE_THEMES[nextTaskInfo.role]?.primary }} />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary }}>
                  Следующая задача по плану: {nextTaskInfo.taskName}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary, mb: 2.5 }}>
                Длительность: {nextTaskInfo.targetDuration} мин &nbsp;|&nbsp; Категория:{' '}
                {ROLE_THEMES[nextTaskInfo.role]?.label}{' '}
                {nextTaskInfo.sourceDay && ` [Из: ${nextTaskInfo.sourceDay}]`}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => handleStart(undefined, nextTaskInfo)}
                  startIcon={<PlayArrowRoundedIcon />}
                  sx={{
                    py: 1.4,
                    bgcolor: ROLE_THEMES[nextTaskInfo.role]?.primary || ROLE_THEMES.work.primary,
                    color: '#0B0F17',
                    fontWeight: 700,
                  }}
                >
                  Запустить задачу ({nextTaskInfo.targetDuration} мин)
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={fetchNextSequenceTask}
                  startIcon={<SkipNextRoundedIcon />}
                  sx={{ py: 1.4 }}
                >
                  Пропустить
                </Button>
              </Stack>
            </Box>
          ) : (
            <Stack component="form" onSubmit={handleStart} spacing={2.5}>
              {/* Category Quick Switcher Chips (1, 2, 3) */}
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                  Категория:
                </Typography>
                {(['work', 'learn', 'rest'] as const).map((rKey, idx) => {
                  const rTheme = ROLE_THEMES[rKey]
                  const isSelected = role === rKey
                  return (
                    <Chip
                      key={rKey}
                      label={`${idx + 1}. ${rTheme.label}`}
                      onClick={() => setRole(rKey)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.82rem',
                        py: 2,
                        px: 0.5,
                        bgcolor: isSelected ? rTheme.badgeBg : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? rTheme.primary : DESIGN_TOKENS.textSecondary,
                        border: isSelected ? `1px solid ${rTheme.primary}` : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        boxShadow: isSelected ? `0 0 16px ${rTheme.glow}` : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isSelected ? rTheme.badgeBg : 'rgba(255, 255, 255, 0.08)',
                        },
                      }}
                    />
                  )
                })}
              </Stack>

              {/* Mode & Preset Duration Pills */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                    Режим:
                  </Typography>
                  <Chip
                    label="Помодоро"
                    size="small"
                    onClick={() => setTimerMode('pomodoro')}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: timerMode === 'pomodoro' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                      color: timerMode === 'pomodoro' ? DESIGN_TOKENS.textPrimary : DESIGN_TOKENS.textMuted,
                      border: `1px solid ${timerMode === 'pomodoro' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}`,
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label="Секундомер"
                    size="small"
                    onClick={() => setTimerMode('free')}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: timerMode === 'free' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                      color: timerMode === 'free' ? DESIGN_TOKENS.textPrimary : DESIGN_TOKENS.textMuted,
                      border: `1px solid ${timerMode === 'free' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}`,
                      fontWeight: 600,
                    }}
                  />
                </Stack>

                {timerMode === 'pomodoro' && (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                      Цель:
                    </Typography>
                    {TIMER_PRESETS.map((mins) => (
                      <Chip
                        key={mins}
                        label={`${mins}м`}
                        size="small"
                        onClick={() => setTargetMinutes(mins)}
                        sx={{
                          cursor: 'pointer',
                          fontFamily: DESIGN_TOKENS.fontMono,
                          fontWeight: targetMinutes === mins ? 700 : 500,
                          bgcolor: targetMinutes === mins ? ROLE_THEMES[role]?.badgeBg : 'rgba(255, 255, 255, 0.04)',
                          color: targetMinutes === mins ? ROLE_THEMES[role]?.primary : DESIGN_TOKENS.textSecondary,
                          border: targetMinutes === mins ? `1px solid ${ROLE_THEMES[role]?.primary}` : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        }}
                      />
                    ))}
                    <Chip
                      size="small"
                      icon={<AddRoundedIcon fontSize="small" />}
                      label="5м"
                      onClick={() => setTargetMinutes((prev) => prev + 5)}
                      sx={{ cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.04)', color: DESIGN_TOKENS.textSecondary }}
                    />
                  </Stack>
                )}
              </Stack>

              {/* Task Name and Autocomplete */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Autocomplete
                  options={availableTasks.map((t) => t.name)}
                  value={taskName}
                  onChange={(_, newValue) => {
                    setTaskName(newValue || '')
                    const f = availableTasks.find((t) => t.name === newValue)
                    if (f) setRole((f.role as 'work' | 'learn' | 'rest') || 'work')
                  }}
                  freeSolo
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Название задачи"
                      placeholder="Например: Разработка UI, Книга, Code review..."
                      required
                    />
                  )}
                />

                <Button
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={<PlayArrowRoundedIcon />}
                  sx={{
                    py: 1.8,
                    px: 4,
                    minWidth: 160,
                    width: { xs: '100%', sm: 'auto' },
                    bgcolor: ROLE_THEMES[role]?.primary || ROLE_THEMES.work.primary,
                    color: '#0B0F17',
                    fontWeight: 700,
                    boxShadow: `0 4px 20px ${ROLE_THEMES[role]?.glow || 'rgba(255, 107, 74, 0.35)'}`,
                  }}
                >
                  Старт {timerMode === 'pomodoro' ? `(${targetMinutes}м)` : ''}
                </Button>
              </Stack>

              {/* Quick Tags Section */}
              {quickTags.length > 0 && (
                <Box sx={{ pt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600, display: 'block', mb: 1 }}>
                    Быстрые теги и задачи:
                  </Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {quickTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => {
                          setTaskName(tag)
                          const f = availableTasks.find((t) => t.name === tag)
                          if (f) setRole((f.role as 'work' | 'learn' | 'rest') || role)
                        }}
                        sx={{
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          bgcolor: 'rgba(255, 255, 255, 0.04)',
                          color: DESIGN_TOKENS.textSecondary,
                          border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: ROLE_THEMES[role]?.badgeBg,
                            color: ROLE_THEMES[role]?.primary,
                            borderColor: ROLE_THEMES[role]?.primary,
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </Card>
      </Grid>
    </Grid>
  )
}
