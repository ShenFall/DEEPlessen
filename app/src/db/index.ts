import Dexie, { type Table } from 'dexie'
import { ASSIGNMENT as SEED_ASSIGNMENT, ROSTER } from '../data/roster'

export type Student = {
  id: string
  sid: string
  name: string
  active: boolean
}

export type AssignmentStatus = 'open' | 'reconciling' | 'closed'

export type Assignment = {
  id: string
  course: string
  title: string
  due: string
  status: AssignmentStatus
  total: number
  createdAt: string
  clonedFrom?: string
}

export type Submission = {
  key: string
  assignmentId: string
  studentId: string
  state: 'unpaid' | 'paid'
  submittedAt?: string
  updatedAt: string
}

export type Meta = { key: string; value: string }

/** 存放不可序列化成 JSON 的东西，比如 FileSystemDirectoryHandle */
export type HandleRecord = { key: string; value: unknown }

export type PublishItem = { name: string; size: number; file: string }

export type Todo = {
  id: string
  title: string
  done: boolean
  due?: string
  createdAt: string
  doneAt?: string
}

export type Publish = {
  id: string
  course: string
  state: 'local' | 'uploading' | 'published' | 'offline'
  items: PublishItem[]
  createdAt: string
}

class DeepDB extends Dexie {
  students!: Table<Student, string>
  assignments!: Table<Assignment, string>
  submissions!: Table<Submission, string>
  meta!: Table<Meta, string>
  handles!: Table<HandleRecord, string>
  publishes!: Table<Publish, string>
  todos!: Table<Todo, string>

  constructor() {
    super('deep')
    this.version(1).stores({
      students: 'id, sid, name, active',
      assignments: 'id, due, status',
      submissions: 'key, assignmentId, studentId, state',
      meta: 'key',
    })
    // v2：作业加 createdAt / clonedFrom，便于排序与追溯
    this.version(2)
      .stores({
        assignments: 'id, due, status, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('assignments')
          .toCollection()
          .modify((a: Assignment) => {
            if (!a.createdAt) a.createdAt = a.due ?? new Date().toISOString()
          })
      })
    // v3：存目录句柄
    this.version(3).stores({
      handles: 'key',
    })
    // v4：发布记录
    this.version(4).stores({
      publishes: 'id, createdAt, state',
      submissions: 'key, assignmentId, studentId, state, submittedAt',
    })
    // v5：手动待办
    this.version(5).stores({
      todos: 'id, done, createdAt',
    })
  }
}

export const db = new DeepDB()

export type Workspace = {
  students: Student[]
  assignment: Assignment
  paid: string[]
}

async function seed() {
  const total = ROSTER.filter((s) => s.active).length
  await db.transaction('rw', db.students, db.assignments, async () => {
    await db.students.bulkPut(ROSTER)
    await db.assignments.put({
      id: SEED_ASSIGNMENT.id,
      course: SEED_ASSIGNMENT.course,
      title: SEED_ASSIGNMENT.title,
      due: SEED_ASSIGNMENT.due,
      status: 'reconciling',
      total,
      createdAt: new Date().toISOString(),
    })
  })
  await db.meta.put({ key: 'seededAt', value: new Date().toISOString() })
}

export async function ensureSeed() {
  const count = await db.students.count()
  if (count === 0) await seed()
}

/** 进行中的排前面，其次按创建时间倒序 */
export async function listAssignments(): Promise<Assignment[]> {
  const all = await db.assignments.toArray()
  return all.sort((a, b) => {
    const rank = (s: AssignmentStatus) => (s === 'closed' ? 1 : 0)
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })
}

export async function loadWorkspace(id?: string): Promise<Workspace | null> {
  await ensureSeed()
  const list = await listAssignments()
  const target = id
    ? list.find((a) => a.id === id)
    : list.find((a) => a.status !== 'closed') ?? list[0]
  if (!target) return null

  const [students, subs] = await Promise.all([
    db.students.orderBy('sid').toArray(),
    db.submissions.where('assignmentId').equals(target.id).toArray(),
  ])

  return {
    students,
    assignment: target,
    paid: subs.filter((s) => s.state === 'paid').map((s) => s.studentId),
  }
}

export async function countActiveStudents() {
  return db.students.filter((s) => s.active).count()
}

export async function paidCounts(): Promise<Record<string, number>> {
  const rows = await db.submissions.where('state').equals('paid').toArray()
  const map: Record<string, number> = {}
  for (const r of rows) map[r.assignmentId] = (map[r.assignmentId] ?? 0) + 1
  return map
}

/** 名单变过之后，未结束的清点人数要跟着改，否则卡片上的 x/y 会失真 */
export async function syncAssignmentTotals() {
  const total = await countActiveStudents()
  const open = await db.assignments
    .filter((a) => a.status !== 'closed')
    .toArray()
  const stale = open.filter((a) => a.total !== total)
  if (!stale.length) return
  await db.assignments.bulkPut(stale.map((a) => ({ ...a, total })))
}

export async function createAssignment(input: {
  course: string
  title: string
  due: string
  clonedFrom?: string
}): Promise<string> {
  const total = await countActiveStudents()
  const id = `a_${Date.now().toString(36)}`
  await db.assignments.put({
    id,
    course: input.course,
    title: input.title,
    due: input.due,
    status: 'reconciling',
    total,
    createdAt: new Date().toISOString(),
    clonedFrom: input.clonedFrom,
  })
  return id
}

export async function setAssignmentStatus(
  id: string,
  status: AssignmentStatus,
) {
  await db.assignments.update(id, { status })
}

/** 复制：只带课程与标题，不带任何提交记录 */
export async function cloneAssignment(id: string): Promise<string | null> {
  const src = await db.assignments.get(id)
  if (!src) return null
  return createAssignment({
    course: src.course,
    title: src.title,
    due: src.due,
    clonedFrom: src.id,
  })
}

export async function updateAssignment(
  id: string,
  patch: { course: string; title: string; due: string },
) {
  await db.assignments.update(id, patch)
}

/** 删除清点：连同它的提交记录一起删，不可恢复 */
export async function deleteAssignment(id: string) {
  await db.transaction('rw', [db.assignments, db.submissions], async () => {
    await db.submissions.where('assignmentId').equals(id).delete()
    await db.assignments.delete(id)
  })
}

export async function setPaid(
  assignmentId: string,
  studentId: string,
  paid: boolean,
) {
  const now = new Date().toISOString()
  await db.submissions.put({
    key: `${assignmentId}:${studentId}`,
    assignmentId,
    studentId,
    state: paid ? 'paid' : 'unpaid',
    submittedAt: paid ? now : undefined,
    updatedAt: now,
  })
}

export async function clearAssignment(assignmentId: string) {
  await db.submissions.where('assignmentId').equals(assignmentId).delete()
}

export async function saveHandle(key: string, value: unknown) {
  await db.handles.put({ key, value })
}

export async function loadHandle<T>(key: string): Promise<T | null> {
  const row = await db.handles.get(key)
  return (row?.value as T) ?? null
}

/* ---------- 待办 ---------- */

export async function listTodos(): Promise<Todo[]> {
  const all = await db.todos.toArray()
  return all
    .filter((t) => !t.done)
    .sort((a, b) => {
      const da = a.due ?? ''
      const db_ = b.due ?? ''
      if (da !== db_) return da.localeCompare(db_)
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export async function createTodo(title: string, due?: string) {
  const text = title.trim()
  if (!text) return
  await db.todos.put({
    id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    title: text,
    done: false,
    due,
    createdAt: new Date().toISOString(),
  })
}

export async function setTodoDone(id: string, done: boolean) {
  await db.todos.update(id, {
    done,
    doneAt: done ? new Date().toISOString() : undefined,
  })
}

export async function deleteTodo(id: string) {
  await db.todos.delete(id)
}

export async function setTodoDue(id: string, due?: string) {
  await db.todos.update(id, { due })
}

export async function savePublish(p: Publish) {
  await db.publishes.put(p)
}

export async function listPublishes(): Promise<Publish[]> {
  const all = await db.publishes.toArray()
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type MarkRecord = {
  studentName: string
  at: string
  course: string
  title: string
}

export type DashboardData = {
  running: Assignment[]
  openCount: number
  unpaidCount: number
  paidTotal: number
  publishCount: number
  materialCount: number
  marks: MarkRecord[]
  todos: Todo[]
}

/** 看板一次取全，避免页面里散着查 */
export async function loadDashboard(): Promise<DashboardData> {
  const [assignments, subs, students, pubs, todos] = await Promise.all([
    listAssignments(),
    db.submissions.where('state').equals('paid').toArray(),
    db.students.toArray(),
    db.publishes.toArray(),
    listTodos(),
  ])

  const paidBy = new Map<string, number>()
  for (const s of subs) {
    paidBy.set(s.assignmentId, (paidBy.get(s.assignmentId) ?? 0) + 1)
  }

  const running = assignments.filter((a) => a.status !== 'closed')
  const unpaidCount = running.reduce(
    (sum, a) => sum + Math.max(0, a.total - (paidBy.get(a.id) ?? 0)),
    0,
  )

  const nameOf = new Map(students.map((s) => [s.id, s.name]))
  const assignmentOf = new Map(assignments.map((a) => [a.id, a]))

  const marks: MarkRecord[] = subs
    .filter((s) => s.submittedAt)
    .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
    .slice(0, 6)
    .map((s) => {
      const a = assignmentOf.get(s.assignmentId)
      return {
        studentName: nameOf.get(s.studentId) ?? '未知',
        at: s.submittedAt!,
        course: a?.course ?? '',
        title: a?.title ?? '',
      }
    })

  return {
    running,
    openCount: running.length,
    unpaidCount,
    paidTotal: running.reduce((sum, a) => sum + (paidBy.get(a.id) ?? 0), 0),
    publishCount: pubs.filter((p) => p.state !== 'offline').length,
    materialCount: pubs.reduce((sum, p) => sum + p.items.length, 0),
    marks,
    todos,
  }
}

/** 清空所有本地数据，回到随包的那份示例名单 */export async function resetToSeed() {
  await db.transaction(
    'rw',
    [db.students, db.assignments, db.submissions, db.meta],
    async () => {
      await db.submissions.clear()
      await db.students.clear()
      await db.assignments.clear()
      await db.meta.clear()
    },
  )
  await seed()
}
