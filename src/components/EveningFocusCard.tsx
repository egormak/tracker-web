import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Typography, Button, Box, Chip, Stack, CircularProgress } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import NightlightRoundIcon from '@mui/icons-material/NightlightRound'
import { api, EveningFocusResponse } from '../api/client'
import { ROLE_THEMES, DESIGN_TOKENS } from '../constants/themeColors'

interface EveningFocusCardProps {
  onStartTask?: (taskName: string, role: string, duration?: number) => void
}

export const EveningFocusCard: React.FC<EveningFocusCardProps> = ({ onStartTask }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(true)
  const [data, setData] = useState<EveningFocusResponse | null>(null)
  const [sprintTime, setSprintTime] = useState<number>(20)

  const fetchFocus = async (time: number = sprintTime) => {
    setLoading(true)
    try {
      const res = await api.getEveningFocus(undefined, time)
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFocus(sprintTime)
  }, [sprintTime])

  const handleSkip = async () => {
    if (!data?.current_task?.task_name) return
    setLoading(true)
    try {
      const res = await api.skipEveningFocus(data.current_task.task_name, undefined, sprintTime)
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const currentTask = data?.current_task

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
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
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
              Режим вечернего добора (Evening Focus)
            </Typography>
            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textSecondary }}>
              Спринты для закрытия недельного дефицита
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} sx={{ color: '#A78BFA' }} />
          </Box>
        ) : !currentTask || !currentTask.task_name ? (
          <Typography variant="body2" sx={{ color: ROLE_THEMES.rest.light, py: 1.5, fontWeight: 500 }}>
            🎉 Отличная работа! Все задачи на эту неделю закрыты по плану.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                my: 2,
                p: 2,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                border: `1px solid ${DESIGN_TOKENS.borderColor}`,
                borderRadius: 2.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#67E8F9' }}>
                🎯 Рекомендуемая задача: {currentTask.task_name}
              </Typography>
              <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary, mt: 0.5 }}>
                📊 Сделано за неделю: {currentTask.weekly_done ?? 0} мин {currentTask.weekly_target ? `(план ${currentTask.weekly_target} мин)` : ''} &nbsp;|&nbsp; ⏱️ Лимит отдыха: {data?.rest_pool} мин
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
                Длительность:
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

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  if (!currentTask?.task_name) return
                  const taskRole = currentTask.role || 'work'
                  if (onStartTask) {
                    onStartTask(currentTask.task_name, taskRole, sprintTime)
                  } else {
                    api
                      .startTask({
                        task_name: currentTask.task_name,
                        role: taskRole,
                        target_duration: sprintTime,
                      })
                      .then(() => {
                        navigate(
                          `/timer?task=${encodeURIComponent(currentTask.task_name)}&role=${encodeURIComponent(
                            taskRole
                          )}&target=${sprintTime}`
                        )
                      })
                      .catch((e) => console.error('Failed to start task', e))
                  }
                }}
                sx={{
                  bgcolor: '#7C3AED',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                  '&:hover': { bgcolor: '#8B5CF6' },
                }}
              >
                Начать {sprintTime}м спринт
              </Button>

              <Button
                variant="outlined"
                startIcon={<SkipNextIcon />}
                onClick={handleSkip}
                sx={{
                  color: '#DDD6FE',
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                  '&:hover': { borderColor: 'rgba(139, 92, 246, 0.5)', bgcolor: 'rgba(139, 92, 246, 0.08)' },
                }}
              >
                Пропустить
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  )
}
