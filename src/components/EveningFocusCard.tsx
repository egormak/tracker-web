import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import NightlightRoundIcon from '@mui/icons-material/NightlightRound'
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded'
import { api, EveningFocusResponse, EveningFocusCandidate } from '../api/client'
import { ROLE_THEMES, DESIGN_TOKENS } from '../constants/themeColors'

interface EveningFocusCardProps {
  onStartTask?: (taskName: string, role: string, duration?: number) => void
}

export const EveningFocusCard: React.FC<EveningFocusCardProps> = ({ onStartTask }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(true)
  const [data, setData] = useState<EveningFocusResponse | null>(null)
  const [sprintTime, setSprintTime] = useState<number>(20)
  const [comboDuration, setComboDuration] = useState<number>(10)

  const fetchFocus = async (time: number = sprintTime) => {
    setLoading(true)
    try {
      const res = await api.getEveningFocus(undefined, time)
      setData(res.data)
    } catch (e) {
      console.error('Failed to fetch evening focus', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFocus(sprintTime)
  }, [sprintTime])

  const topCandidates = (data?.candidates || []).slice(0, 3)
  const isEmpty = !data || topCandidates.length === 0 || (!data.current_task?.task_name && topCandidates.length === 0)

  const handleStartCandidate = (candidate: EveningFocusCandidate) => {
    const taskRole = candidate.role || 'work'
    if (onStartTask) {
      onStartTask(candidate.task_name, taskRole, sprintTime)
    } else {
      api
        .startTask({
          task_name: candidate.task_name,
          role: taskRole,
          target_duration: sprintTime,
        })
        .then(() => {
          navigate(
            `/timer?task=${encodeURIComponent(candidate.task_name)}&role=${encodeURIComponent(
              taskRole
            )}&target=${sprintTime}`
          )
        })
        .catch((e) => console.error('Failed to start task', e))
    }
  }

  const handleSkipCandidate = async (candidateTaskName: string) => {
    setLoading(true)
    try {
      const res = await api.skipEveningFocus(candidateTaskName, undefined, sprintTime)
      setData(res.data)
    } catch (e) {
      console.error('Failed to skip evening focus candidate', e)
      await fetchFocus(sprintTime)
    } finally {
      setLoading(false)
    }
  }

  const handleLaunchCombo = () => {
    if (topCandidates.length === 0) return
    const comboPayload = topCandidates.map((c) => ({
      taskName: c.task_name,
      role: c.role || 'work',
      duration: comboDuration,
    }))
    navigate(`/timer?combo=${encodeURIComponent(JSON.stringify(comboPayload))}`)
  }

  const renderRankBadge = (idx: number) => {
    if (idx === 0) {
      return (
        <Chip
          label="#1 Топ дефицит"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.72rem',
            bgcolor: 'rgba(245, 158, 11, 0.2)',
            color: '#FBBF24',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)',
          }}
        />
      )
    }
    return (
      <Chip
        label={`#${idx + 1}`}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.72rem',
          bgcolor: 'rgba(255, 255, 255, 0.06)',
          color: DESIGN_TOKENS.textSecondary,
          border: `1px solid ${DESIGN_TOKENS.borderColor}`,
        }}
      />
    )
  }

  return (
    <Card
      sx={{
        mb: 3,
        bgcolor: 'rgba(19, 27, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: 3.5,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(139, 92, 246, 0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <NightlightRoundIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', color: DESIGN_TOKENS.textPrimary }}>
                Режим вечернего добора (Evening Focus 2.0)
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary }}>
                Топ-3 спринта для закрытия недельного дефицита
              </Typography>
            </Box>
          </Stack>

          {data?.rest_pool !== undefined && data.rest_pool > 0 && (
            <Chip
              size="small"
              label={`⏱️ Лимит отдыха: ${data.rest_pool} мин`}
              sx={{
                bgcolor: 'rgba(139, 92, 246, 0.15)',
                color: '#DDD6FE',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontSize: '0.75rem',
              }}
            />
          )}
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} sx={{ color: '#A78BFA' }} />
          </Box>
        ) : isEmpty ? (
          <Typography variant="body2" sx={{ color: ROLE_THEMES.rest.light, py: 2, fontWeight: 500 }}>
            🎉 Отличная работа! Все задачи на эту неделю закрыты по плану.
          </Typography>
        ) : (
          <>
            {/* Toolbar: Sprint Duration chips & Sequential Combo Launcher */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{
                mb: 2.5,
                p: 1.5,
                bgcolor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 2.5,
                border: `1px solid ${DESIGN_TOKENS.borderColor}`,
              }}
            >
              {/* Duration selector chips */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                  Длительность спринта:
                </Typography>
                {[15, 20, 30].map((t) => (
                  <Chip
                    key={t}
                    label={`${t} мин`}
                    size="small"
                    onClick={() => setSprintTime(t)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: sprintTime === t ? 700 : 500,
                      bgcolor: sprintTime === t ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: sprintTime === t ? '#DDD6FE' : DESIGN_TOKENS.textSecondary,
                      border: sprintTime === t ? '1px solid rgba(139, 92, 246, 0.5)' : `1px solid ${DESIGN_TOKENS.borderColor}`,
                    }}
                  />
                ))}
              </Stack>

              {/* Sequential Combo Sprint Chain Launcher */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                    Комбо:
                  </Typography>
                  {[10, 15].map((cd) => (
                    <Chip
                      key={cd}
                      label={`${cd}м`}
                      size="small"
                      onClick={() => setComboDuration(cd)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: comboDuration === cd ? 700 : 500,
                        bgcolor: comboDuration === cd ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: comboDuration === cd ? '#F472B6' : DESIGN_TOKENS.textSecondary,
                        border: comboDuration === cd ? '1px solid rgba(236, 72, 153, 0.5)' : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  ))}
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FlashOnRoundedIcon />}
                  disabled={topCandidates.length === 0}
                  onClick={handleLaunchCombo}
                  sx={{
                    bgcolor: '#EC4899',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
                    '&:hover': { bgcolor: '#DB2777' },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  ⚡️ Запустить комбо-цепочку {topCandidates.length}x{comboDuration}м
                </Button>
              </Stack>
            </Stack>

            {/* 3-Card Grid */}
            <Grid container spacing={2}>
              {topCandidates.map((candidate, idx) => {
                const roleTheme = ROLE_THEMES[candidate.role] || ROLE_THEMES.work
                const done = candidate.weekly_done || 0
                const target = candidate.weekly_target || 0
                const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0

                return (
                  <Grid item xs={12} md={4} key={candidate.task_name}>
                    <Box
                      sx={{
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        bgcolor: 'rgba(15, 23, 42, 0.8)',
                        border: idx === 0 ? '1px solid rgba(139, 92, 246, 0.5)' : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        borderRadius: 2.5,
                        boxShadow: idx === 0 ? '0 8px 24px rgba(139, 92, 246, 0.15)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: idx === 0 ? 'rgba(139, 92, 246, 0.8)' : 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box>
                        {/* Header: Rank badge & Role chip */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                          {renderRankBadge(idx)}
                          <Chip
                            label={roleTheme.label}
                            size="small"
                            sx={{
                              bgcolor: roleTheme.badgeBg,
                              color: roleTheme.primary,
                              fontWeight: 700,
                              border: `1px solid ${roleTheme.primary}40`,
                              fontSize: '0.72rem',
                              height: 22,
                            }}
                          />
                        </Stack>

                        {/* Task Name */}
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          title={candidate.task_name}
                          sx={{
                            color: idx === 0 ? '#67E8F9' : DESIGN_TOKENS.textPrimary,
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            mb: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '2.6em',
                          }}
                        >
                          🎯 {candidate.task_name}
                        </Typography>

                        {/* Weekly Progress Bar */}
                        <Box sx={{ mb: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary, fontSize: '0.72rem' }}>
                              📊 {candidate.weekly_done || 0} / {candidate.weekly_target || 0} мин (дефицит {candidate.weekly_gap} мин)
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: roleTheme.primary,
                                fontWeight: 700,
                                fontFamily: DESIGN_TOKENS.fontMono,
                                fontSize: '0.72rem',
                              }}
                            >
                              {pct}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(255, 255, 255, 0.08)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: roleTheme.primary,
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Action buttons per card */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleStartCandidate(candidate)}
                          sx={{
                            py: 0.8,
                            bgcolor: idx === 0 ? '#7C3AED' : 'rgba(139, 92, 246, 0.85)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                            '&:hover': { bgcolor: '#8B5CF6' },
                          }}
                        >
                          ▶️ {sprintTime}м
                        </Button>
                        <Tooltip title="Пропустить задачу">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSkipCandidate(candidate.task_name)}
                            sx={{
                              minWidth: 40,
                              px: 1,
                              py: 0.8,
                              color: '#DDD6FE',
                              borderColor: 'rgba(139, 92, 246, 0.3)',
                              '&:hover': { borderColor: 'rgba(139, 92, 246, 0.6)', bgcolor: 'rgba(139, 92, 246, 0.1)' },
                            }}
                          >
                            <SkipNextIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  )
}
