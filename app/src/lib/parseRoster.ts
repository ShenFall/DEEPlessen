import readXlsxFile from 'read-excel-file/browser'

export type RowState = 'ok' | 'warn' | 'bad'

export type ParsedRow = {
  sid: string
  name: string
  state: RowState
  note?: string
}

export type ParseResult = {
  rows: ParsedRow[]
  headerRow: number | null
  sidCol: number | null
  nameCol: number | null
  warnings: string[]
}

const NAME_KEYS = ['姓名', '学生姓名', '名字', 'name']
const SID_KEYS = ['学号', '工号', 'sid', 'student id']

const NAME_RE = /^[\u4e00-\u9fa5·]{2,10}$/
const SID_RE = /^\d{6,}$/

function text(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).trim()
}

function normalizeName(raw: string): string {
  return raw
    .replace(/[\u3000\s]+/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .trim()
}

function hit(value: string, keys: string[]): boolean {
  const v = value.replace(/\s+/g, '').toLowerCase()
  return keys.some((k) => v.includes(k))
}

function columnIndexes(row: string[]): { sid: number; name: number } | null {
  let sid = -1
  let name = -1
  row.forEach((cell, i) => {
    if (sid < 0 && hit(cell, SID_KEYS)) sid = i
    if (name < 0 && hit(cell, NAME_KEYS)) name = i
  })
  return sid >= 0 && name >= 0 ? { sid, name } : null
}

/** 表头找不到时，靠"一串数字 + 一个中文名"猜一行 */
function guessHeader(rows: string[][]): { sid: number; name: number } | null {
  for (const row of rows.slice(0, 12)) {
    const sid = row.findIndex((c) => SID_RE.test(c))
    const name = row.findIndex((c) => NAME_RE.test(c))
    if (sid >= 0 && name >= 0) return { sid, name }
  }
  return null
}

export async function parseRoster(file: File): Promise<ParseResult> {
  const warnings: string[] = []
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    warnings.push('只支持 .xlsx，请用 Excel 另存为 .xlsx 再导入')
  }

  const sheets = await readXlsxFile(file)
  if (!sheets.length) throw new Error('工作簿里没有工作表')

  const best = sheets.reduce((a, b) => (b.data.length > a.data.length ? b : a))
  if (sheets.length > 1) {
    warnings.push(
      `工作簿有 ${sheets.length} 个工作表，已选行数最多的「${best.sheet}」`,
    )
  }

  const grid = best.data.map((row) => row.map(text))

  let headerRow: number | null = null
  let cols: { sid: number; name: number } | null = null

  for (let i = 0; i < Math.min(grid.length, 10); i += 1) {
    const found = columnIndexes(grid[i])
    if (found) {
      headerRow = i
      cols = found
      break
    }
  }

  if (!cols) {
    cols = guessHeader(grid)
    if (cols) {
      warnings.push('没找到「姓名 / 学号」表头，已按数据形态猜测，请核对')
    }
  }

  if (!cols) {
    return { rows: [], headerRow: null, sidCol: null, nameCol: null, warnings: [...warnings, '这张表里找不到学号与姓名'] }
  }

  const start = headerRow === null ? 0 : headerRow + 1
  const rows: ParsedRow[] = []
  const seenSid = new Map<string, number>()
  const seenName = new Map<string, number>()

  for (let i = start; i < grid.length; i += 1) {
    const line = grid[i]
    const rawSid = line[cols.sid] ?? ''
    const rawName = line[cols.name] ?? ''
    if (!rawSid && !rawName) continue

    const name = normalizeName(rawName)
    let sid = rawSid
    let state: RowState = 'ok'
    let note = ''

    if (!NAME_RE.test(name)) {
      state = 'bad'
      note = '姓名不像中文人名'
    }

    if (!sid) {
      state = 'bad'
      note = note || '没有学号'
    } else if (!SID_RE.test(sid)) {
      // Excel 把学号当数字时，前导 0 会消失，甚至会变成科学计数法
      if (/^\d+$/.test(sid) && sid.length < 10) {
        state = 'warn'
        note = `学号只有 ${sid.length} 位，可能丢了前导 0`
      } else {
        state = 'bad'
        note = note || '学号格式不认识'
      }
    }

    if (sid && seenSid.has(sid)) {
      state = 'bad'
      note = `学号与第 ${seenSid.get(sid)! + 1} 行重复`
    } else if (sid) {
      seenSid.set(sid, rows.length)
    }

    if (name && seenName.has(name) && state !== 'bad') {
      state = 'warn'
      note = `与第 ${seenName.get(name)! + 1} 行同名`
    } else if (name) {
      seenName.set(name, rows.length)
    }

    rows.push({ sid, name, state, note })
  }

  if (rows.length === 0) warnings.push('表头下面没有数据行')

  return {
    rows,
    headerRow,
    sidCol: cols.sid,
    nameCol: cols.name,
    warnings,
  }
}
