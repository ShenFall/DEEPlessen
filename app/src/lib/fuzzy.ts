/**
 * 极简模糊匹配：子串命中优先，其次按顺序的字符跳跃命中。
 * 不做拼音（没有词典），但能处理「分镜 → 科普视频分镜脚本」这类。
 */
export function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return 1

  const idx = t.indexOf(q)
  if (idx >= 0) return 1000 - Math.min(idx, 300)

  let cursor = 0
  let last = -1
  let hit = 0
  let gaps = 0

  for (const ch of q) {
    if (ch === ' ') continue
    const found = t.indexOf(ch, cursor)
    if (found < 0) return 0
    if (last >= 0) gaps += found - last - 1
    hit += 1
    last = found
    cursor = found + 1
  }

  return Math.max(1, 200 - gaps * 4 - (t.length - hit))
}

/** 多词用空格分隔，需全部命中 */
export function fuzzyMatch(text: string, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((token) => fuzzyScore(text, token) > 0)
}

/** 在多个字段里取最高分 */
export function fuzzyBest(fields: string[], query: string): number {
  const q = query.trim()
  if (!q) return 1
  let best = 0
  for (const field of fields) {
    const tokens = q.toLowerCase().split(/\s+/)
    let sum = 0
    let ok = true
    for (const token of tokens) {
      const s = fuzzyScore(field, token)
      if (s === 0) {
        ok = false
        break
      }
      sum += s
    }
    if (ok) best = Math.max(best, sum)
  }
  return best
}
