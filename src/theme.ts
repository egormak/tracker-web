import { createTheme, responsiveFontSizes } from '@mui/material/styles'
import { DESIGN_TOKENS, ROLE_COLORS } from './constants/themeColors'

const baseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: ROLE_COLORS.work, // #FF6B4A Coral
      light: '#FF8F6B',
      dark: '#E05333',
      contrastText: '#0B0F17',
    },
    secondary: {
      main: ROLE_COLORS.learn, // #3B82F6 Blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    success: {
      main: ROLE_COLORS.rest, // #10B981 Emerald
      light: '#34D399',
      dark: '#059669',
      contrastText: '#0B0F17',
    },
    background: {
      default: DESIGN_TOKENS.bgMain, // #0B0F17
      paper: DESIGN_TOKENS.bgCard, // rgba(19, 27, 42, 0.75)
    },
    text: {
      primary: DESIGN_TOKENS.textPrimary, // #F8FAFC
      secondary: DESIGN_TOKENS.textSecondary, // #94A3B8
      disabled: DESIGN_TOKENS.textMuted, // #64748B
    },
    divider: DESIGN_TOKENS.borderColor,
    action: {
      hover: DESIGN_TOKENS.bgCardHover,
      selected: 'rgba(255, 255, 255, 0.06)',
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: DESIGN_TOKENS.fontMain,
    h1: { fontFamily: DESIGN_TOKENS.fontMain, fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontFamily: DESIGN_TOKENS.fontMain, fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontFamily: DESIGN_TOKENS.fontMain, fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontFamily: DESIGN_TOKENS.fontMain, fontWeight: 700, letterSpacing: '-0.015em' },
    h5: { fontFamily: DESIGN_TOKENS.fontMain, fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontFamily: DESIGN_TOKENS.fontMain, fontWeight: 600, letterSpacing: '-0.005em' },
    subtitle1: { fontWeight: 500, letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 600, letterSpacing: '0.01em' },
    body1: { letterSpacing: '0.01em', lineHeight: 1.6 },
    body2: { letterSpacing: '0.01em', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
    overline: { letterSpacing: '0.08em', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: DESIGN_TOKENS.bgMain,
          color: DESIGN_TOKENS.textPrimary,
          fontFamily: DESIGN_TOKENS.fontMain,
        },
      },
    },
    MuiContainer: {
      defaultProps: { maxWidth: 'lg' },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 15, 23, 0.75) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${DESIGN_TOKENS.borderColor}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: DESIGN_TOKENS.bgCard,
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${DESIGN_TOKENS.borderColor}`,
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: DESIGN_TOKENS.bgCard,
          backgroundImage: 'none',
        },
        outlined: {
          border: `1px solid ${DESIGN_TOKENS.borderColor}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          backgroundColor: ROLE_COLORS.work,
          color: '#0B0F17',
          boxShadow: '0 4px 14px rgba(255, 107, 74, 0.35)',
          '&:hover': {
            backgroundColor: '#FF8F6B',
            boxShadow: '0 6px 20px rgba(255, 107, 74, 0.45)',
          },
        },
        containedSecondary: {
          backgroundColor: ROLE_COLORS.learn,
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          '&:hover': {
            backgroundColor: '#60A5FA',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          color: DESIGN_TOKENS.textPrimary,
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.25)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontFamily: DESIGN_TOKENS.fontMain,
        },
      },
    },
    MuiList: {
      styleOverrides: { root: { paddingTop: 0, paddingBottom: 0 } },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 10,
          border: `1px solid ${DESIGN_TOKENS.borderColor}`,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            backgroundColor: DESIGN_TOKENS.bgCardHover,
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: DESIGN_TOKENS.borderColor } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: DESIGN_TOKENS.bgInput,
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: DESIGN_TOKENS.borderColor,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.18)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: DESIGN_TOKENS.borderFocus,
          },
        },
      },
    },
  },
})

const theme = responsiveFontSizes(baseTheme)

export default theme
