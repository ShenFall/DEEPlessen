export type Theme = 'paper' | 'void' | 'night'

const KEY = 'shenshi:theme'

export function readTheme(): Theme | null {
  const raw = localStorage.getItem(KEY)
  return raw === 'paper' || raw === 'void' || raw === 'night' ? raw : null
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(KEY, theme)
}

/** 白天纸白 ↔ 深夜蓝黑，来回切 */
export function nextTheme(current: Theme): Theme {
  return current === 'night' ? 'paper' : 'night'
}

export function currentTheme(): Theme {
  const attr = document.documentElement.dataset.theme
  if (attr === 'paper' || attr === 'void' || attr === 'night') return attr
  return 'paper'
}
