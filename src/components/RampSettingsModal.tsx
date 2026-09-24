import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { api, RampConfig, RampStatus } from '../api/client'
import { DESIGN_TOKENS, ROLE_THEMES, ROLE_COLORS } from '../constants/themeColors'

export interface RampSettingsModalProps {
  open: boolean
  onClose: () => void
  currentConfig?: RampConfig | null
  onConfigSaved?: (status: RampStatus) => void
}

const CAP_PRESETS = [15, 20, 25, 30]
const REST_PRESETS = [5, 10, 15, 20]
const AVAILABLE_ROLES = [
  { key: 'work', label: 'Работа', color: ROLE_COLORS.work },
  { key: 'learn', label: 'Изучение', color: ROLE_COLORS.learn },
  { key: 'rest', label: 'Отдых', color: ROLE_COLORS.rest },
]

export function RampSettingsModal({
  open,
  onClose,
  currentConfig,
  onConfigSaved,
}: RampSettingsModalProps) {
  const [capMinutes, setCapMinutes] = useState<number>(25)
  const [enabledRoles, setEnabledRoles] = useState<string[]>(['work', 'learn'])
  const [enabledTasks, setEnabledTasks] = useState<string[]>(['home_task'])
  const [excludedTasks, setExcludedTasks] = useState<string[]>(['video', 'movies', 'games', 'telegram'])
  const [defaultRestFallback, setDefaultRestFallback] = useState<number>(15)

  const [newTaskInput, setNewTaskInput] = useState<string>('')
  const [newExcludedInput, setNewExcludedInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Populate state whenever modal opens or currentConfig changes
  useEffect(() => {
    if (!open) return
    setError(null)

    if (currentConfig) {
      setCapMinutes(currentConfig.cap_minutes)
      setEnabledRoles(currentConfig.enabled_roles || [])
      setEnabledTasks(currentConfig.enabled_tasks || [])
      setExcludedTasks(currentConfig.excluded_tasks || [])
      setDefaultRestFallback(currentConfig.default_rest_fallback || 15)
    } else {
      // Fetch fresh config from API
      setLoading(true)
      api
        .getRampConfig()
        .then((cfg) => {
          setCapMinutes(cfg.cap_minutes)
          setEnabledRoles(cfg.enabled_roles || [])
          setEnabledTasks(cfg.enabled_tasks || [])
          setExcludedTasks(cfg.excluded_tasks || [])
          setDefaultRestFallback(cfg.default_rest_fallback || 15)
        })
        .catch((e: any) => {
          setError(e.message || 'Ошибка загрузки конфигурации')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, currentConfig])

  const handleToggleRole = (roleKey: string) => {
    setEnabledRoles((prev) =>
      prev.includes(roleKey) ? prev.filter((r) => r !== roleKey) : [...prev, roleKey]
    )
  }

  const handleAddEnabledTask = () => {
    const trimmed = newTaskInput.trim()
    if (!trimmed) return
    if (!enabledTasks.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setEnabledTasks((prev) => [...prev, trimmed])
    }
    setNewTaskInput('')
  }

  const handleRemoveEnabledTask = (taskToRemove: string) => {
    setEnabledTasks((prev) => prev.filter((t) => t !== taskToRemove))
  }

  const handleAddExcludedTask = () => {
    const trimmed = newExcludedInput.trim()
    if (!trimmed) return
    if (!excludedTasks.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setExcludedTasks((prev) => [...prev, trimmed])
    }
    setNewExcludedInput('')
  }

  const handleRemoveExcludedTask = (taskToRemove: string) => {
    setExcludedTasks((prev) => prev.filter((t) => t !== taskToRemove))
  }

  const handleSave = async () => {
    setError(null)

    if (capMinutes < 5) {
      setError('Потолок разгона должен быть не менее 5 минут')
      return
    }
    if (defaultRestFallback < 1) {
      setError('Дефолтное время отдыха должно быть не менее 1 минуты')
      return
    }

    setSaving(true)
    try {
      const payload: RampConfig = {
        cap_minutes: Math.round(capMinutes),
        enabled_roles: enabledRoles,
        enabled_tasks: enabledTasks,
        excluded_tasks: excludedTasks,
        default_rest_fallback: Math.round(defaultRestFallback),
      }
      const updatedStatus = await api.updateRampConfig(payload)
      window.dispatchEvent(new CustomEvent('ramp-updated', { detail: updatedStatus }))
      if (onConfigSaved) {
        onConfigSaved(updatedStatus)
      }
      onClose()
    } catch (e: any) {
      setError(e.message || 'Не удалось сохранить конфигурацию')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 4,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          p: { xs: 1, sm: 2 },
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(255, 107, 74, 0.25) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#F59E0B',
            }}
          >
            <BoltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, lineHeight: 1.2 }}>
              Настройки разгона
            </Typography>
            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
              Warm-Up Ramp Ladder 2.0
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          disabled={saving}
          size="small"
          sx={{
            color: DESIGN_TOKENS.textMuted,
            '&:hover': { color: DESIGN_TOKENS.textPrimary, bgcolor: 'rgba(255, 255, 255, 0.08)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#F59E0B' }} />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 0.5 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.12)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 2.5,
                }}
              >
                {error}
              </Alert>
            )}

            {/* 1. Cap Minutes */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, mb: 0.5 }}>
                Потолок разгона (Cap)
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 1.5 }}>
                Максимальная длительность ступеньки в минутах (минимум 5 мин). По умолчанию: 25 мин.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {CAP_PRESETS.map((preset) => {
                  const isSelected = capMinutes === preset
                  return (
                    <Chip
                      key={preset}
                      label={`${preset} мин`}
                      clickable
                      onClick={() => setCapMinutes(preset)}
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#FBBF24' : DESIGN_TOKENS.textSecondary,
                        border: isSelected ? '1px solid #F59E0B' : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        transition: 'all 0.2s ease',
                      }}
                    />
                  )
                })}
              </Stack>
              <TextField
                type="number"
                size="small"
                value={capMinutes}
                onChange={(e) => setCapMinutes(Number(e.target.value))}
                inputProps={{ min: 5, max: 120 }}
                helperText={capMinutes < 5 ? 'Минимум 5 минут' : ''}
                error={capMinutes < 5}
                sx={{ width: 160 }}
              />
            </Box>

            <Divider sx={{ borderColor: DESIGN_TOKENS.borderColor }} />

            {/* 2. Enabled Roles */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, mb: 0.5 }}>
                Роли в разгоне (Eligible Roles)
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 1.5 }}>
                Задачи с выбранными ролями при старте без флага -t берут текущую ступеньку разгона.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {AVAILABLE_ROLES.map((r) => {
                  const active = enabledRoles.includes(r.key)
                  return (
                    <Chip
                      key={r.key}
                      label={r.label}
                      icon={active ? <CheckRoundedIcon sx={{ color: `${r.color} !important` }} /> : undefined}
                      clickable
                      onClick={() => handleToggleRole(r.key)}
                      sx={{
                        fontWeight: active ? 700 : 500,
                        bgcolor: active ? `${r.color}25` : 'rgba(255, 255, 255, 0.04)',
                        color: active ? r.color : DESIGN_TOKENS.textMuted,
                        border: active ? `1px solid ${r.color}80` : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        px: 0.5,
                        py: 2,
                        transition: 'all 0.2s ease',
                      }}
                    />
                  )
                })}
              </Stack>
            </Box>

            <Divider sx={{ borderColor: DESIGN_TOKENS.borderColor }} />

            {/* 3. Enabled Specific Tasks */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, mb: 0.5 }}>
                Дополнительные задачи для разгона
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 1.5 }}>
                Задачи, всегда участвующие в разгоне, независимо от роли (например: home_task).
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {enabledTasks.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    onDelete={() => handleRemoveEnabledTask(t)}
                    sx={{
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                      color: ROLE_COLORS.learn,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  />
                ))}
                {enabledTasks.length === 0 && (
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontStyle: 'italic' }}>
                    Нет дополнительных задач
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Имя задачи (напр. home_task)"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddEnabledTask()
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddEnabledTask}
                  startIcon={<AddRoundedIcon />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: DESIGN_TOKENS.textPrimary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Добавить
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: DESIGN_TOKENS.borderColor }} />

            {/* 4. Excluded Tasks */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, mb: 0.5 }}>
                Исключенные задачи (Fallback)
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 1.5 }}>
                Задачи, не участвующие в разгоне. Для них выдается фиксированное время отдыха (по умолчанию: video, movies, games, telegram).
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {excludedTasks.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    onDelete={() => handleRemoveExcludedTask(t)}
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.12)',
                      color: '#F87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  />
                ))}
                {excludedTasks.length === 0 && (
                  <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, fontStyle: 'italic' }}>
                    Список исключений пуст
                  </Typography>
                )}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Имя исключаемой задачи"
                  value={newExcludedInput}
                  onChange={(e) => setNewExcludedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddExcludedTask()
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddExcludedTask}
                  startIcon={<AddRoundedIcon />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: DESIGN_TOKENS.textPrimary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Добавить
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: DESIGN_TOKENS.borderColor }} />

            {/* 5. Default Rest Fallback */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, mb: 0.5 }}>
                Время для отдыха и исключений (Fallback)
              </Typography>
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted, display: 'block', mb: 1.5 }}>
                Фиксированная длительность в минутах при старте исключенной задачи без времени (минимум 1 мин).
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {REST_PRESETS.map((preset) => {
                  const isSelected = defaultRestFallback === preset
                  return (
                    <Chip
                      key={preset}
                      label={`${preset} мин`}
                      clickable
                      onClick={() => setDefaultRestFallback(preset)}
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? ROLE_COLORS.rest : DESIGN_TOKENS.textSecondary,
                        border: isSelected ? `1px solid ${ROLE_COLORS.rest}` : `1px solid ${DESIGN_TOKENS.borderColor}`,
                        transition: 'all 0.2s ease',
                      }}
                    />
                  )
                })}
              </Stack>
              <TextField
                type="number"
                size="small"
                value={defaultRestFallback}
                onChange={(e) => setDefaultRestFallback(Number(e.target.value))}
                inputProps={{ min: 1, max: 120 }}
                helperText={defaultRestFallback < 1 ? 'Минимум 1 минута' : ''}
                error={defaultRestFallback < 1}
                sx={{ width: 160 }}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, borderTop: `1px solid ${DESIGN_TOKENS.borderColor}` }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={saving}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.15)',
            color: DESIGN_TOKENS.textSecondary,
          }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || capMinutes < 5 || defaultRestFallback < 1}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BoltRoundedIcon />}
          sx={{
            bgcolor: '#F59E0B',
            color: '#0B0F17',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
            '&:hover': { bgcolor: '#D97706' },
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default RampSettingsModal
