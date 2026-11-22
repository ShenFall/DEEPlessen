import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Boundary } from './Boundary'
import './styles/tokens.css'
import './styles/base.css'

/** 跟随系统深浅（教室白天走「旧纸」，夜里走「深空」） */
const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

function applyTheme() {
  document.documentElement.dataset.theme = lightQuery.matches ? 'paper' : 'void'
}

applyTheme()
lightQuery.addEventListener('change', applyTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
)
