import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import PlaylistAddCheckRoundedIcon from '@mui/icons-material/PlaylistAddCheckRounded'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import LocalHotelOutlinedIcon from '@mui/icons-material/LocalHotelOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'
import TimelapseOutlinedIcon from '@mui/icons-material/TimelapseOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined'
import { ReactNode, useState, useEffect } from 'react'
import { Link as RouterLink, useMatch, useResolvedPath } from 'react-router-dom'
import { ROLE_COLORS, DESIGN_TOKENS } from '../constants/themeColors'
import { soundSynth } from '../utils/audio'

const navItems = [
  { to: '/', label: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" />, end: true },
  { to: '/timer', label: 'Timer', icon: <TimelapseOutlinedIcon fontSize="small" /> },
  { to: '/plan', label: 'Plan', icon: <PlaylistAddCheckRoundedIcon fontSize="small" /> },
  { to: '/schedule', label: 'Schedule', icon: <CalendarTodayIcon fontSize="small" /> },
  { to: '/rest', label: 'Rest', icon: <LocalHotelOutlinedIcon fontSize="small" /> },
  { to: '/record', label: 'Record', icon: <AssignmentTurnedInOutlinedIcon fontSize="small" /> },
  { to: '/manage', label: 'Manage', icon: <ManageAccountsRoundedIcon fontSize="small" /> },
]

export default function Header() {
  const [soundOn, setSoundOn] = useState(soundSynth.isSoundEnabled())

  useEffect(() => {
    setSoundOn(soundSynth.isSoundEnabled())
  }, [])

  const handleToggleSound = () => {
    const next = soundSynth.toggleSound()
    setSoundOn(next)
    if (next) soundSynth.playStart()
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(11, 15, 23, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${DESIGN_TOKENS.borderColor}`,
      }}
    >
      <Container>
        <Toolbar disableGutters sx={{ columnGap: 2, py: 0.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 107, 74, 0.15)',
                color: ROLE_COLORS.work,
                border: '1px solid rgba(255, 107, 74, 0.3)',
                width: 36,
                height: 36,
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 0 16px rgba(255, 107, 74, 0.25)',
              }}
            >
              TF
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                TimeFlow Canvas
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: DESIGN_TOKENS.textMuted,
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                }}
              >
                Tracker System
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={0.8} alignItems="center" component="nav">
            {navItems.map((item) => (
              <NavItemButton key={item.to} {...item} />
            ))}

            <Tooltip title={soundOn ? 'Звук включен (клик для выключения)' : 'Звук выключен (клик для включения)'}>
              <IconButton
                size="small"
                onClick={handleToggleSound}
                sx={{
                  ml: 1,
                  color: soundOn ? ROLE_COLORS.work : DESIGN_TOKENS.textMuted,
                  bgcolor: soundOn ? 'rgba(255, 107, 74, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${soundOn ? 'rgba(255, 107, 74, 0.3)' : DESIGN_TOKENS.borderColor}`,
                  '&:hover': {
                    bgcolor: soundOn ? 'rgba(255, 107, 74, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {soundOn ? <NotificationsActiveOutlinedIcon fontSize="small" /> : <NotificationsOffOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

interface NavItemProps {
  to: string
  label: string
  icon?: ReactNode
  end?: boolean
}

function NavItemButton({ to, label, icon, end }: NavItemProps) {
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end })

  return (
    <Button
      component={RouterLink}
      to={to}
      color="inherit"
      size="medium"
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        fontWeight: match ? 700 : 500,
        fontSize: '0.85rem',
        color: match ? DESIGN_TOKENS.textPrimary : DESIGN_TOKENS.textSecondary,
        bgcolor: match ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        border: match ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
        px: 1.8,
        py: 0.8,
        gap: 0.8,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.06)',
          color: DESIGN_TOKENS.textPrimary,
        },
      }}
    >
      {icon}
      {label}
    </Button>
  )
}
