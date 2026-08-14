import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import NightlightRoundOutlinedIcon from '@mui/icons-material/NightlightRoundOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import ViewTimelineOutlinedIcon from '@mui/icons-material/ViewTimelineOutlined'
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined'

import { api, RestTimeResponse, RecordsSummary, TaskResult, WeeklyStatsResponse, RunningTask } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'
import Progress from '../components/Progress'
import { EveningFocusCard } from '../components/EveningFocusCard'
import { formatRestMinutes } from '../utils/format'
import { ROLE_COLORS, ROLE_THEMES, DESIGN_TOKENS } from '../constants/themeColors'
import { Timeline24hCanvas, TimelineSession } from '../components/canvas/Timeline24hCanvas'
import { DonutChartCanvas, DonutSegment } from '../components/canvas/DonutChartCanvas'

export default function Dashboard() {
  const [records, setRecords] = useState<RecordsSummary | null>(null)
  const [rest, setRest] = useState<RestTimeResponse | null>(null)
  const [tasks, setTasks] = useState<TaskResult[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null)
  const [runningTasks, setRunningTasks] = useState<RunningTask[]>([])
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [weeklyTab, setWeeklyTab] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1 // Monday = 0, ..., Sunday = 6
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [rec, r, tl, ws, rt] = await Promise.all([
          api.getRecordsSummary(),
          api.restGet(),
          api.getStatsTasksToday(),
          api.getWeeklyStats(),
          api.getRunningTasks().catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setRecords(rec)
        setRest(r)
        setTasks(tl)
        setWeeklyStats(ws)
        setRunningTasks(rt.data || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Insights from weekly stats
  const insights = useMemo(() => {
    if (!weeklyStats) return null

    let totalFocus = 0
    let totalScheduled = 0
    let totalDone = 0

    weeklyStats.weekly_targets.forEach((t) => {
      if (t.role === 'work' || t.role === 'learn') {
        totalFocus += t.time_done
      }
      totalScheduled += t.time_duration
      totalDone += t.time_done
    })

    const overallCompletion = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0

    let bestDay = weeklyStats.days[0]
    weeklyStats.days.forEach((d) => {
      if (d.total_done > (bestDay?.total_done || 0)) {
        bestDay = d
      }
    })

    return {
      totalFocus,
      overallCompletion,
      bestDayName: bestDay ? bestDay.day : 'N/A',
      bestDayMinutes: bestDay ? bestDay.total_done : 0,
      bestDayDate: bestDay ? bestDay.date : '',
    }
  }, [weeklyStats])

  const maxDayDone = useMemo(() => {
    if (!weeklyStats) return 60
    return Math.max(...weeklyStats.days.map((d) => d.total_done), 60)
  }, [weeklyStats])

  const totals = useMemo(() => {
    const sum = (m?: Record<string, number>) => Object.values(m || {}).reduce((a, b) => a + b, 0)
    const today = sum(records?.today)
    const yesterday = sum(records?.yesterday)
    const all = sum(records?.all)
    const vsYesterday = yesterday ? Math.round((today / yesterday) * 100) : 0
    return { today, yesterday, all, vsYesterday }
  }, [records])

  // Demo Day Sessions
  const demoSessions: TimelineSession[] = useMemo(
    () => [
      { id: 'd1', taskName: 'Чтение документации & книги', role: 'learn', startSeconds: 8.5 * 3600, durationSeconds: 45 * 60 },
      { id: 'd2', taskName: 'Проектирование API и архитектуры', role: 'work', startSeconds: 9.5 * 3600, durationSeconds: 90 * 60 },
      { id: 'd3', taskName: 'Кофе-брейк и разминка', role: 'rest', startSeconds: 11 * 3600, durationSeconds: 20 * 60 },
      { id: 'd4', taskName: 'Разработка UI на Canvas', role: 'work', startSeconds: 11.35 * 3600, durationSeconds: 105 * 60 },
      { id: 'd5', taskName: 'Обед и прогулка', role: 'rest', startSeconds: 13.1 * 3600, durationSeconds: 60 * 60 },
      { id: 'd6', taskName: 'Code Review & синк команды', role: 'work', startSeconds: 14.25 * 3600, durationSeconds: 90 * 60 },
      { id: 'd7', taskName: 'Курс по алгоритмам и английскому', role: 'learn', startSeconds: 16 * 3600, durationSeconds: 75 * 60 },
      { id: 'd8', taskName: 'Интеграционное тестирование', role: 'work', startSeconds: 17.5 * 3600, durationSeconds: 60 * 60 },
    ],
    []
  )

  // Prepare 24h timeline sessions for today
  const timelineSessions = useMemo<TimelineSession[]>(() => {
    if (isDemoMode) return demoSessions

    const sessions: TimelineSession[] = []
    let currentSeconds = 9 * 3600 // 09:00:00

    // 1. Completed tasks today
    tasks.forEach((t, idx) => {
      if (t.time_done > 0) {
        const durSec = t.time_done * 60
        sessions.push({
          id: `task-${idx}-${t.name}`,
          taskName: t.name,
          role: t.role || 'work',
          startSeconds: currentSeconds,
          durationSeconds: durSec,
        })
        currentSeconds += durSec + 10 * 60 // 10 min break interval
      }
    })

    // 2. Active running task (Live segment!)
    if (runningTasks.length > 0) {
      const active = runningTasks[0]
      const now = new Date()
      const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      let startSecs = nowSecs - (active.accumulated * 60)
      if (active.start_time) {
        const st = new Date(active.start_time)
        startSecs = st.getHours() * 3600 + st.getMinutes() * 60 + st.getSeconds()
      }
      startSecs = Math.max(0, Math.min(startSecs, nowSecs - 10))

      sessions.push({
        id: 'active-live-session',
        taskName: active.task_name,
        role: active.role || 'work',
        startSeconds: startSecs,
        durationSeconds: Math.max(60, nowSecs - startSecs),
        isLive: active.is_running,
      })
    }

    return sessions
  }, [tasks, runningTasks, isDemoMode, demoSessions])

  // Prepare donut segments for today
  const donutSegments = useMemo<DonutSegment[]>(() => {
    if (isDemoMode) {
      return [
        { role: 'work', minutes: 345, label: 'Работа' },
        { role: 'learn', minutes: 120, label: 'Изучение' },
        { role: 'rest', minutes: 80, label: 'Отдых' },
      ]
    }

    const roleSums: Record<string, number> = { work: 0, learn: 0, rest: 0, other: 0 }

    if (records?.today) {
      Object.entries(records.today).forEach(([name, minutes]) => {
        const matchingTask = tasks.find((t) => t.name.toLowerCase() === name.toLowerCase())
        const role = matchingTask?.role || 'work'
        if (role in roleSums) {
          roleSums[role] += minutes
        } else {
          roleSums.other += minutes
        }
      })
    }

    return [
      { role: 'work', minutes: roleSums.work, label: 'Работа' },
      { role: 'learn', minutes: roleSums.learn, label: 'Изучение' },
      { role: 'rest', minutes: roleSums.rest, label: 'Отдых' },
    ].filter((s) => s.minutes > 0)
  }, [records, tasks, isDemoMode])

  // Focus & Balance Health Score Algorithm
  const balanceAnalytics = useMemo(() => {
    let workMin = 0
    let learnMin = 0
    let restMin = 0

    if (isDemoMode) {
      workMin = 345
      learnMin = 120
      restMin = 80
    } else {
      donutSegments.forEach((s) => {
        if (s.role === 'work') workMin += s.minutes
        if (s.role === 'learn') learnMin += s.minutes
        if (s.role === 'rest') restMin += s.minutes
      })
      if (rest) {
        restMin = Math.max(restMin, Math.round(rest.rest_time / 100))
      }
    }

    const totalFocusMin = workMin + learnMin
    let score = 5.0
    let feedback = 'Начните первую сессию, чтобы сформировать индекс баланса дня.'

    if (totalFocusMin > 0) {
      const focusHours = totalFocusMin / 60
      const restHours = restMin / 60
      const ratio = restHours > 0 ? focusHours / restHours : 10

      if (ratio >= 2.5 && ratio <= 5.5 && focusHours >= 2.5) {
        score = 9.5
        feedback = 'Идеальный баланс! Глубокий фокус гармонично сочетается с регулярными восстановительными паузами.'
      } else if (ratio > 5.5 && focusHours >= 3.5) {
        score = 8.1
        feedback = 'Высокая концентрация и объем работы. Рекомендуется сделать паузу для отдыха глаз и разминки.'
      } else if (ratio < 2.0 && focusHours < 2.0) {
        score = 7.0
        feedback = 'Много времени отведено паузам. Самое время погрузиться в глубокую рабочую или учебную сессию.'
      } else {
        score = 8.8
        feedback = 'Хороший продуктивный темп. Продолжайте поддерживать регулярность интервалов.'
      }
    }

    // Daily Goals (Work 6h = 360m, Learn 2h = 120m, Rest 1.5h = 90m)
    const workGoalPct = Math.min(100, Math.round((workMin / 360) * 100))
    const learnGoalPct = Math.min(100, Math.round((learnMin / 120) * 100))
    const restGoalPct = Math.min(100, Math.round((restMin / 90) * 100))

    return {
      score,
      feedback,
      workMin,
      learnMin,
      restMin,
      workGoalPct,
      learnGoalPct,
      restGoalPct,
    }
  }, [donutSegments, rest, isDemoMode])

  const formatSecToTime = (secs: number) => {
    const h = Math.floor(secs / 3600) % 24
    const m = Math.floor((secs % 3600) / 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const overviewItems = [
    {
      label: 'Всего сегодня',
      value: `${isDemoMode ? 545 : totals.today} мин`,
      icon: <AccessTimeOutlinedIcon fontSize="small" />,
      color: ROLE_COLORS.work,
    },
    {
      label: 'Вчера',
      value: `${totals.yesterday} мин`,
      icon: <HistoryToggleOffOutlinedIcon fontSize="small" />,
      color: '#60A5FA',
    },
    {
      label: 'Все время',
      value: `${totals.all} мин`,
      icon: <TimelineOutlinedIcon fontSize="small" />,
      color: '#A78BFA',
    },
    rest && {
      label: 'Баланс отдыха',
      value: `${formatRestMinutes(rest.rest_time)} мин`,
      icon: <NightlightRoundOutlinedIcon fontSize="small" />,
      color: ROLE_COLORS.rest,
    },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: ReactNode; color: string }>

  return (
    <Box sx={{ width: '100%' }}>
      {/* Demo Day Switcher & Banner */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textMuted }}>
          Интерактивный дашборд TimeFlow Canvas
        </Typography>
        <Button
          size="small"
          variant={isDemoMode ? 'contained' : 'outlined'}
          startIcon={<AutoAwesomeOutlinedIcon />}
          onClick={() => setIsDemoMode((v) => !v)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.8rem',
            bgcolor: isDemoMode ? ROLE_COLORS.learn : 'rgba(255, 255, 255, 0.05)',
            color: isDemoMode ? '#FFFFFF' : DESIGN_TOKENS.textPrimary,
          }}
        >
          {isDemoMode ? '✨ Выйти из Демо-дня' : '✨ Демо-день (Превью)'}
        </Button>
      </Stack>

      <EveningFocusCard />

      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
        {/* 1. Overview Metric Tiles */}
        <Grid item xs={12} md={6}>
          <Card title="Сводка активности" subtitle="Метрики текущего дня" icon={<TaskAltOutlinedIcon />}>
            {error && <Alert type="error">{error}</Alert>}
            {loading ? (
              <Stack spacing={2}>
                {[1, 2, 3].map((key) => (
                  <Skeleton key={key} variant="rounded" height={80} animation="wave" />
                ))}
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {overviewItems.map((item) => (
                    <Grid item xs={6} sm={6} key={item.label}>
                      <Stack
                        spacing={1}
                        alignItems="flex-start"
                        sx={{
                          p: { xs: 1.8, sm: 2.2 },
                          borderRadius: 3,
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: { xs: 32, sm: 36 },
                            height: { xs: 32, sm: 36 },
                            bgcolor: `${item.color}20`,
                            color: item.color,
                            border: `1px solid ${item.color}40`,
                          }}
                        >
                          {item.icon}
                        </Avatar>
                        <Box textAlign="left">
                          <Typography
                            variant="overline"
                            sx={{
                              color: DESIGN_TOKENS.textMuted,
                              fontSize: { xs: '0.65rem', sm: '0.72rem' },
                              letterSpacing: '0.04em',
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: DESIGN_TOKENS.fontMono,
                              fontSize: { xs: '1.15rem', sm: '1.3rem' },
                              fontWeight: 700,
                              color: DESIGN_TOKENS.textPrimary,
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                      Прогресс к вчерашнему дню
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700, color: totals.vsYesterday >= 100 ? ROLE_COLORS.rest : ROLE_COLORS.work }}>
                      {totals.vsYesterday}%
                    </Typography>
                  </Box>
                  <Tooltip title={`${totals.vsYesterday}% от вчерашнего дня`} placement="top">
                    <Box>
                      <Progress value={totals.vsYesterday} />
                    </Box>
                  </Tooltip>
                </Stack>
              </Stack>
            )}
          </Card>
        </Grid>

        {/* 2. Today Categories & Donut Balance */}
        <Grid item xs={12} md={6}>
          <Card
            title="Баланс категорий"
            subtitle="Распределение времени за сегодня"
            icon={<PieChartOutlineOutlinedIcon />}
            glowColor="rgba(59, 130, 246, 0.15)"
          >
            {loading && (
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={160} animation="wave" />
              </Stack>
            )}
            {!loading && (!records || Object.keys(records.today || {}).length === 0) && !isDemoMode && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Нет записанных данных за сегодня. Запустите таймер или включите превью.
              </Typography>
            )}
            {((records && Object.keys(records.today || {}).length > 0) || isDemoMode) && (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <DonutChartCanvas segments={donutSegments} size={160} thickness={12} centerLabel="Сегодня" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <List disablePadding sx={{ width: '100%' }}>
                    {donutSegments.map((seg) => {
                      const theme = ROLE_THEMES[seg.role] || ROLE_THEMES.other
                      return (
                        <ListItem
                          key={seg.role}
                          sx={{
                            mb: 1,
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: 'rgba(15, 23, 42, 0.6)',
                            border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                bgcolor: theme.badgeBg,
                                color: theme.primary,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {seg.role.slice(0, 1).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600}>
                                {theme.label}
                              </Typography>
                            }
                          />
                          <Chip
                            size="small"
                            label={`${seg.minutes}м`}
                            sx={{
                              fontFamily: DESIGN_TOKENS.fontMono,
                              fontWeight: 700,
                              bgcolor: theme.badgeBg,
                              color: theme.primary,
                              border: `1px solid ${theme.primary}35`,
                              height: 22,
                            }}
                          />
                        </ListItem>
                      )
                    })}
                  </List>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>

        {/* 3. 24h Timeline Section (with Live Active Sessions) */}
        <Grid item xs={12}>
          <Card
            title="24-часовая временная шкала дня"
            subtitle="Интерактивный хронометраж интервалов (наведите курсор на сегменты)"
            icon={<ViewTimelineOutlinedIcon />}
            glowColor="rgba(16, 185, 129, 0.15)"
          >
            <Timeline24hCanvas sessions={timelineSessions} height={96} />
            <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 1.5 }}>
              {Object.entries(ROLE_THEMES).map(([rKey, theme]) => (
                <Stack key={rKey} direction="row" spacing={0.8} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.primary }} />
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                    {theme.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* 4. Focus & Balance Score Card + Goals (from scratch concept) */}
        <Grid item xs={12} md={6}>
          <Card
            title="Индекс баланса и цели дня"
            subtitle="Соотношение глубокого фокуса и восстановления"
            icon={<FavoriteBorderOutlinedIcon />}
            glowColor="rgba(255, 107, 74, 0.15)"
          >
            <Box
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 2.5,
                bgcolor: 'rgba(15, 23, 42, 0.7)',
                border: `1px solid ${DESIGN_TOKENS.borderColor}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary }}>
                  Индекс фокуса и баланса
                </Typography>
                <Chip
                  size="small"
                  label={`${balanceAnalytics.score.toFixed(1)} / 10`}
                  sx={{
                    fontFamily: DESIGN_TOKENS.fontMono,
                    fontWeight: 800,
                    bgcolor: ROLE_THEMES.work.badgeBg,
                    color: ROLE_THEMES.work.primary,
                    border: `1px solid ${ROLE_THEMES.work.primary}50`,
                  }}
                />
              </Stack>
              <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary, fontSize: '0.82rem', lineHeight: 1.5 }}>
                {balanceAnalytics.feedback}
              </Typography>
            </Box>

            {/* Daily Goal Bars */}
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                    Цель: Работа (норма 6ч)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700 }}>
                    {balanceAnalytics.workMin} / 360 мин
                  </Typography>
                </Box>
                <Progress value={balanceAnalytics.workGoalPct} color={ROLE_COLORS.work} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                    Цель: Изучение (норма 2ч)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700 }}>
                    {balanceAnalytics.learnMin} / 120 мин
                  </Typography>
                </Box>
                <Progress value={balanceAnalytics.learnGoalPct} color={ROLE_COLORS.learn} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                    Отдых и перерывы (норма 1.5ч)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700 }}>
                    {balanceAnalytics.restMin} / 90 мин
                  </Typography>
                </Box>
                <Progress value={balanceAnalytics.restGoalPct} color={ROLE_COLORS.rest} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* 5. Session History Table */}
        <Grid item xs={12} md={6}>
          <Card
            title="Журнал сессий за сегодня"
            subtitle="Хронология выполненных интервалов"
            icon={<HistoryEduOutlinedIcon />}
          >
            <TableContainer sx={{ maxHeight: 270, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'rgba(15, 23, 42, 0.95)', color: DESIGN_TOKENS.textMuted, fontSize: '0.72rem', fontWeight: 700 } }}>
                    <TableCell>Роль</TableCell>
                    <TableCell>Задача</TableCell>
                    <TableCell>Время</TableCell>
                    <TableCell align="right">Длит.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timelineSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: DESIGN_TOKENS.textMuted }}>
                        Нет записанных сессий за сегодня
                      </TableCell>
                    </TableRow>
                  ) : (
                    timelineSessions.map((sess) => {
                      const theme = ROLE_THEMES[sess.role] || ROLE_THEMES.other
                      return (
                        <TableRow
                          key={sess.id}
                          sx={{
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                            '& td': { borderColor: DESIGN_TOKENS.borderColor, py: 1.2 },
                          }}
                        >
                          <TableCell>
                            <Chip
                              size="small"
                              label={theme.label}
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: theme.badgeBg,
                                color: theme.primary,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: DESIGN_TOKENS.textPrimary, fontWeight: 600, maxWidth: 140 }}>
                            <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                              {sess.taskName} {sess.isLive && '●'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: DESIGN_TOKENS.fontMono, color: DESIGN_TOKENS.textSecondary, fontSize: '0.75rem' }}>
                            {formatSecToTime(sess.startSeconds)} - {formatSecToTime(sess.startSeconds + sess.durationSeconds)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700, color: theme.primary, fontSize: '0.75rem' }}>
                            {Math.round(sess.durationSeconds / 60)}м
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* 6. Weekly Analytics */}
        <Grid item xs={12}>
          <Card title="Недельная аналитика" subtitle="Продуктивность, цели и логи за неделю" icon={<AssessmentOutlinedIcon />}>
            {loading ? (
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={60} animation="wave" />
                <Skeleton variant="rounded" height={240} animation="wave" />
              </Stack>
            ) : !weeklyStats ? (
              <Typography color="text.secondary">Недельная статистика недоступна</Typography>
            ) : (
              <Stack spacing={3}>
                {/* Insights overview tiles */}
                {insights && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: 'rgba(15, 23, 42, 0.7)',
                          border: `1px solid ${ROLE_COLORS.work}30`,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: `${ROLE_COLORS.work}20`, color: ROLE_COLORS.work, border: `1px solid ${ROLE_COLORS.work}40` }}>
                            <AccessTimeOutlinedIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted }}>
                              Фокус за неделю
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: DESIGN_TOKENS.fontMono }}>
                              {insights.totalFocus} мин
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: 'rgba(15, 23, 42, 0.7)',
                          border: `1px solid ${ROLE_COLORS.rest}30`,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: `${ROLE_COLORS.rest}20`, color: ROLE_COLORS.rest, border: `1px solid ${ROLE_COLORS.rest}40` }}>
                            <TrendingUpOutlinedIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted }}>
                              Выполнение целей
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: DESIGN_TOKENS.fontMono }}>
                              {insights.overallCompletion}%
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: 'rgba(15, 23, 42, 0.7)',
                          border: `1px solid ${ROLE_COLORS.learn}30`,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: `${ROLE_COLORS.learn}20`, color: ROLE_COLORS.learn, border: `1px solid ${ROLE_COLORS.learn}40` }}>
                            <EventNoteOutlinedIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted }}>
                              Лучший день
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize', fontFamily: DESIGN_TOKENS.fontMono }}>
                              {insights.bestDayName} ({insights.bestDayMinutes}м)
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* Visualizations Tabs */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={7} lg={8}>
                    <Box sx={{ borderBottom: 1, borderColor: DESIGN_TOKENS.borderColor, mb: 2 }}>
                      <Tabs value={weeklyTab} onChange={(_, v) => setWeeklyTab(v)} textColor="secondary" indicatorColor="secondary">
                        <Tab label="График активности" icon={<BarChartOutlinedIcon fontSize="small" />} iconPosition="start" />
                        <Tab label="Цели ролей" icon={<TrendingUpOutlinedIcon fontSize="small" />} iconPosition="start" />
                        <Tab label="Задачи недели" icon={<TimelineOutlinedIcon fontSize="small" />} iconPosition="start" />
                      </Tabs>
                    </Box>

                    {/* Tab 0: Stacked Bar Chart */}
                    {weeklyTab === 0 && (
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            height: 240,
                            pt: 2,
                            pb: 1,
                            position: 'relative',
                          }}
                        >
                          {weeklyStats.days.map((day, idx) => {
                            const work = day.roles.work || 0
                            const learn = day.roles.learn || 0
                            const rest = day.roles.rest || 0
                            const totalRoles = work + learn + rest
                            const other = Math.max(0, day.total_done - totalRoles)
                            const isSelected = selectedDayIndex === idx

                            return (
                              <Box
                                key={day.day}
                                onClick={() => setSelectedDayIndex(idx)}
                                sx={{
                                  flex: 1,
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'flex-end',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  px: { xs: 0.2, sm: 0.5 },
                                  py: 0.5,
                                  borderRadius: 2,
                                  bgcolor: isSelected ? 'rgba(255, 107, 74, 0.12)' : 'transparent',
                                  border: isSelected ? `1px solid ${ROLE_COLORS.work}60` : '1px solid transparent',
                                  '&:hover': {
                                    bgcolor: isSelected ? 'rgba(255, 107, 74, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: { xs: 14, sm: 20, md: 28 },
                                    height: `${(day.total_done / maxDayDone) * 100}%`,
                                    display: 'flex',
                                    flexDirection: 'column-reverse',
                                    borderRadius: '4px 4px 0 0',
                                    overflow: 'hidden',
                                    minHeight: day.total_done > 0 ? 6 : 0,
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                  }}
                                >
                                  {work > 0 && (
                                    <Tooltip title={`Работа: ${work} мин`} placement="top" arrow>
                                      <Box sx={{ height: `${(work / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.work }} />
                                    </Tooltip>
                                  )}
                                  {learn > 0 && (
                                    <Tooltip title={`Изучение: ${learn} мин`} placement="top" arrow>
                                      <Box sx={{ height: `${(learn / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.learn }} />
                                    </Tooltip>
                                  )}
                                  {rest > 0 && (
                                    <Tooltip title={`Отдых: ${rest} мин`} placement="top" arrow>
                                      <Box sx={{ height: `${(rest / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.rest }} />
                                    </Tooltip>
                                  )}
                                  {other > 0 && (
                                    <Tooltip title={`Другое: ${other} мин`} placement="top" arrow>
                                      <Box sx={{ height: `${(other / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.other }} />
                                    </Tooltip>
                                  )}
                                </Box>

                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    mt: 1,
                                    textTransform: 'capitalize',
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                    color: isSelected ? ROLE_COLORS.work : DESIGN_TOKENS.textPrimary,
                                  }}
                                >
                                  {day.day.slice(0, 3)}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontSize: '0.65rem', color: DESIGN_TOKENS.textMuted }}>
                                  {day.total_done}м
                                </Typography>
                              </Box>
                            )
                          })}
                        </Box>

                        {/* Chart Legend */}
                        <Stack direction="row" spacing={2} justifyContent="center">
                          {Object.entries(ROLE_THEMES).map(([rKey, theme]) => (
                            <Stack key={rKey} direction="row" spacing={0.8} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.primary }} />
                              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontWeight: 600 }}>
                                {theme.label}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    )}

                    {/* Tab 1: Weekly Targets */}
                    {weeklyTab === 1 && (
                      <Box sx={{ pr: 1 }}>
                        {weeklyStats.weekly_targets.length === 0 ? (
                          <Typography color="text.secondary">Цели на неделю не настроены</Typography>
                        ) : (
                          weeklyStats.weekly_targets
                            .sort((a, b) => b.time_done - a.time_done)
                            .map((target) => {
                              const pct = target.time_duration ? (target.time_done / target.time_duration) * 100 : 0
                              const theme = ROLE_THEMES[target.role] || ROLE_THEMES.other
                              return (
                                <Box key={target.role} sx={{ mb: 2.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                      <Avatar
                                        sx={{
                                          width: 26,
                                          height: 26,
                                          bgcolor: theme.badgeBg,
                                          color: theme.primary,
                                          fontSize: '0.75rem',
                                          fontWeight: 800,
                                        }}
                                      >
                                        {target.role.slice(0, 1).toUpperCase()}
                                      </Avatar>
                                      <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                        {theme.label}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700, color: DESIGN_TOKENS.textSecondary }}>
                                      {target.time_done} / {target.time_duration} мин ({Math.round(pct)}%)
                                    </Typography>
                                  </Box>
                                  <Progress value={pct} />
                                </Box>
                              )
                            })
                        )}
                      </Box>
                    )}

                    {/* Tab 2: Weekly Tasks */}
                    {weeklyTab === 2 && (
                      <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
                        {weeklyStats.weekly_tasks.length === 0 ? (
                          <Typography color="text.secondary">Нет задач за эту неделю</Typography>
                        ) : (
                          weeklyStats.weekly_tasks
                            .sort((a, b) => b.time_done - a.time_done)
                            .map((task) => {
                              const pct = task.time_duration ? (task.time_done / task.time_duration) * 100 : 0
                              return (
                                <Box key={task.name} sx={{ mb: 2.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                    <Box sx={{ minWidth: 0, mr: 2 }}>
                                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                                        {task.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
                                        роль: {task.role}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, fontWeight: 700, color: DESIGN_TOKENS.textSecondary }}>
                                      {task.time_done} / {task.time_duration} мин ({Math.round(pct)}%)
                                    </Typography>
                                  </Box>
                                  <Progress value={pct} />
                                </Box>
                              )
                            })
                        )}
                      </Box>
                    )}
                  </Grid>

                  {/* Right Panel: Day Details */}
                  <Grid item xs={12} md={5} lg={4}>
                    {(() => {
                      const day = weeklyStats.days[selectedDayIndex]
                      if (!day) return null
                      return (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            height: '100%',
                            minHeight: 280,
                            bgcolor: 'rgba(15, 23, 42, 0.6)',
                            borderColor: DESIGN_TOKENS.borderColor,
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="h6" fontWeight={800} sx={{ textTransform: 'capitalize', lineHeight: 1.2 }}>
                              {day.day}
                            </Typography>
                            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
                              {day.date} • {day.total_done} мин выполнено
                            </Typography>
                          </Box>

                          <Divider sx={{ mb: 2, borderColor: DESIGN_TOKENS.borderColor }} />

                          <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 220 }}>
                            {day.tasks.length === 0 ? (
                              <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
                                Нет задач за этот день
                              </Typography>
                            ) : (
                              <List disablePadding>
                                {day.tasks
                                  .sort((a, b) => b.time_done - a.time_done)
                                  .map((t) => {
                                    const pct = t.time_duration ? (t.time_done / t.time_duration) * 100 : 0
                                    const roleColor = ROLE_COLORS[t.role] || ROLE_COLORS.other
                                    return (
                                      <ListItem key={t.name} disableGutters sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 1.8, p: 0, bgcolor: 'transparent', border: 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: roleColor, flexShrink: 0 }} />
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                              {t.name}
                                            </Typography>
                                          </Box>
                                          <Typography variant="caption" sx={{ fontFamily: DESIGN_TOKENS.fontMono, color: DESIGN_TOKENS.textSecondary }}>
                                            {t.time_done}/{t.time_duration}м
                                          </Typography>
                                        </Box>
                                        <Progress value={pct} />
                                      </ListItem>
                                    )
                                  })}
                              </List>
                            )}
                          </Box>
                        </Paper>
                      )
                    })()}
                  </Grid>
                </Grid>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
