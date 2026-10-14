import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { api, WeeklyDigest, WeeklyDigestDelta } from '../api/client'
import { ROLE_THEMES, DESIGN_TOKENS } from '../constants/themeColors'

type Week = 'current' | 'previous'

function formatMinutes(m: number): string {
  if (m < 60) return `${m}м`
  return m % 60 === 0 ? `${m / 60}ч` : `${Math.floor(m / 60)}ч ${m % 60}м`
}

function DeltaList({ title, items, render }: { title: string; items: WeeklyDigestDelta[]; render: (d: WeeklyDigestDelta) => string }) {
  return (
    <Grid item xs={12} sm={4}>
      <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textMuted }}>
          —
        </Typography>
      ) : (
        items.map((d) => (
          <Stack key={d.name} direction="row" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" noWrap sx={{ color: (ROLE_THEMES[d.role] ?? ROLE_THEMES.other).light }}>
              {d.name}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: DESIGN_TOKENS.fontMono, color: DESIGN_TOKENS.textSecondary }}>
              {render(d)}
            </Typography>
          </Stack>
        ))
      )}
    </Grid>
  )
}

const USAGE_LABELS: Record<string, string> = {
  start_manual: 'запуск вручную',
  start_break_variety: 'перерыв — отстающая',
  start_break_mood: 'перерыв — по настроению',
  start_evening: 'вечерний режим',
  start_combo: 'шаг комбо',
  evening_skip: 'пропуск вечером',
  ramp_reset: 'сброс разгона',
  timer_extend: 'продление таймера',
}

const clientLabel = (client: string) => (client === 'unknown' ? 'без метки' : client)

function ChipRow({ title, labels }: { title: string; labels: string[] }) {
  if (labels.length === 0) return null
  return (
    <Box>
      <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {labels.map((label) => (
          <Chip
            key={label}
            size="small"
            label={label}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: DESIGN_TOKENS.textSecondary }}
          />
        ))}
      </Stack>
    </Box>
  )
}

// End-of-week debrief: where the week went by choice rather than by schedule.
// `previous` covers the finished week on Monday, before the weekly wipe.
export function WeeklyDigestBlock() {
  const [week, setWeek] = useState<Week>('current')
  const [digest, setDigest] = useState<WeeklyDigest | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDigest(null)
    setFailed(false)
    api
      .getWeeklyDigest(week)
      .then((d) => {
        if (!cancelled) setDigest(d)
      })
      .catch((e) => {
        console.error('Failed to load weekly digest', e)
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [week])

  const freeRanking = digest?.free.filter((t) => t.done > 0) ?? []
  // `?? []`: a server older than the clients/usage blocks omits both fields.
  const clientLabels = (digest?.clients ?? []).map(
    (c) => `${clientLabel(c.client)} · ${formatMinutes(c.minutes)} · ${c.share_percent}%`,
  )
  const usageLabels = (digest?.usage ?? []).map((u) => `${USAGE_LABELS[u.event] ?? u.event} · ${u.count}`)
  const isEmpty = !!digest && digest.total_done === 0 && usageLabels.length === 0

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(15, 23, 42, 0.7)', border: `1px solid ${DESIGN_TOKENS.borderColor}` }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            📊 Итоги недели
          </Typography>
          {digest && (
            <Typography variant="caption" sx={{ color: DESIGN_TOKENS.textMuted }}>
              {digest.week_start_date} — {digest.week_end_date}
              {digest.source === 'snapshot' && ' · снимок перед очисткой'}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          {(['current', 'previous'] as Week[]).map((w) => (
            <Chip
              key={w}
              size="small"
              label={w === 'current' ? 'Эта неделя' : 'Прошлая'}
              onClick={() => setWeek(w)}
              sx={{
                cursor: 'pointer',
                fontWeight: week === w ? 700 : 500,
                bgcolor: week === w ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                color: week === w ? DESIGN_TOKENS.textPrimary : DESIGN_TOKENS.textSecondary,
                border: `1px solid ${DESIGN_TOKENS.borderColor}`,
              }}
            />
          ))}
        </Stack>
      </Stack>

      {failed ? (
        <Typography variant="body2" color="text.secondary">
          Итоги недели недоступны
        </Typography>
      ) : !digest ? (
        <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textMuted }}>
          Загрузка…
        </Typography>
      ) : isEmpty ? (
        <Typography variant="body2" color="text.secondary">
          За эту неделю записей нет.
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: DESIGN_TOKENS.textSecondary }}>
            Всего {formatMinutes(digest.total_done)} из {formatMinutes(digest.total_planned)} по плану
            {digest.busiest_day && ` · самый нагруженный день: ${digest.busiest_day.day} (${formatMinutes(digest.busiest_day.total_done)})`}
          </Typography>

          {freeRanking.length > 0 && (
            <Box>
              <Typography variant="overline" sx={{ color: DESIGN_TOKENS.textMuted }}>
                Свободное время · {formatMinutes(digest.free_done)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {freeRanking.map((t) => (
                  <Chip
                    key={t.name}
                    size="small"
                    label={`${t.name} · ${formatMinutes(t.done)} · ${t.share_percent}%`}
                    sx={{
                      bgcolor: (ROLE_THEMES[t.role] ?? ROLE_THEMES.other).badgeBg,
                      color: (ROLE_THEMES[t.role] ?? ROLE_THEMES.other).light,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Grid container spacing={2}>
            <DeltaList title="Сверх плана" items={digest.over_plan} render={(d) => `+${formatMinutes(d.delta)}`} />
            <DeltaList title="Не начато" items={digest.untouched} render={(d) => `план ${formatMinutes(d.planned)}`} />
            <DeltaList title="Без расписания" items={digest.unscheduled} render={(d) => formatMinutes(d.done)} />
          </Grid>

          <ChipRow title="Клиенты" labels={clientLabels} />
          <ChipRow title="Использование функций" labels={usageLabels} />
        </Stack>
      )}
    </Paper>
  )
}
