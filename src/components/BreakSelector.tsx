import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { api, BreakOption } from '../api/client'
import { ROLE_THEMES, DESIGN_TOKENS } from '../constants/themeColors'

interface BreakSelectorProps {
  onStart: (taskName: string, role: string, minutes: number) => void
  onClose: () => void
}

const FALLBACK_DURATIONS = [15, 20, 30]

// 1-tap break choice after a focus block: the least-done task of the week first, then the rest by mood.
export function BreakSelector({ onStart, onClose }: BreakSelectorProps) {
  const [options, setOptions] = useState<BreakOption[] | null>(null)
  const [durations, setDurations] = useState<number[]>(FALLBACK_DURATIONS)
  const [minutes, setMinutes] = useState<number>(FALLBACK_DURATIONS[0])
  const theme = ROLE_THEMES.rest

  useEffect(() => {
    let cancelled = false
    api
      .getBreakOptions()
      .then((res) => {
        if (cancelled) return
        setOptions(res.data.options ?? [])
        if (res.data.durations?.length) setDurations(res.data.durations)
        if (res.data.default_duration) setMinutes(res.data.default_duration)
      })
      .catch((e) => {
        console.error('Failed to load break options', e)
        if (!cancelled) setOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const variety = options?.find((o) => o.is_variety)
  const mood = options?.filter((o) => !o.is_variety) ?? []

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2.5,
        bgcolor: theme.bg,
        border: `1px solid ${theme.glow}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary }}>
          ☕️ Перерыв: что запустить?
        </Typography>
        <IconButton size="small" aria-label="Скрыть" onClick={onClose} sx={{ color: DESIGN_TOKENS.textMuted }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {options === null ? (
        <Box display="flex" justifyContent="center" py={1}>
          <CircularProgress size={24} sx={{ color: theme.light }} />
        </Box>
      ) : options.length === 0 ? (
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary }}>
          Нет задач для перерыва.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontWeight: 600 }}>
              Длительность:
            </Typography>
            {durations.map((d) => (
              <Chip
                key={d}
                label={`${d} мин`}
                size="small"
                onClick={() => setMinutes(d)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: minutes === d ? 700 : 500,
                  bgcolor: minutes === d ? theme.badgeBg : 'rgba(255, 255, 255, 0.05)',
                  color: minutes === d ? theme.light : DESIGN_TOKENS.textSecondary,
                  border: `1px solid ${minutes === d ? theme.glow : DESIGN_TOKENS.borderColor}`,
                }}
              />
            ))}
          </Stack>

          {variety && (
            <Button
              variant="contained"
              onClick={() => onStart(variety.task_name, variety.role, minutes)}
              sx={{
                alignSelf: 'flex-start',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: theme.primary,
                '&:hover': { bgcolor: theme.light },
              }}
            >
              🎲 {variety.task_name} · за неделю {variety.weekly_done}м
            </Button>
          )}

          {mood.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {mood.map((o) => (
                <Button
                  key={o.task_name}
                  variant="outlined"
                  size="small"
                  onClick={() => onStart(o.task_name, o.role, minutes)}
                  sx={{
                    textTransform: 'none',
                    color: DESIGN_TOKENS.textPrimary,
                    borderColor: DESIGN_TOKENS.borderColor,
                    '&:hover': { borderColor: theme.primary, bgcolor: theme.bg },
                  }}
                >
                  {o.task_name}
                </Button>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  )
}
