import React, { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Button, Box, Chip, Stack, CircularProgress } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import NightlightRoundIcon from '@mui/icons-material/NightlightRound'
import { api, EveningFocusResponse } from '../api/client'

interface EveningFocusCardProps {
  onStartTask?: (taskName: string, duration: number) => void
}

export const EveningFocusCard: React.FC<EveningFocusCardProps> = ({ onStartTask }) => {
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
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#fff', borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <NightlightRoundIcon sx={{ color: '#a78bfa' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#e0e7ff' }}>
            Режим вечернего добора (Evening Focus)
          </Typography>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} sx={{ color: '#a78bfa' }} />
          </Box>
        ) : !currentTask || !currentTask.task_name ? (
          <Typography variant="body2" sx={{ color: '#c7d2fe', py: 2 }}>
            🎉 Отличная работа! Все задачи на эту неделю выполнены.
          </Typography>
        ) : (
          <>
            <Box sx={{ my: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#67e8f9' }}>
                🎯 Рекомендуемая задача: {currentTask.task_name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                📉 Недельное отставание: -{currentTask.weekly_gap} мин &nbsp;|&nbsp; ⏱️ Лимит отдыха: {data?.rest_pool} мин
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Длительность:</Typography>
              {[15, 20, 30].map((t) => (
                <Chip
                  key={t}
                  label={`${t}m`}
                  size="small"
                  onClick={() => setSprintTime(t)}
                  color={sprintTime === t ? 'secondary' : 'default'}
                  sx={{ cursor: 'pointer', fontWeight: sprintTime === t ? 'bold' : 'normal' }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PlayArrowIcon />}
                onClick={() => onStartTask && onStartTask(currentTask.task_name, sprintTime)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
              >
                Начать {sprintTime}m спринт
              </Button>

              <Button
                variant="outlined"
                startIcon={<SkipNextIcon />}
                onClick={handleSkip}
                sx={{ color: '#c7d2fe', borderColor: 'rgba(199, 210, 254, 0.4)', borderRadius: 2, textTransform: 'none' }}
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
