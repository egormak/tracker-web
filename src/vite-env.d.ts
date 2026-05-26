/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp: {
      ready: () => void
      expand: () => void
      close: () => void
      initData: string
      initDataUnsafe: {
        query_id?: string
        user?: {
          id: number
          first_name: string
          last_name?: string
          username?: string
          language_code?: string
          is_premium?: boolean
        }
        auth_date: number
        hash: string
      }
      colorScheme: 'light' | 'dark'
      themeParams: {
        bg_color?: string
        text_color?: string
        hint_color?: string
        link_color?: string
        button_color?: string
        button_text_color?: string
        secondary_bg_color?: string
      }
      BackButton: {
        show: () => void
        hide: () => void
        onClick: (callback: () => void) => void
        offClick: (callback: () => void) => void
      }
      setHeaderColor: (color: string) => void
      setBackgroundColor: (color: string) => void
    }
  }
}
