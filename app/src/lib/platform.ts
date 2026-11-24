/** 构建平台：mobile 只做待办/点名，desk 只做资料，full 开发时全开 */
const env = import.meta.env
const explicit = env.VITE_PLATFORM as 'mobile' | 'desk' | undefined
const mode = env.MODE

export const PLATFORM: 'mobile' | 'desk' | 'full' =
  explicit ?? (mode === 'mobile' ? 'mobile' : mode === 'desk' ? 'desk' : 'full')

export const isMobile = PLATFORM === 'mobile'
export const isDesk = PLATFORM === 'desk'
