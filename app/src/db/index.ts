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

class DeepDB extends Dexie {
  students!: Table<Student, string>
  assignments!: Table<Assignment, string>
  submissions!: Table<Submission, string>
  meta!: Table<Meta, string>
  handles!: Table<HandleRecord, string>

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
