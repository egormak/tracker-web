import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
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
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import NightlightRoundOutlinedIcon from '@mui/icons-material/NightlightRoundOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import { api, RestTimeResponse, RecordsSummary, TaskResult, WeeklyStatsResponse } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'
import Progress from '../components/Progress'
import { formatRestMinutes } from '../utils/format'

export default function Dashboard() {
  const [records, setRecords] = useState<RecordsSummary | null>(null)
  const [rest, setRest] = useState<RestTimeResponse | null>(null)
  const [tasks, setTasks] = useState<TaskResult[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null)
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
        const [rec, r, tl, ws] = await Promise.all([
          api.getRecordsSummary(),
          api.restGet(),
          api.getStatsTasksToday(),
          api.getWeeklyStats(),
        ])
        if (!mounted) return
        setRecords(rec)
        setRest(r)
        setTasks(tl)
        setWeeklyStats(ws)
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

  const ROLE_COLORS: Record<string, string> = {
    work: '#6366f1', // Indigo
    learn: '#10b981', // Emerald green
    rest: '#f59e0b', // Amber yellow/orange
    other: '#94a3b8'  // Slate grey
  }

  const insights = useMemo(() => {
    if (!weeklyStats) return null

    let totalFocus = 0
    let totalScheduled = 0
    let totalDone = 0

    weeklyStats.weekly_targets.forEach(t => {
      if (t.role === 'work' || t.role === 'learn') {
        totalFocus += t.time_done
      }
      totalScheduled += t.time_duration
      totalDone += t.time_done
    })

    const overallCompletion = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0

    let bestDay = weeklyStats.days[0]
    weeklyStats.days.forEach(d => {
      if (d.total_done > (bestDay?.total_done || 0)) {
        bestDay = d
      }
    })

    return {
      totalFocus,
      overallCompletion,
      bestDayName: bestDay ? bestDay.day : 'N/A',
      bestDayMinutes: bestDay ? bestDay.total_done : 0,
      bestDayDate: bestDay ? bestDay.date : ''
    }
  }, [weeklyStats])

  const maxDayDone = useMemo(() => {
    if (!weeklyStats) return 60
    return Math.max(...weeklyStats.days.map(d => d.total_done), 60)
  }, [weeklyStats])

  const totals = useMemo(() => {
    const sum = (m?: Record<string, number>) => Object.values(m || {}).reduce((a, b) => a + b, 0)
    const today = sum(records?.today)
    const yesterday = sum(records?.yesterday)
    const all = sum(records?.all)
    const vsYesterday = yesterday ? Math.round((today / yesterday) * 100) : 0
    return { today, yesterday, all, vsYesterday }
  }, [records])

  const overviewItems = [
    {
      label: 'Total Today',
      value: `${totals.today} min`,
      icon: <AccessTimeOutlinedIcon fontSize="small" />,
    },
    {
      label: 'Yesterday',
      value: `${totals.yesterday} min`,
      icon: <HistoryToggleOffOutlinedIcon fontSize="small" />,
      align: 'flex-end' as const,
    },
    {
      label: 'All Time',
      value: `${totals.all} min`,
      icon: <TimelineOutlinedIcon fontSize="small" />,
    },
    rest && {
      label: 'Rest available',
      value: `${formatRestMinutes(rest.rest_time)} min`,
      icon: <NightlightRoundOutlinedIcon fontSize="small" />,
    },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: ReactNode; align?: 'flex-start' | 'flex-end' }>

  return (
    <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
      <Grid item xs={12} md={6}>
        <Card title="Overview" subtitle="Today summary" icon={<TaskAltOutlinedIcon />}>
          {error && <Alert type="error">{error}</Alert>}
          {loading ? (
            <Stack spacing={2.5}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} variant="rounded" height={84} animation="wave" />
              ))}
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {overviewItems.map((item) => {
                  return (
                    <Grid item xs={6} sm={6} key={item.label}>
                      <Stack
                        spacing={1}
                        alignItems="flex-start"
                        sx={{
                          p: { xs: 1.8, sm: 2.2 },
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(8, 20, 38, 0.4))',
                          border: '1px solid rgba(99, 102, 241, 0.22)',
                        }}
                      >
                        <Avatar
                          sx={{
                            width: { xs: 32, sm: 38 },
                            height: { xs: 32, sm: 38 },
                            bgcolor: 'rgba(99, 102, 241, 0.2)',
                            color: 'primary.main',
                          }}
                        >
                          {item.icon}
                        </Avatar>
                        <Box textAlign="left">
                          <Typography variant="overline" color="text.secondary" letterSpacing={0.6} sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            {item.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 700 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )
                })}
              </Grid>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Today vs Yesterday
                </Typography>
                <Tooltip title={`${totals.vsYesterday}% of yesterday`} placement="top">
                  <Box>
                    <Progress value={totals.vsYesterday} />
                  </Box>
                </Tooltip>
                <Chip
                  label={`${totals.vsYesterday}% of yesterday`}
                  size="small"
                  color={totals.vsYesterday >= 100 ? 'secondary' : 'default'}
                  sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(99, 102, 241, 0.16)' }}
                />
              </Stack>
            </Stack>
          )}
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card title="Today Records" subtitle="Per category (aggregated)" icon={<CategoryOutlinedIcon />}>
          {loading && (
            <Stack spacing={2.5}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} variant="rounded" height={68} animation="wave" />
              ))}
            </Stack>
          )}
          {!loading && (!records || Object.keys(records.today || {}).length === 0) && (
            <Typography color="text.secondary">No data</Typography>
          )}
          {!loading && records && (
            <List disablePadding>
              {Object.entries(records.today)
                .sort((a, b) => b[1] - a[1])
                .map(([name, minutes], index, arr) => (
                  <ListItem
                    key={name}
                    sx={{
                      mb: index === arr.length - 1 ? 0 : 1.5,
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.22)', color: 'primary.main' }}>
                        {name.slice(0, 1).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {name}
                        </Typography>
                      }
                    />
                    <Chip label={`${minutes} min`} color="secondary" variant="outlined" />
                  </ListItem>
                ))}
            </List>
          )}
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card title="Tasks by Plan" subtitle="Planned vs done (today)" icon={<TaskAltOutlinedIcon />}>
          {loading && (
            <Stack spacing={2.5}>
              {[1, 2, 3].map((key) => (
                <Skeleton key={key} variant="rounded" height={76} animation="wave" />
              ))}
            </Stack>
          )}
          {!loading && tasks.length === 0 && (
            <Typography color="text.secondary">No tasks</Typography>
          )}
          {!loading && tasks.length > 0 && (
            <List disablePadding>
              {tasks.map((t, index) => {
                const pct = t.time_duration ? (t.time_done / t.time_duration) * 100 : 0
                const intensity = Math.min(100, Math.max(0, pct)) / 100
                return (
                  <ListItem
                    key={t.name}
                    sx={{
                      mb: index === tasks.length - 1 ? 0 : 1.5,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 1.5,
                      p: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: `rgba(99, 102, 241, ${0.16 + intensity * 0.3})`,
                            color: 'primary.main',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                          }}
                        >
                          {t.role.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ lineHeight: 1.2 }}>
                            {t.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={`priority ${t.priority}`}
                              variant="outlined"
                              sx={{ 
                                borderColor: 'rgba(99, 102, 241, 0.3)', 
                                height: 18, 
                                fontSize: '0.65rem',
                                '& .MuiChip-label': { px: 0.8 } 
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" noWrap>
                              role: {t.role}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>

                      <Stack spacing={0.5} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                          {t.time_done} / {t.time_duration} min
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(pct)}% done`}
                          color={pct >= 100 ? 'secondary' : 'default'}
                          sx={{ 
                            bgcolor: pct >= 100 ? 'secondary.main' : 'rgba(99, 102, 241, 0.12)',
                            color: pct >= 100 ? 'background.default' : 'text.primary',
                            height: 18,
                            fontSize: '0.65rem',
                            '& .MuiChip-label': { px: 0.8, fontWeight: 600 }
                          }}
                        />
                      </Stack>
                    </Box>

                    <Tooltip title={`${Math.round(pct)}% complete`} placement="top">
                      <Box width="100%">
                        <Progress value={pct} />
                      </Box>
                    </Tooltip>
                  </ListItem>
                )
              })}
            </List>
          )}
        </Card>
      </Grid>

      {/* Weekly Statistics Dashboard Section */}
      <Grid item xs={12}>
        <Card title="Weekly Analytics" subtitle="Overall performance, targets, and daily logs" icon={<AssessmentOutlinedIcon />}>
          {loading ? (
            <Stack spacing={2.5}>
              <Skeleton variant="rounded" height={60} animation="wave" />
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Skeleton variant="rounded" height={260} animation="wave" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Skeleton variant="rounded" height={260} animation="wave" />
                </Grid>
              </Grid>
            </Stack>
          ) : !weeklyStats ? (
            <Typography color="text.secondary">No weekly statistics available</Typography>
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
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(8, 20, 38, 0.2))',
                        borderColor: 'rgba(99, 102, 241, 0.15)',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                          <AccessTimeOutlinedIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="overline" color="text.secondary" letterSpacing={0.5}>
                            Weekly Focus Time
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {insights.totalFocus} min
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
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(8, 20, 38, 0.2))',
                        borderColor: 'rgba(16, 185, 129, 0.15)',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          <TrendingUpOutlinedIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="overline" color="text.secondary" letterSpacing={0.5}>
                            Goal Completion Rate
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
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
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(8, 20, 38, 0.2))',
                        borderColor: 'rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                          <EventNoteOutlinedIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="overline" color="text.secondary" letterSpacing={0.5}>
                            Best Day
                          </Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                            {insights.bestDayName} ({insights.bestDayMinutes}m)
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Main content grid */}
              <Grid container spacing={3}>
                {/* Left Panel: Tabs and Data Visualizations */}
                <Grid item xs={12} md={7} lg={8}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={weeklyTab} onChange={(_, v) => setWeeklyTab(v)} textColor="secondary" indicatorColor="secondary">
                      <Tab label="Activity Chart" icon={<BarChartOutlinedIcon fontSize="small" />} iconPosition="start" />
                      <Tab label="Weekly Targets" icon={<TrendingUpOutlinedIcon fontSize="small" />} iconPosition="start" />
                      <Tab label="Weekly Tasks" icon={<TimelineOutlinedIcon fontSize="small" />} iconPosition="start" />
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
                                bgcolor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                border: isSelected ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                                '&:hover': {
                                  bgcolor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
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
                                  <Tooltip title={`Work: ${work} min`} placement="top" arrow>
                                    <Box sx={{ height: `${(work / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.work }} />
                                  </Tooltip>
                                )}
                                {learn > 0 && (
                                  <Tooltip title={`Learn: ${learn} min`} placement="top" arrow>
                                    <Box sx={{ height: `${(learn / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.learn }} />
                                  </Tooltip>
                                )}
                                {rest > 0 && (
                                  <Tooltip title={`Rest: ${rest} min`} placement="top" arrow>
                                    <Box sx={{ height: `${(rest / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.rest }} />
                                  </Tooltip>
                                )}
                                {other > 0 && (
                                  <Tooltip title={`Other: ${other} min`} placement="top" arrow>
                                    <Box sx={{ height: `${(other / day.total_done) * 100}%`, bgcolor: ROLE_COLORS.other }} />
                                  </Tooltip>
                                )}
                              </Box>

                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  mt: 1,
                                  textTransform: 'capitalize',
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  color: isSelected ? 'primary.main' : 'text.primary',
                                }}
                              >
                                {day.day.slice(0, 3)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                {day.total_done}m
                              </Typography>
                            </Box>
                          )
                        })}
                      </Box>

                      {/* Chart Legend */}
                      <Stack direction="row" spacing={2} justifyContent="center">
                        {Object.entries(ROLE_COLORS).map(([role, color]) => (
                          <Stack key={role} direction="row" spacing={0.8} alignItems="center">
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                            <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 500, color: 'text.secondary' }}>
                              {role}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  )}

                  {/* Tab 1: Weekly Targets Per Role */}
                  {weeklyTab === 1 && (
                    <Box sx={{ pr: 1 }}>
                      {weeklyStats.weekly_targets.length === 0 ? (
                        <Typography color="text.secondary">No targets configured for this week</Typography>
                      ) : (
                        weeklyStats.weekly_targets
                          .sort((a, b) => b.time_done - a.time_done)
                          .map((target) => {
                            const pct = target.time_duration ? (target.time_done / target.time_duration) * 100 : 0
                            const roleColor = ROLE_COLORS[target.role] || ROLE_COLORS.other
                            return (
                              <Box key={target.role} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        bgcolor: `rgba(${target.role === 'work' ? '99, 102, 241' : target.role === 'learn' ? '16, 185, 129' : '245, 158, 11'}, 0.15)`,
                                        color: roleColor,
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {target.role.slice(0, 1).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                      {target.role}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                    {target.time_done} / {target.time_duration} min {target.time_duration > 0 && `(${Math.round(pct)}%)`}
                                  </Typography>
                                </Box>
                                <Progress value={pct} />
                              </Box>
                            )
                          })
                      )}
                    </Box>
                  )}

                  {/* Tab 2: Weekly Tasks Summary */}
                  {weeklyTab === 2 && (
                    <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
                      {weeklyStats.weekly_tasks.length === 0 ? (
                        <Typography color="text.secondary">No tasks logged this week</Typography>
                      ) : (
                        weeklyStats.weekly_tasks
                          .sort((a, b) => b.time_done - a.time_done)
                          .map((task) => {
                            const pct = task.time_duration ? (task.time_done / task.time_duration) * 100 : 0
                            return (
                              <Box key={task.name} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                  <Box sx={{ minWidth: 0, mr: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                                      {task.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      role: {task.role}
                                    </Typography>
                                  </Box>
                                  <Typography variant="subtitle2" fontWeight={600} sx={{ flexShrink: 0 }} color="text.secondary">
                                    {task.time_done} / {task.time_duration} min {task.time_duration > 0 && `(${Math.round(pct)}%)`}
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
                          bgcolor: 'rgba(255, 255, 255, 0.01)',
                          borderColor: 'rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize', lineHeight: 1.2 }}>
                            {day.day}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {day.date} • {day.total_done} min logged
                          </Typography>
                        </Box>

                        <Divider sx={{ mb: 2, opacity: 0.5 }} />

                        <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 240 }}>
                          {day.tasks.length === 0 ? (
                            <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic', mt: 2, textAlign: 'center' }}>
                              No tasks logged on this day
                            </Typography>
                          ) : (
                            <List disablePadding>
                              {day.tasks
                                .sort((a, b) => b.time_done - a.time_done)
                                .map((t) => {
                                  const pct = t.time_duration ? (t.time_done / t.time_duration) * 100 : 0
                                  const roleColor = ROLE_COLORS[t.role] || ROLE_COLORS.other
                                  return (
                                    <ListItem key={t.name} disableGutters sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 0 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8, gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: roleColor, flexShrink: 0 }} />
                                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                                            {t.name}
                                          </Typography>
                                        </Box>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ flexShrink: 0 }}>
                                          {t.time_done} / {t.time_duration}m
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
  )
}
