import { useEffect } from 'react'

interface HotkeysOptions {
  onTogglePlay?: () => void
  onSelectRole?: (role: 'work' | 'learn' | 'rest') => void
  enabled?: boolean
}

export function useHotkeys({ onTogglePlay, onSelectRole, enabled = true }: HotkeysOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input, textarea or contenteditable element
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.code === 'Space' && onTogglePlay) {
        e.preventDefault()
        onTogglePlay()
      } else if (e.key === '1' && onSelectRole) {
        e.preventDefault()
        onSelectRole('work')
      } else if (e.key === '2' && onSelectRole) {
        e.preventDefault()
        onSelectRole('learn')
      } else if (e.key === '3' && onSelectRole) {
        e.preventDefault()
        onSelectRole('rest')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onTogglePlay, onSelectRole, enabled])
}
