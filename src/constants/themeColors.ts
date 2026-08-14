export interface RoleTheme {
  name: string
  label: string
  primary: string
  light: string
  glow: string
  bg: string
  badgeBg: string
}

export const ROLE_THEMES: Record<string, RoleTheme> = {
  work: {
    name: 'work',
    label: 'Работа',
    primary: '#FF6B4A',
    light: '#FF8F6B',
    glow: 'rgba(255, 107, 74, 0.25)',
    bg: 'rgba(255, 107, 74, 0.08)',
    badgeBg: 'rgba(255, 107, 74, 0.14)',
  },
  learn: {
    name: 'learn',
    label: 'Изучение',
    primary: '#3B82F6',
    light: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.25)',
    bg: 'rgba(59, 130, 246, 0.08)',
    badgeBg: 'rgba(59, 130, 246, 0.14)',
  },
  rest: {
    name: 'rest',
    label: 'Отдых',
    primary: '#10B981',
    light: '#34D399',
    glow: 'rgba(16, 185, 129, 0.25)',
    bg: 'rgba(16, 185, 129, 0.08)',
    badgeBg: 'rgba(16, 185, 129, 0.14)',
  },
  other: {
    name: 'other',
    label: 'Другое',
    primary: '#94A3B8',
    light: '#CBD5E1',
    glow: 'rgba(148, 163, 184, 0.2)',
    bg: 'rgba(148, 163, 184, 0.08)',
    badgeBg: 'rgba(148, 163, 184, 0.14)',
  },
}

export const ROLE_COLORS: Record<string, string> = {
  work: ROLE_THEMES.work.primary,
  learn: ROLE_THEMES.learn.primary,
  rest: ROLE_THEMES.rest.primary,
  other: ROLE_THEMES.other.primary,
}

export const ROLE_TAGS: Record<string, string[]> = {
  work: ['Разработка UI', 'Архитектура', 'Code Review', 'Рефакторинг', 'Планирование sprint', 'Багфикс', 'Встреча'],
  learn: ['Книга / Статья', 'Курс / Видео', 'Английский', 'Алгоритмы', 'Новые технологии', 'Заметки'],
  rest: ['Кофе-брейк', 'Прогулка', 'Разминка / Спорт', 'Обед', 'Отдых для глаз', 'Медитация'],
}

export const TIMER_PRESETS = [15, 20, 25, 45, 60]

export const DESIGN_TOKENS = {
  bgMain: '#0B0F17',
  bgCard: 'rgba(19, 27, 42, 0.75)',
  bgCardHover: 'rgba(26, 38, 59, 0.85)',
  bgInput: 'rgba(15, 23, 42, 0.9)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderFocus: 'rgba(255, 255, 255, 0.2)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  fontMain: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
}
