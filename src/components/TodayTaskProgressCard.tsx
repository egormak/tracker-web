import { useState, useMemo, FC } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import Paper from '@mui/material/Paper'

// Icons
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import TimelapseRoundedIcon from '@mui/icons-material/TimelapseRounded'
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded'

import { TaskResult, RunningTask } from '../api/client'
import Card from './Card'
import { DESIGN_TOKENS, ROLE_COLORS, ROLE_THEMES } from '../constants/themeColors'

export interface TodayTaskProgressCardProps {
  tasks: TaskResult[]
  runningTasks?: RunningTask[]
  isDemoMode?: boolean
  onStartTask?: (taskName: string, role: string, duration?: number) => void
  onApplySchedule?: () => void
}

// Demo tasks for preview mode
const DEMO_TASKS: TaskResult[] = [
  { name: 'Проектирование API и архитектуры', role: 'work', time_duration: 180, time_done: 180, priority: 9 },
  { name: 'Разработка UI на Canvas', role: 'work', time_duration: 120, time_done: 105, priority: 8 },
  { name: 'Code Review & синк команды', role: 'work', time_duration: 60, time_done: 60, priority: 7 },
  { name: 'Курс по алгоритмам и Go', role: 'learn', time_duration: 90, time_done: 75, priority: 8 },
  { name: 'Английский язык (Speaking)', role: 'learn', time_duration: 30, time_done: 0, priority: 7 },
  { name: 'Обед и прогулка на воздухе', role: 'rest', time_duration: 60, time_done: 60, priority: 4 },
  { name: 'Кофе-брейк и разминка', role: 'rest', time_duration: 20, time_done: 20, priority: 3 },
  { name: 'Чтение профильных статей', role: 'learn', time_duration: 20, time_done: 45, priority: 5 },
]

export const TodayTaskProgressCard: FC<TodayTaskProgressCardProps> = ({
  tasks: realTasks,
  runningTasks = [],
  isDemoMode = false,
  onStartTask,
  onApplySchedule,
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'work' | 'learn' | 'rest'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'priority' | 'progress_desc' | 'progress_asc' | 'remaining' | 'name'>('priority')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const tasks = useMemo(() => {
    return isDemoMode ? DEMO_TASKS : realTasks
  }, [isDemoMode, realTasks])

  // Aggregate Metrics for Today
  const analytics = useMemo(() => {
    let totalPlanned = 0
    let totalDone = 0
    let totalRemaining = 0
    let completedCount = 0
    let inProgressCount = 0
    let pendingCount = 0
    let overtimeCount = 0

    const roleStats: Record<string, { planned: number; done: number; count: number }> = {
      work: { planned: 0, done: 0, count: 0 },
      learn: { planned: 0, done: 0, count: 0 },
      rest: { planned: 0, done: 0, count: 0 },
    }

    tasks.forEach((t) => {
      const planned = t.time_duration || 0
      const done = t.time_done || 0
      const rem = Math.max(0, planned - done)

      totalPlanned += planned
      totalDone += done
      totalRemaining += rem

      if (done >= planned && planned > 0) {
        completedCount++
        if (done > planned) overtimeCount++
      } else if (done > 0) {
        inProgressCount++
      } else {
        pendingCount++
      }

      const roleKey = t.role in roleStats ? t.role : 'work'
      roleStats[roleKey].planned += planned
      roleStats[roleKey].done += done
      roleStats[roleKey].count += 1
    })

    const overallPct = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0

    return {
      totalPlanned,
      totalDone,
      totalRemaining,
      completedCount,
      inProgressCount,
      pendingCount,
      overtimeCount,
      totalTasks: tasks.length,
      overallPct,
      roleStats,
    }
  }, [tasks])

  // Filtered & Sorted Tasks
  const displayedTasks = useMemo(() => {
    let list = [...tasks]

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((t) => t.name.toLowerCase().includes(q))
    }

    // 2. Role filter
    if (roleFilter !== 'all') {
      list = list.filter((t) => t.role === roleFilter)
    }

    // 3. Status filter
    if (statusFilter === 'completed') {
      list = list.filter((t) => t.time_done >= t.time_duration && t.time_duration > 0)
    } else if (statusFilter === 'active') {
      list = list.filter((t) => t.time_done < t.time_duration || t.time_duration === 0)
    }

    // 4. Sorting
    list.sort((a, b) => {
      const pctA = a.time_duration > 0 ? (a.time_done / a.time_duration) * 100 : 0
      const pctB = b.time_duration > 0 ? (b.time_done / b.time_duration) * 100 : 0
      const remA = Math.max(0, a.time_duration - a.time_done)
      const remB = Math.max(0, b.time_duration - b.time_done)

      switch (sortBy) {
        case 'priority':
          return (b.priority || 0) - (a.priority || 0) || b.time_duration - a.time_duration
        case 'progress_desc':
          return pctB - pctA || b.time_done - a.time_done
        case 'progress_asc':
          return pctA - pctB || a.time_done - b.time_done
        case 'remaining':
          return remB - remA || (b.priority || 0) - (a.priority || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return list
  }, [tasks, searchQuery, roleFilter, statusFilter, sortBy])

  // Check if a task is currently running in live timer
  const isTaskRunning = (taskName: string) => {
    return runningTasks.some((rt) => rt.is_running && rt.task_name.toLowerCase() === taskName.toLowerCase())
  }

  return (
    <Card
      title="Прогресс по задачам на сегодня"
      subtitle="Аналитика выполнения плана дня, тайминги и управление задачами"
      icon={<AssignmentTurnedInOutlinedIcon />}
      glowColor="rgba(255, 107, 74, 0.18)"
    >
      <Stack spacing={3}>
        {/* =========================================================================
            1. TOP HERO KPI BANNER: Overall Day Progress & Key Metrics
           ========================================================================= */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(19, 27, 42, 0.85) 0%, rgba(15, 23, 42, 0.7) 100%)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${DESIGN_TOKENS.borderColor}`,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Main Progress Bar & Percentage */}
          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted, letterSpacing: '0.06em', fontWeight: 700 }}>
                  Общий прогресс дня
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="baseline">
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: DESIGN_TOKENS.fontMono,
                      fontWeight: 800,
                      color: analytics.overallPct >= 100 ? ROLE_COLORS.rest : analytics.overallPct >= 50 ? ROLE_COLORS.work : '#60A5FA',
                      lineHeight: 1.1,
                    }}
                  >
                    {analytics.overallPct}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                    ({analytics.totalDone} из {analytics.totalPlanned} мин)
                  </Typography>
                </Stack>
              </Box>

              <Chip
                icon={
                  analytics.overallPct >= 100 ? (
                    <DoneAllRoundedIcon fontSize="small" />
                  ) : analytics.overallPct >= 50 ? (
                    <TrendingUpRoundedIcon fontSize="small" />
                  ) : (
                    <SpeedRoundedIcon fontSize="small" />
                  )
                }
                label={
                  analytics.overallPct >= 100
                    ? '🏆 План дня закрыт!'
                    : analytics.overallPct >= 50
                    ? '⚡ Отличный темп'
                    : '🎯 В начале пути'
                }
                size="small"
                sx={{
                  fontFamily: DESIGN_TOKENS.fontMain,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  bgcolor:
                    analytics.overallPct >= 100
                      ? 'rgba(16, 185, 129, 0.16)'
                      : analytics.overallPct >= 50
                      ? 'rgba(255, 107, 74, 0.16)'
                      : 'rgba(59, 130, 246, 0.16)',
                  color:
                    analytics.overallPct >= 100
                      ? ROLE_COLORS.rest
                      : analytics.overallPct >= 50
                      ? ROLE_COLORS.work
                      : ROLE_COLORS.learn,
                  border: `1px solid ${
                    analytics.overallPct >= 100
                      ? `${ROLE_COLORS.rest}40`
                      : analytics.overallPct >= 50
                      ? `${ROLE_COLORS.work}40`
                      : `${ROLE_COLORS.learn}40`
                  }`,
                }}
              />
            </Stack>

            {/* Glowing Day Progress Bar */}
            <Box sx={{ position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, analytics.overallPct)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundImage:
                      analytics.overallPct >= 100
                        ? `linear-gradient(90deg, ${ROLE_COLORS.rest}, #34D399)`
                        : `linear-gradient(90deg, ${ROLE_COLORS.work}, #FF8F6B)`,
                    boxShadow: `0 0 12px ${analytics.overallPct >= 100 ? ROLE_COLORS.rest : ROLE_COLORS.work}60`,
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                }}
              />
            </Box>
          </Stack>

          {/* 4 Metric Tiles */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(15, 23, 42, 0.65)',
                  border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                }}
              >
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 0.3 }}>
                  План на сегодня
                </Typography>
                <Typography variant="subtitle1" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700 }}>
                  {analytics.totalPlanned} мин
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(15, 23, 42, 0.65)',
                  border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                }}
              >
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 0.3 }}>
                  Выполнено
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700, color: ROLE_COLORS.work }}
                >
                  {analytics.totalDone} мин
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(15, 23, 42, 0.65)',
                  border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                }}
              >
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 0.3 }}>
                  Осталось закрыть
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: DESIGN_TOKENS.fontMono,
                    fontWeight: 700,
                    color: analytics.totalRemaining === 0 ? ROLE_COLORS.rest : '#60A5FA',
                  }}
                >
                  {analytics.totalRemaining} мин
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(15, 23, 42, 0.65)',
                  border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                }}
              >
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 0.3 }}>
                  Статус задач
                </Typography>
                <Typography variant="subtitle1" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700 }}>
                  <Box component="span" sx={{ color: ROLE_COLORS.rest }}>
                    {analytics.completedCount}
                  </Box>
                  /{analytics.totalTasks}{' '}
                  <Typography component="span" variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
                    закрыто
                  </Typography>
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Role Breakdown Interactive Pills */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
            {(['work', 'learn', 'rest'] as const).map((rKey) => {
              const rStats = analytics.roleStats[rKey]
              const theme = ROLE_THEMES[rKey]
              const pct = rStats.planned > 0 ? Math.round((rStats.done / rStats.planned) * 100) : 0
              const isSelected = roleFilter === rKey

              return (
                <Box
                  key={rKey}
                  onClick={() => setRoleFilter((prev) => (prev === rKey ? 'all' : rKey))}
                  sx={{
                    flex: 1,
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: isSelected ? theme.badgeBg : 'rgba(15, 23, 42, 0.5)',
                    border: `1px solid ${isSelected ? theme.primary : DESIGN_TOKENS.borderColor}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: `${theme.primary}80`,
                      bgcolor: theme.badgeBg,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.primary }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary }}>
                        {theme.label}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700, color: theme.primary }}
                    >
                      {pct}%
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontSize: '0.7rem' }}>
                      {rStats.count} {rStats.count === 1 ? 'задача' : 'задач'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: DESIGN_TOKENS.fontMono, color: DESIGN_TOKENS.textSecondary, fontSize: '0.72rem' }}
                    >
                      {rStats.done}/{rStats.planned}м
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, pct)}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        backgroundColor: theme.primary,
                      },
                    }}
                  />
                </Box>
              )
            })}
          </Stack>
        </Paper>

        {/* =========================================================================
            2. TOOLBAR: Search, Filters, Sorting & View Toggle
           ========================================================================= */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Поиск задачи..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: DESIGN_TOKENS.textMuted, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: { xs: '100%', md: 240 },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 2.5,
                borderColor: DESIGN_TOKENS.borderColor,
                fontSize: '0.85rem',
              },
            }}
          />

          {/* Filters & Controls */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {/* Status Filter Chips */}
            <ToggleButtonGroup
              size="small"
              value={statusFilter}
              exclusive
              onChange={(_, val) => val && setStatusFilter(val)}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 2.5,
                border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                '& .MuiToggleButton-root': {
                  color: DESIGN_TOKENS.textSecondary,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  px: 1.4,
                  py: 0.5,
                  border: 'none',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255, 107, 74, 0.18)',
                    color: ROLE_COLORS.work,
                    fontWeight: 700,
                  },
                },
              }}
            >
              <ToggleButton value="all">Все ({tasks.length})</ToggleButton>
              <ToggleButton value="active">В работе ({analytics.inProgressCount + analytics.pendingCount})</ToggleButton>
              <ToggleButton value="completed">Готово ({analytics.completedCount})</ToggleButton>
            </ToggleButtonGroup>

            {/* Sorting Select */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                displayEmpty
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 2.5,
                  borderColor: DESIGN_TOKENS.borderColor,
                  fontSize: '0.78rem',
                  color: DESIGN_TOKENS.textPrimary,
                  '& .MuiSelect-select': { py: 0.8, px: 1.5 },
                }}
              >
                <MenuItem value="priority" sx={{ fontSize: '0.8rem' }}>
                  По приоритету
                </MenuItem>
                <MenuItem value="progress_desc" sx={{ fontSize: '0.8rem' }}>
                  Прогресс: сначала больше
                </MenuItem>
                <MenuItem value="progress_asc" sx={{ fontSize: '0.8rem' }}>
                  Прогресс: сначала меньше
                </MenuItem>
                <MenuItem value="remaining" sx={{ fontSize: '0.8rem' }}>
                  По остатку времени
                </MenuItem>
                <MenuItem value="name" sx={{ fontSize: '0.8rem' }}>
                  По алфавиту
                </MenuItem>
              </Select>
            </FormControl>

            {/* View Mode Toggle (Grid vs List) */}
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 2.5,
                border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                '& .MuiToggleButton-root': {
                  color: DESIGN_TOKENS.textMuted,
                  p: 0.6,
                  border: 'none',
                  '&.Mui-selected': {
                    color: DESIGN_TOKENS.textPrimary,
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                  },
                },
              }}
            >
              <ToggleButton value="grid" aria-label="Сетка">
                <GridViewRoundedIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" aria-label="Список">
                <ViewListRoundedIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {/* =========================================================================
            3. TASKS CONTENT: Grid or List Mode
           ========================================================================= */}
        {displayedTasks.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.5)',
              borderColor: DESIGN_TOKENS.borderColor,
            }}
          >
            <HourglassEmptyRoundedIcon sx={{ fontSize: 42, color: DESIGN_TOKENS.textMuted, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, mb: 0.5 }}>
              {tasks.length === 0 ? 'Расписание на сегодня пусто' : 'Нет задач, соответствующих фильтрам'}
            </Typography>
            <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary, mb: 2, maxWidth: 460, mx: 'auto' }}>
              {tasks.length === 0
                ? 'Нажмите «Применить расписание», чтобы импортировать задачи на текущий день из активного недельного плана.'
                : 'Попробуйте сбросить фильтры или изменить поисковый запрос.'}
            </Typography>

            {tasks.length === 0 && onApplySchedule && (
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={onApplySchedule}
                sx={{
                  bgcolor: ROLE_COLORS.work,
                  color: '#FFFFFF',
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#FF8F6B' },
                }}
              >
                Применить расписание на сегодня
              </Button>
            )}

            {tasks.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  borderColor: DESIGN_TOKENS.borderColor,
                  color: DESIGN_TOKENS.textPrimary,
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </Paper>
        ) : viewMode === 'grid' ? (
          /* ---------------------- GRID VIEW ---------------------- */
          <Grid container spacing={2}>
            {displayedTasks.map((t) => {
              const theme = ROLE_THEMES[t.role] || ROLE_THEMES.other
              const planned = t.time_duration || 0
              const done = t.time_done || 0
              const pct = planned > 0 ? Math.round((done / planned) * 100) : 0
              const remaining = Math.max(0, planned - done)
              const isDone = done >= planned && planned > 0
              const isOvertime = done > planned
              const isRunning = isTaskRunning(t.name)

              return (
                <Grid item xs={12} sm={6} lg={4} key={t.name}>
                  <Box
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      bgcolor: isRunning ? 'rgba(26, 38, 59, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${
                        isRunning ? theme.primary : isDone ? `${ROLE_COLORS.rest}40` : DESIGN_TOKENS.borderColor
                      }`,
                      boxShadow: isRunning ? `0 8px 24px ${theme.glow}` : '0 6px 20px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      '&:hover': {
                        borderColor: isRunning ? theme.primary : `${theme.primary}60`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 28px rgba(0,0,0,0.3), 0 0 16px ${theme.glow}`,
                      },
                    }}
                  >
                    {/* Top Header Row: Role & Badges */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={theme.label}
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: theme.badgeBg,
                            color: theme.primary,
                            border: `1px solid ${theme.primary}35`,
                          }}
                        />
                        {t.priority !== undefined && (
                          <Tooltip title={`Приоритет задачи: P${t.priority}`} placement="top">
                            <Chip
                              size="small"
                              icon={<FlagRoundedIcon sx={{ fontSize: 13 }} />}
                              label={`P${t.priority}`}
                              sx={{
                                height: 22,
                                fontSize: '0.68rem',
                                fontFamily: DESIGN_TOKENS.fontMono,
                                fontWeight: 700,
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                color: DESIGN_TOKENS.textMuted,
                              }}
                            />
                          </Tooltip>
                        )}
                      </Stack>

                      {/* Status / Live Badge */}
                      {isRunning ? (
                        <Chip
                          size="small"
                          icon={<TimelapseRoundedIcon sx={{ fontSize: 14, animation: 'spin 3s linear infinite' }} />}
                          label="Live"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            bgcolor: 'rgba(255, 107, 74, 0.25)',
                            color: '#FF8F6B',
                            border: '1px solid rgba(255, 107, 74, 0.6)',
                            '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                          }}
                        />
                      ) : isOvertime ? (
                        <Chip
                          size="small"
                          icon={<RocketLaunchRoundedIcon sx={{ fontSize: 13 }} />}
                          label={`+${done - planned}м`}
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontFamily: DESIGN_TOKENS.fontMono,
                            fontWeight: 700,
                            bgcolor: 'rgba(168, 85, 247, 0.18)',
                            color: '#C084FC',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                          }}
                        />
                      ) : isDone ? (
                        <Chip
                          size="small"
                          icon={<CheckCircleRoundedIcon sx={{ fontSize: 13 }} />}
                          label="Готово"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(16, 185, 129, 0.16)',
                            color: ROLE_COLORS.rest,
                            border: `1px solid ${ROLE_COLORS.rest}40`,
                          }}
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: DESIGN_TOKENS.fontMono,
                            fontSize: '0.72rem',
                            color: DESIGN_TOKENS.textMuted,
                          }}
                        >
                          ост. {remaining}м
                        </Typography>
                      )}
                    </Stack>

                    {/* Task Title */}
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{
                        color: DESIGN_TOKENS.textPrimary,
                        fontSize: '0.92rem',
                        lineHeight: 1.3,
                        mb: 1.8,
                        flexGrow: 1,
                      }}
                    >
                      {t.name}
                    </Typography>

                    {/* Progress Bar & Numeric Labels */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: DESIGN_TOKENS.fontMono,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: isDone ? ROLE_COLORS.rest : DESIGN_TOKENS.textPrimary,
                          }}
                        >
                          {done} / {planned} мин
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: DESIGN_TOKENS.fontMono,
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: isDone ? ROLE_COLORS.rest : theme.primary,
                          }}
                        >
                          {pct}%
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, pct)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: isDone ? ROLE_COLORS.rest : theme.primary,
                            boxShadow: isDone ? `0 0 8px ${ROLE_COLORS.rest}50` : `0 0 8px ${theme.primary}50`,
                          },
                        }}
                      />
                    </Box>

                    {/* Action Button: Quick Start Timer */}
                    {onStartTask && (
                      <Button
                        size="small"
                        variant={isRunning ? 'contained' : 'outlined'}
                        startIcon={isRunning ? <TimelapseRoundedIcon /> : <PlayArrowRoundedIcon />}
                        onClick={() => onStartTask(t.name, t.role, remaining > 0 ? remaining : 25)}
                        disabled={isRunning}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          py: 0.6,
                          borderColor: `${theme.primary}50`,
                          color: isRunning ? '#FFFFFF' : theme.primary,
                          bgcolor: isRunning ? theme.primary : 'rgba(255, 255, 255, 0.03)',
                          '&:hover': {
                            bgcolor: `${theme.primary}20`,
                            borderColor: theme.primary,
                          },
                        }}
                      >
                        {isRunning ? 'Сейчас активна' : isDone ? 'Добавить время' : 'Запустить задачу'}
                      </Button>
                    )}
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        ) : (
          /* ---------------------- LIST / TABLE VIEW ---------------------- */
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              borderColor: DESIGN_TOKENS.borderColor,
            }}
          >
            <Stack divider={<Box sx={{ borderBottom: `1px solid ${DESIGN_TOKENS.borderColor}` }} />}>
              {displayedTasks.map((t) => {
                const theme = ROLE_THEMES[t.role] || ROLE_THEMES.other
                const planned = t.time_duration || 0
                const done = t.time_done || 0
                const pct = planned > 0 ? Math.round((done / planned) * 100) : 0
                const remaining = Math.max(0, planned - done)
                const isDone = done >= planned && planned > 0
                const isRunning = isTaskRunning(t.name)

                return (
                  <Box
                    key={t.name}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      bgcolor: isRunning ? 'rgba(26, 38, 59, 0.6)' : 'transparent',
                      transition: 'background 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      {/* Role & Name */}
                      <Grid item xs={12} sm={5} md={4}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: theme.badgeBg,
                              color: theme.primary,
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}
                          >
                            {t.role.slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap sx={{ color: DESIGN_TOKENS.textPrimary }}>
                              {t.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
                              {theme.label} • Приоритет P{t.priority}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      {/* Progress Bar & Numbers */}
                      <Grid item xs={8} sm={4} md={5}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, color: DESIGN_TOKENS.textSecondary }}>
                              {done}/{planned} мин ({pct}%)
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: DESIGN_TOKENS.fontMono,
                                fontWeight: 700,
                                color: isDone ? ROLE_COLORS.rest : DESIGN_TOKENS.textMuted,
                              }}
                            >
                              {isDone ? 'Завершено' : `ост. ${remaining}м`}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, pct)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: isDone ? ROLE_COLORS.rest : theme.primary,
                              },
                            }}
                          />
                        </Box>
                      </Grid>

                      {/* Action Button */}
                      <Grid item xs={4} sm={3} md={3} sx={{ textAlign: 'right' }}>
                        {onStartTask && (
                          <Button
                            size="small"
                            variant={isRunning ? 'contained' : 'outlined'}
                            startIcon={isRunning ? <TimelapseRoundedIcon /> : <PlayArrowRoundedIcon />}
                            onClick={() => onStartTask(t.name, t.role, remaining > 0 ? remaining : 25)}
                            disabled={isRunning}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderColor: `${theme.primary}50`,
                              color: isRunning ? '#FFFFFF' : theme.primary,
                              bgcolor: isRunning ? theme.primary : 'transparent',
                            }}
                          >
                            {isRunning ? 'В эфире' : 'Старт'}
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )
              })}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Card>
  )
}

export default TodayTaskProgressCard
