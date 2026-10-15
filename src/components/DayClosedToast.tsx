import { useEffect, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
import { DAY_CLOSED_EVENT, DayClosedDetail } from '../hooks/useTimerSync'
import { soundSynth } from '../utils/audio'
import { ROLE_THEMES } from '../constants/themeColors'

const DAY_FULL: Record<string, string> = {
  monday: 'Понедельник',
  tuesday: 'Вторник',
  wednesday: 'Среда',
  thursday: 'Четверг',
  friday: 'Пятница',
  saturday: 'Суббота',
  sunday: 'Воскресенье',
}

// App-level toast for the DAY_CLOSED WebSocket event, which useTimerSync re-dispatches
// as a window CustomEvent: a previous day's schedule became fully done.
export function DayClosedToast() {
  const [detail, setDetail] = useState<DayClosedDetail | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<DayClosedDetail>).detail
      if (!d?.day) return
      setDetail(d)
      soundSynth.playComboStep()
    }
    window.addEventListener(DAY_CLOSED_EVENT, handler)
    return () => window.removeEventListener(DAY_CLOSED_EVENT, handler)
  }, [])

  const dayName = detail ? DAY_FULL[detail.day.toLowerCase()] || detail.day : ''

  return (
    <Snackbar
      open={Boolean(detail)}
      autoHideDuration={6000}
      onClose={(_e, reason) => {
        if (reason === 'clickaway') return
        setDetail(null)
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <MuiAlert
        severity="success"
        variant="filled"
        onClose={() => setDetail(null)}
        sx={{ bgcolor: ROLE_THEMES.rest.primary, color: '#FFFFFF', fontWeight: 700 }}
      >
        🎉 День закрыт ✅ — {dayName}
      </MuiAlert>
    </Snackbar>
  )
}
