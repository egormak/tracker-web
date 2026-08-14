import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import { Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Dashboard from './pages/Dashboard'
import Plan from './pages/Plan'
import Rest from './pages/Rest'
import Record from './pages/Record'
import Manage from './pages/Manage'
import Timer from './pages/Timer'
import Schedule from './pages/Schedule'
import Header from './components/Header'
import { DESIGN_TOKENS, ROLE_COLORS } from './constants/themeColors'

// Icons
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import TimelapseOutlinedIcon from '@mui/icons-material/TimelapseOutlined'
import LocalHotelOutlinedIcon from '@mui/icons-material/LocalHotelOutlined'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PlaylistAddCheckRoundedIcon from '@mui/icons-material/PlaylistAddCheckRounded'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 1. Initialize Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }, [])

  // 2. Handle native Telegram Back Button
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return

    if (location.pathname !== '/') {
      tg.BackButton.show()
      const handleBack = () => {
        navigate(-1)
      }
      tg.BackButton.onClick(handleBack)
      return () => {
        tg.BackButton.offClick(handleBack)
      }
    } else {
      tg.BackButton.hide()
    }
  }, [location.pathname, navigate])

  // 3. Map path to active navigation value
  const getNavValue = () => {
    const path = location.pathname
    if (path === '/') return 0
    if (path === '/timer') return 1
    if (path === '/schedule') return 2
    if (path === '/rest') return 3
    return -1
  }

  const handleNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) navigate('/')
    else if (newValue === 1) navigate('/timer')
    else if (newValue === 2) navigate('/schedule')
    else if (newValue === 3) navigate('/rest')
    else if (newValue === 4) setDrawerOpen(true)
  }

  // Dynamic ambient glow depending on page/route
  const getAmbientGlowBackground = () => {
    if (location.pathname === '/timer') {
      return 'radial-gradient(circle at 50% 10%, rgba(255, 107, 74, 0.12), transparent 50%), radial-gradient(circle at 80% 90%, rgba(59, 130, 246, 0.08), transparent 40%), #0B0F17'
    }
    if (location.pathname === '/rest') {
      return 'radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.12), transparent 50%), #0B0F17'
    }
    if (location.pathname === '/schedule' || location.pathname === '/plan') {
      return 'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.12), transparent 50%), #0B0F17'
    }
    // Default dashboard
    return 'radial-gradient(circle at 20% 15%, rgba(255, 107, 74, 0.09), transparent 45%), radial-gradient(circle at 80% 10%, rgba(59, 130, 246, 0.08), transparent 45%), #0B0F17'
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: DESIGN_TOKENS.bgMain,
        backgroundImage: getAmbientGlowBackground(),
        transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        color: DESIGN_TOKENS.textPrimary,
        pb: { xs: 8, md: 0 },
      }}
    >
      {/* Top Header shown only on Desktop */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Header />
      </Box>

      {/* Main content container */}
      <Container sx={{ pt: { xs: 2, md: 3 }, pb: 6, px: { xs: 1.5, sm: 3 } }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/rest" element={<Rest />} />
          <Route path="/record" element={<Record />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </Container>

      {/* Bottom Navigation for Mobile / Telegram */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'block', md: 'none' },
          zIndex: 1100,
          borderTop: `1px solid ${DESIGN_TOKENS.borderColor}`,
          backgroundColor: 'rgba(11, 15, 23, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <BottomNavigation
          showLabels
          value={getNavValue()}
          onChange={handleNavChange}
          sx={{
            bgcolor: 'transparent',
            '& .Mui-selected': {
              color: `${ROLE_COLORS.work} !important`,
              fontWeight: 700,
            },
            '& .MuiBottomNavigationAction-root': {
              color: DESIGN_TOKENS.textMuted,
              minWidth: 0,
            },
          }}
        >
          <BottomNavigationAction label="Главная" icon={<DashboardOutlinedIcon />} />
          <BottomNavigationAction label="Таймер" icon={<TimelapseOutlinedIcon />} />
          <BottomNavigationAction label="График" icon={<CalendarTodayIcon />} />
          <BottomNavigationAction label="Отдых" icon={<LocalHotelOutlinedIcon />} />
          <BottomNavigationAction label="Меню" icon={<MenuRoundedIcon />} />
        </BottomNavigation>
      </Paper>

      {/* Bottom Drawer for secondary items on mobile */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: `1px solid ${DESIGN_TOKENS.borderColor}`,
            pb: 2,
            px: 2,
          },
        }}
      >
        <Box sx={{ width: 'auto', pt: 2 }}>
          <Typography variant="subtitle1" sx={{ px: 2, pb: 1, fontWeight: 700, color: DESIGN_TOKENS.textSecondary }}>
            Дополнительные разделы
          </Typography>
          <Divider sx={{ mb: 1, borderColor: DESIGN_TOKENS.borderColor }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setDrawerOpen(false)
                  navigate('/plan')
                }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: ROLE_COLORS.learn }}>
                  <PlaylistAddCheckRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Проценты плана (Plan Percents)" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setDrawerOpen(false)
                  navigate('/record')
                }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: ROLE_COLORS.work }}>
                  <AssignmentTurnedInOutlinedIcon />
                </ListItemIcon>
                <ListItemText primary="Ручная запись (Record Work)" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setDrawerOpen(false)
                  navigate('/manage')
                }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: ROLE_COLORS.rest }}>
                  <ManageAccountsRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Управление и настройки (Manage)" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}
