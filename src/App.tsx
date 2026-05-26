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
    if (path === '/rest') return 2
    if (path === '/schedule') return 3
    return -1 // Other paths show in drawer, do not highlight bottom bar
  }

  const handleNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) navigate('/')
    else if (newValue === 1) navigate('/timer')
    else if (newValue === 2) navigate('/rest')
    else if (newValue === 3) navigate('/schedule')
    else if (newValue === 4) setDrawerOpen(true)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', pb: { xs: 8, md: 0 } }}>
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
        elevation={4} 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          display: { xs: 'block', md: 'none' },
          zIndex: 1100,
          borderTop: '1px solid rgba(148, 163, 184, 0.12)',
          backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.92))',
          backdropFilter: 'blur(20px)'
        }}
      >
        <BottomNavigation
          showLabels
          value={getNavValue()}
          onChange={handleNavChange}
          sx={{ bgcolor: 'transparent' }}
        >
          <BottomNavigationAction label="Home" icon={<DashboardOutlinedIcon />} />
          <BottomNavigationAction label="Timer" icon={<TimelapseOutlinedIcon />} />
          <BottomNavigationAction label="Rest" icon={<LocalHotelOutlinedIcon />} />
          <BottomNavigationAction label="Schedule" icon={<CalendarTodayIcon />} />
          <BottomNavigationAction label="More" icon={<MenuRoundedIcon />} />
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
            backgroundImage: 'linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.96) 100%)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(148, 163, 184, 0.14)',
            pb: 2,
            px: 2
          }
        }}
      >
        <Box sx={{ width: 'auto', pt: 2 }}>
          <Typography variant="subtitle1" sx={{ px: 2, pb: 1, fontWeight: 700, color: 'text.secondary' }}>
            More Actions
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => { setDrawerOpen(false); navigate('/plan'); }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  <PlaylistAddCheckRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Plan Percents" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => { setDrawerOpen(false); navigate('/record'); }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  <AssignmentTurnedInOutlinedIcon />
                </ListItemIcon>
                <ListItemText primary="Record Work" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => { setDrawerOpen(false); navigate('/manage'); }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  <ManageAccountsRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="Manage Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}

