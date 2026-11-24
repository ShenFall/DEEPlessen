import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Boundary } from './Boundary'
import { readTheme } from './lib/theme'
import { PLATFORM } from './lib/platform'
import './styles/tokens.css'
import './styles/base.css'

/** 桌面跟随系统深浅；手机统一「深空」，避免切 tab 时黑白跳变 */
const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
const narrowQuery = window.matchMedia('(max-width: 720px)')

function systemTheme(): 'paper' | 'void' {
  if (narrowQuery.matches) return 'paper'
  return lightQuery.matches ? 'paper' : 'void'
}

function sync() {
  // 用户手动选过就以选择为准，否则跟随系统
  const saved = readTheme()
  document.documentElement.dataset.theme = saved ?? systemTheme()
}

document.documentElement.dataset.platform = PLATFORM

sync()
lightQuery.addEventListener('change', sync)
narrowQuery.addEventListener('change', sync)

/**
 * 开发环境不保留 Service Worker：
 * 旧缓存 + 热更新会让页面反复自动刷新，看起来"闪烁"。
 */
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((list) => list.forEach((r) => void r.unregister()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)
