import LinearProgress from '@mui/material/LinearProgress'
import { DESIGN_TOKENS, ROLE_COLORS } from '../constants/themeColors'

interface ProgressProps {
  value: number
  color?: string
}

export default function Progress({ value, color = ROLE_COLORS.work }: ProgressProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <LinearProgress
      variant="determinate"
      value={v}
      aria-valuenow={v}
      sx={{
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${DESIGN_TOKENS.borderColor}`,
        '& .MuiLinearProgress-bar': {
          borderRadius: 4,
          backgroundImage: `linear-gradient(90deg, ${color}, ${color}DD)`,
          boxShadow: `0 0 10px ${color}50`,
          transition: 'transform 0.4s ease-out',
        },
      }}
    />
  )
}
