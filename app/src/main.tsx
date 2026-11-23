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
    ? 'void'
    : lightQuery.matches
      ? 'paper'
      : 'void'
}

applyTheme()
lightQuery.addEventListener('change', applyTheme)
narrowQuery.addEventListener('change', applyTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)
