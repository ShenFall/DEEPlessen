import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Boundary } from './Boundary'
import './styles/tokens.css'
import './styles/base.css'

/** 桌面跟随系统深浅；手机统一「深空」，避免切 tab 时黑白跳变 */
const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
const narrowQuery = window.matchMedia('(max-width: 720px)')

function applyTheme() {
  document.documentElement.dataset.theme = narrowQuery.matches
    ? 'paper'
    : lightQuery.matches
      ? 'paper'
      : 'void'
}

applyTheme()
lightQuery.addEventListener('change', applyTheme)
narrowQuery.addEventListener('change', applyTheme)

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
