import Dexie, { type Table } from 'dexie'
import { ASSIGNMENT, ROSTER } from '../data/roster'

export type Student = {
  id: string
  sid: string
  name: string
  active: boolean
}

export type Assignment = {
  id: string
  course: string
  title: string
  due: string
  status: 'open' | 'reconciling' | 'closed'
  total: number
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

class DeepDB extends Dexie {
  students!: Table<Student, string>
  assignments!: Table<Assignment, string>
  submissions!: Table<Submission, string>
  meta!: Table<Meta, string>

  constructor() {
    super('deep')
    this.version(1).stores({
      students: 'id, sid, name, active',
      assignments: 'id, due, status',
      submissions: 'key, assignmentId, studentId, state',
      meta: 'key',
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
      id: ASSIGNMENT.id,
      course: ASSIGNMENT.course,
      title: ASSIGNMENT.title,
      due: ASSIGNMENT.due,
      status: 'reconciling',
      total,
    })
  })
  await db.meta.put({ key: 'seededAt', value: new Date().toISOString() })
}

export async function loadWorkspace(): Promise<Workspace> {
  const count = await db.students.count()
  if (count === 0) await seed()

  const [students, assignment] = await Promise.all([
    db.students.orderBy('sid').toArray(),
    db.assignments.get(ASSIGNMENT.id),
  ])

  if (!assignment) throw new Error('作业记录缺失')

  const subs = await db.submissions
    .where('assignmentId')
    .equals(assignment.id)
    .toArray()

  return {
    students,
    assignment,
    paid: subs.filter((s) => s.state === 'paid').map((s) => s.studentId),
  }
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

/** 清空所有本地数据，回到随包的那份示例名单 */
export async function resetToSeed() {
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
