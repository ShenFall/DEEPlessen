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
}

export const ASSIGNMENT: Assignment = {
  id: 'a_ds_04',
  course: '数据结构',
  title: '作业 4',
  due: '2026-11-22T23:59:00+08:00',
}

/**
 * 假数据，用于 M0 验证交互。
 * 29 条记录 = 28 人在用 + 1 条离班（周砚锐），对应 docs/04 的真实案例。
 * 全部为脱敏后的虚构姓名，学号保留「10 位 + 前导 0」结构。
 */
export const ROSTER: Student[] = [
  { id: 's01', sid: '0108260001', name: '林嘉禾', active: true },
  { id: 's02', sid: '0108260002', name: '陈知远', active: true },
  { id: 's03', sid: '0108260003', name: '王思睿', active: true },
  { id: 's04', sid: '0108260004', name: '李子衿', active: true },
  { id: 's05', sid: '0108260005', name: '赵一诺', active: true },
  { id: 's06', sid: '0108260006', name: '周予安', active: true },
  { id: 's07', sid: '0108260007', name: '吴桐', active: true },
  { id: 's08', sid: '0108260008', name: '郑亦舟', active: true },
  { id: 's09', sid: '0108260009', name: '周砚锐', active: false },
  { id: 's10', sid: '0108260010', name: '孙时雨', active: true },
  { id: 's11', sid: '0108260011', name: '何若谷', active: true },
  { id: 's12', sid: '0108260012', name: '徐问渠', active: true },
  { id: 's13', sid: '0108260013', name: '马星野', active: true },
  { id: 's14', sid: '0108260014', name: '朱玄同', active: true },
  { id: 's15', sid: '0108260015', name: '胡云归', active: true },
  { id: 's16', sid: '0108260016', name: '郭怀瑾', active: true },
  { id: 's17', sid: '0108260017', name: '唐栖迟', active: true },
  { id: 's18', sid: '0108260018', name: '冯临川', active: true },
  { id: 's19', sid: '0108260019', name: '宋知微', active: true },
  { id: 's20', sid: '0108260020', name: '谢小满', active: true },
  { id: 's21', sid: '0108260021', name: '韩清和', active: true },
  { id: 's22', sid: '0108260022', name: '曹砚秋', active: true },
  { id: 's23', sid: '0108260023', name: '邓照野', active: true },
  { id: 's24', sid: '0108260024', name: '许望舒', active: true },
  { id: 's25', sid: '0108260025', name: '傅既白', active: true },
  { id: 's26', sid: '0108260026', name: '沈砚', active: true },
  { id: 's27', sid: '0108260027', name: '卢青梧', active: true },
  { id: 's28', sid: '0108260028', name: '姜穗', active: true },
  { id: 's29', sid: '0108260029', name: '崔听澜', active: true },
]

export const ACTIVE_ROSTER = ROSTER.filter((s) => s.active)
