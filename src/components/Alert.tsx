import MuiAlert from '@mui/material/Alert'
import { DESIGN_TOKENS } from '../constants/themeColors'

export default function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const isError = type === 'error'
  return (
    <MuiAlert
      severity={isError ? 'error' : 'success'}
      sx={{
        mb: 2,
        borderRadius: 2.5,
        backgroundColor: isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
        color: isError ? '#FCA5A5' : '#86EFAC',
        border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
        backdropFilter: 'blur(10px)',
        fontWeight: 600,
        fontSize: '0.85rem',
        fontFamily: DESIGN_TOKENS.fontMain,
        '& .MuiAlert-icon': {
          color: isError ? '#EF4444' : '#10B981',
        },
      }}
    >
      {children}
    </MuiAlert>
  )
}
