/**
 * 极简模糊匹配：子串命中优先，其次按顺序的字符跳跃命中。
 * 不做拼音（没有词典），但能处理「分镜 → 科普视频分镜脚本」这类。
 */
const ANCHORS = ['阿','八','擦','搭','蛾','发','噶','哈','击','喀','拉','妈','拿','哦','啪','期','然','撒','塌','挖','昔','压','匝']
const LETTERS = 'abcdefghjklmnopqrstwxyz'.split('')
const collator = new Intl.Collator('zh-Hans-CN')
const initialCache = new Map<string, string>()

/**
 * 取字符串的拼音首字母。
 * 不依赖词典：中文字符在 zh 排序里有固定次序，用 23 个锚字二分定位。
 * 非中文原样保留（小写，去掉符号）。
 */
export function initials(text: string): string {
  const cached = initialCache.get(text)
  if (cached !== undefined) return cached

  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    if (code < 128) {
      if (/[a-z0-9]/i.test(ch)) out += ch.toLowerCase()
      continue
    }
    let idx = 0
    for (let i = 0; i < ANCHORS.length; i += 1) {
      if (collator.compare(ch, ANCHORS[i]) >= 0) idx = i
    }
    out += LETTERS[idx]
  }

  if (initialCache.size > 3000) initialCache.clear()
  initialCache.set(text, out)
  return out
}

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

/** 单字段打分：原文优先，纯字母查询再试拼音首字母（要求连续命中） */
function scoreField(field: string, token: string): number {
  const direct = fuzzyScore(field, token)
  if (direct > 0) return direct
  if (!/^[a-z0-9]+$/.test(token)) return 0
  const at = initials(field).indexOf(token)
  return at < 0 ? 0 : 800 - Math.min(at * 2, 200)
}

/** 在多个字段里取最高分 */
export function fuzzyBest(fields: string[], query: string): number {
  const q = query.trim()
  if (!q) return 1
  const tokens = q.toLowerCase().split(/\s+/)
  let best = 0
  for (const field of fields) {
    let sum = 0
    let ok = true
    for (const token of tokens) {
      const s = scoreField(field, token)
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
