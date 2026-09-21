import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import LocalHotelOutlinedIcon from '@mui/icons-material/LocalHotelOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { api } from '../api/client'
import Alert from '../components/Alert'
import Card from '../components/Card'
import { formatRestMinutes } from '../utils/format'

export default function Rest() {
  const [rest, setRest] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const r = await api.restGet()
      setRest(r.rest_time)
    } catch (e: any) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const act = async (action: 'add' | 'spend' | 'reset') => {
    setMsg(null)
    setError(null)
    if (action === 'reset') {
      try {
        await api.restReset()
        await load()
        setMsg('Rest balance was reset to 0')
        setValue('')
      } catch (e: any) {
        setError(e.message)
      }
      return
    }

    const n = parseInt(value, 10)
    if (Number.isNaN(n) || n <= 0) {
      setError('Enter positive integer minutes')
      return
    }
    try {
      if (action === 'add') await api.restAdd({ rest_time: n })
      else await api.restSpend({ rest_time: n })
      await load()
      setMsg(`${action === 'add' ? 'Added' : 'Spent'} ${n} minutes`)
      setValue('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const formattedRest = formatRestMinutes(rest)

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card title="Rest Balance" subtitle="Manage rest minutes" icon={<LocalHotelOutlinedIcon />}>
          {error && <Alert type="error">{error}</Alert>}
          {msg && <Alert type="success">{msg}</Alert>}
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <Typography variant="h3">
                  {formattedRest}
                  {formattedRest === '-' ? '' : ' min'}
                </Typography>
                {rest !== null && rest >= 5000 && (
                  <Chip
                    size="small"
                    label="Дневной лимит: 60 мин"
                    color={rest >= 6000 ? 'warning' : 'default'}
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      bgcolor: rest >= 6000 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: rest >= 6000 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                      color: rest >= 6000 ? '#FBBF24' : '#94A3B8',
                    }}
                  />
                )}
              </Stack>
              {rest !== null && rest >= 5000 && (
                <Typography variant="caption" sx={{ color: rest >= 6000 ? '#FBBF24' : 'text.secondary', mt: 0.5, display: 'block' }}>
                  {rest >= 6000
                    ? 'Достигнут дневной лимит отдыха: 60 мин.'
                    : 'Баланс отдыха приближается к дневному лимиту: 60 мин.'}
                </Typography>
              )}
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" flexWrap="wrap" useFlexGap>
              <TextField
                label="Minutes"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="numeric"
                InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                sx={{ maxWidth: 200 }}
              />
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => act('add')}>
                Add
              </Button>
              <Button variant="outlined" startIcon={<RemoveRoundedIcon />} onClick={() => act('spend')}>
                Spend
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestartAltRoundedIcon />}
                onClick={() => act('reset')}
              >
                Обнулить
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  )
}
