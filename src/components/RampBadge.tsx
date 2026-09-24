import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import { SxProps, Theme } from '@mui/material/styles'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { api, RampStatus } from '../api/client'
import { DESIGN_TOKENS } from '../constants/themeColors'
import { soundSynth } from '../utils/audio'
import { RampSettingsModal } from './RampSettingsModal'

export interface RampBadgeProps {
  initialStatus?: RampStatus | null
  compact?: boolean
  onStatusChange?: (status: RampStatus) => void
  sx?: SxProps<Theme>
}

export function RampBadge({
  initialStatus,
  compact = false,
  onStatusChange,
  sx,
}: RampBadgeProps) {
  const [status, setStatus] = useState<RampStatus | null>(initialStatus || null)
  const [loading, setLoading] = useState<boolean>(!initialStatus)
  const [resetting, setResetting] = useState<boolean>(false)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getRampStatus()
      setStatus(data)
      onStatusChange?.(data)
    } catch (e) {
      console.warn('Failed to fetch ramp status', e)
    } finally {
      setLoading(false)
    }
  }, [onStatusChange])

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus)
    } else {
      fetchStatus()
    }
  }, [initialStatus, fetchStatus])

  // Listen for global ramp updates across components
  useEffect(() => {
    const handleRampUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<RampStatus>
      if (customEvent.detail) {
        setStatus(customEvent.detail)
        onStatusChange?.(customEvent.detail)
      } else {
        fetchStatus()
      }
    }

    window.addEventListener('ramp-updated', handleRampUpdated)
    return () => {
      window.removeEventListener('ramp-updated', handleRampUpdated)
    }
  }, [fetchStatus, onStatusChange])

  // 1-Click Reset to 1m
  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (resetting) return

    // Optimistic UI update
    const previous = status
    if (status) {
      setStatus({
        ...status,
        current_step: 1,
        is_capped: false,
      })
    }

    setResetting(true)
    try {
      soundSynth.playStart()
      const updated = await api.resetRamp()
      setStatus(updated)
      onStatusChange?.(updated)
      window.dispatchEvent(new CustomEvent('ramp-updated', { detail: updated }))
    } catch (err) {
      console.error('Failed to reset ramp', err)
      // Rollback on failure
      if (previous) {
        setStatus(previous)
      }
    } finally {
      setResetting(false)
    }
  }

  const handleConfigSaved = (updatedStatus: RampStatus) => {
    setStatus(updatedStatus)
    onStatusChange?.(updatedStatus)
  }

  if (loading && !status) {
    return (
      <Skeleton
        variant="rounded"
        width={compact ? 130 : 180}
        height={34}
        sx={{
          borderRadius: 9999,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          ...sx,
        }}
      />
    )
  }

  const currentStep = status?.current_step ?? 1
  const capMinutes = status?.cap_minutes ?? 25
  const todayFocus = status?.today_focus_minutes ?? 0
  const isCapped = status?.is_capped ?? false

  const tooltipText = `Шаг ${currentStep} из ${capMinutes} мин. Фокус сегодня: ${todayFocus} мин.${
    isCapped ? ' (Потолок)' : ''
  }`

  return (
    <>
      <Tooltip title={tooltipText} arrow placement="bottom">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: { xs: 0.6, sm: 0.8 },
            px: { xs: 1, sm: 1.2 },
            py: 0.4,
            borderRadius: 9999,
            background: isCapped
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(255, 107, 74, 0.18) 100%)'
              : 'linear-gradient(135deg, rgba(255, 107, 74, 0.12) 0%, rgba(245, 158, 11, 0.14) 100%)',
            border: `1px solid ${
              isCapped ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.28)'
            }`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: isCapped
              ? '0 0 16px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 14px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.25s ease',
            userSelect: 'none',
            '&:hover': {
              borderColor: 'rgba(245, 158, 11, 0.55)',
              boxShadow: '0 0 18px rgba(245, 158, 11, 0.3)',
            },
            ...sx,
          }}
        >
          {/* Lightning Icon & Step */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <BoltRoundedIcon
              sx={{
                color: '#F59E0B',
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))',
              }}
            />
            <Typography
              component="span"
              sx={{
                fontFamily: DESIGN_TOKENS.fontMain,
                fontWeight: 700,
                fontSize: { xs: '0.78rem', sm: '0.84rem' },
                color: DESIGN_TOKENS.textPrimary,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {compact ? `${currentStep}м` : `Разгон: ${currentStep} мин`}
            </Typography>
            {isCapped && (
              <Box
                component="span"
                sx={{
                  px: 0.6,
                  py: 0.1,
                  borderRadius: 1,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(245, 158, 11, 0.25)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  letterSpacing: '0.04em',
                }}
              >
                CAP
              </Box>
            )}
          </Stack>

          {/* 1-Click Reset Button [🔄 1м] */}
          <Tooltip title="Сбросить ступеньку разгона на 1 мин" arrow placement="top">
            <Button
              size="small"
              onClick={handleReset}
              disabled={resetting}
              startIcon={
                resetting ? (
                  <CircularProgress size={11} sx={{ color: '#FBBF24' }} />
                ) : (
                  <RestartAltRoundedIcon sx={{ fontSize: '0.9rem !important' }} />
                )
              }
              sx={{
                minWidth: 'auto',
                py: 0.2,
                px: { xs: 0.7, sm: 0.9 },
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#FBBF24',
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 9999,
                lineHeight: 1.2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(245, 158, 11, 0.24)',
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  transform: 'scale(1.04)',
                },
                '&:active': {
                  transform: 'scale(0.96)',
                },
              }}
            >
              1м
            </Button>
          </Tooltip>

          {/* Settings Gear Button */}
          <Tooltip title="Настройки разгона" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => setSettingsOpen(true)}
              sx={{
                p: 0.35,
                color: DESIGN_TOKENS.textMuted,
                borderRadius: 9999,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: DESIGN_TOKENS.textPrimary,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  transform: 'rotate(30deg)',
                },
              }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Tooltip>

      {/* Settings Modal */}
      <RampSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentConfig={status?.config}
        onConfigSaved={handleConfigSaved}
      />
    </>
  )
}

export default RampBadge
