/** 构建平台：mobile 只做待办/点名，desk 只做资料，full 开发时全开 */
export const PLATFORM: 'mobile' | 'desk' | 'full' =
  (import.meta.env.VITE_PLATFORM as 'mobile' | 'desk' | undefined) ?? 'full'

export const isMobile = PLATFORM === 'mobile'
export const isDesk = PLATFORM === 'desk'
