import React, { useCallback, useEffect, useState } from 'react'
import { Box, Card, CardContent, Chip, CircularProgress, Stack, Tooltip, Typography } from '@mui/material'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import { api, DebtDay, DebtDayStatus, DebtSummary } from '../api/client'
import { DESIGN_TOKENS, ROLE_THEMES } from '../constants/themeColors'
import { DEBT_UPDATED_EVENT } from '../hooks/useTimerSync'

const DAY_SHORT: Record<string, string> = {
  monday: 'Пн',
  tuesday: 'Вт',
  wednesday: 'Ср',
  thursday: 'Чт',
  friday: 'Пт',
  saturday: 'Сб',
  sunday: 'Вс',
}

export function shortDayName(day?: string): string {
  if (!day) return ''
  return DAY_SHORT[day.toLowerCase()] || day
}

const STATUS_SYMBOL: Record<DebtDayStatus, string> = {
  closed: '✅',
  partial: '◐',
  open: '○',
  today: '●',
  future: '·',
  none: '—',
}

const STATUS_HINT: Record<DebtDayStatus, string> = {
  closed: 'день закрыт',
  partial: 'закрыт частично',
  open: 'не начат',
  today: 'сегодня',
  future: 'впереди',
  none: 'нет плана',
}

// Russian plural for «позиция»: 1 позиция, 2-4 позиции, 5+ позиций
function pluralPositions(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'позиция'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции'
  return 'позиций'
}

const ACCENT = '#F59E0B'

export const DebtCard: React.FC = () => {
  const [debt, setDebt] = useState<DebtSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDebt = useCallback(async () => {
    try {
      const res = await api.getDebt()
      setDebt(res.data)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Не удалось загрузить долг')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDebt()
    const handler = () => {
      fetchDebt()
    }
    window.addEventListener(DEBT_UPDATED_EVENT, handler)
    return () => window.removeEventListener(DEBT_UPDATED_EVENT, handler)
  }, [fetchDebt])

  const total = debt?.total_minutes || 0
  const items = debt?.items || []

  const renderDayCell = (d: DebtDay) => {
    const isToday = d.status === 'today'
    const dim = d.status === 'none' || d.status === 'future'
    const color =
      d.status === 'closed'
        ? ROLE_THEMES.rest.light
        : d.status === 'partial' || d.status === 'open'
          ? ACCENT
          : isToday
            ? ROLE_THEMES.learn.light
            : DESIGN_TOKENS.textMuted
    const details =
      d.planned > 0 ? `${d.planned - d.remaining} / ${d.planned} мин, осталось ${d.remaining} мин` : 'без плана'
    return (
      <Tooltip key={d.day} title={`${d.date} — ${STATUS_HINT[d.status]} (${details})`} arrow>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            py: 0.75,
            borderRadius: 1.5,
            textAlign: 'center',
            bgcolor: isToday ? ROLE_THEMES.learn.bg : 'rgba(255, 255, 255, 0.03)',
            border: isToday ? `1px solid ${ROLE_THEMES.learn.primary}` : `1px solid ${DESIGN_TOKENS.borderColor}`,
            opacity: dim ? 0.5 : 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ display: 'block', color: DESIGN_TOKENS.textSecondary, fontWeight: isToday ? 700 : 500, lineHeight: 1.2 }}
          >
            {shortDayName(d.day)}
          </Typography>
          <Typography sx={{ color, fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4 }}>
            {STATUS_SYMBOL[d.status] || '—'}
          </Typography>
        </Box>
      </Tooltip>
    )
  }

  return (
    <Card
      sx={{
        mb: 3,
        bgcolor: DESIGN_TOKENS.bgCard,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${total > 0 ? 'rgba(245, 158, 11, 0.3)' : DESIGN_TOKENS.borderColor}`,
        borderRadius: 3.5,
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(245, 158, 11, 0.15)',
              color: ACCENT,
              border: '1px solid rgba(245, 158, 11, 0.3)',
              flexShrink: 0,
            }}
          >
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {loading ? (
              <CircularProgress size={18} sx={{ color: ACCENT }} />
            ) : error ? (
              <Typography variant="body2" sx={{ color: ROLE_THEMES.work.light }}>
                {error}
              </Typography>
            ) : total > 0 ? (
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: DESIGN_TOKENS.textPrimary, fontSize: '1rem' }}>
                Долг: {total}м · {items.length} {pluralPositions(items.length)}
                {debt?.oldest_day ? ` · старейший: ${shortDayName(debt.oldest_day).toLowerCase()}` : ''}
              </Typography>
            ) : (
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: ROLE_THEMES.rest.light, fontSize: '1rem' }}>
                Долгов нет ✅
              </Typography>
            )}
            {debt && !loading && !error && (
              <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
                Сегодня осталось: {debt.today_remaining} мин
              </Typography>
            )}
          </Box>
        </Stack>

        {debt && debt.days.length > 0 && (
          <Stack direction="row" spacing={0.75} sx={{ mb: items.length > 0 ? 1.5 : 0 }}>
            {debt.days.map(renderDayCell)}
          </Stack>
        )}

        {items.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {items.map((it) => {
              const roleTheme = ROLE_THEMES[it.role] || ROLE_THEMES.other
              return (
                <Chip
                  key={`${it.day}:${it.task_name}`}
                  size="small"
                  label={`${it.task_name} · ${shortDayName(it.day)} · ${it.remaining}м`}
                  title={it.date}
                  sx={{
                    bgcolor: roleTheme.badgeBg,
                    color: roleTheme.light,
                    border: `1px solid ${roleTheme.primary}40`,
                    fontSize: '0.72rem',
                    height: 24,
                  }}
                />
              )
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
