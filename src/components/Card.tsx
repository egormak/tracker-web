import { Card as MuiCard, CardActions, CardContent, CardHeader, Divider, Stack } from '@mui/material'
import Box from '@mui/material/Box'
import { PropsWithChildren, ReactNode } from 'react'
import { DESIGN_TOKENS } from '../constants/themeColors'

interface Props {
  title?: string
  subtitle?: string
  actions?: ReactNode
  icon?: ReactNode
  glowColor?: string
}

export default function Card({
  title,
  subtitle,
  actions,
  icon,
  glowColor = 'rgba(255, 107, 74, 0.15)',
  children,
}: PropsWithChildren<Props>) {
  const header = title ? (
    <CardHeader
      title={title}
      subheader={subtitle}
      avatar={
        icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${DESIGN_TOKENS.borderColor}`,
              color: 'primary.main',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {icon}
          </Box>
        ) : undefined
      }
      sx={{
        pb: 1,
        pt: 2.5,
        px: 2.5,
        '& .MuiCardHeader-title': { fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' },
        '& .MuiCardHeader-subheader': { color: 'text.secondary', fontSize: '0.8rem', mt: 0.2 },
      }}
    />
  ) : null

  return (
    <MuiCard
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: DESIGN_TOKENS.bgCard,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${DESIGN_TOKENS.borderColor}`,
        borderRadius: 3.5,
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
        '&:before': icon
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '180px',
              height: '180px',
              pointerEvents: 'none',
              background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)`,
              opacity: 0.8,
            }
          : undefined,
      }}
    >
      {header}
      <CardContent sx={{ flexGrow: 1, position: 'relative', px: 2.5, pb: 2.5 }}>{children}</CardContent>
      {actions && (
        <>
          <Divider sx={{ borderColor: DESIGN_TOKENS.borderColor }} />
          <CardActions sx={{ justifyContent: 'flex-end', px: 2.5, py: 1.5 }}>
            <Stack direction="row" spacing={1}>
              {actions}
            </Stack>
          </CardActions>
        </>
      )}
    </MuiCard>
  )
}
