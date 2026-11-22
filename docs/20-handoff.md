# 20 双智能体分工与接口契约

> 2026-11-22 收尾。一个做功能，一个做视觉，共用同一个仓库。
> **这份文件是唯一的分工依据**，冲突时以它为准。

## 1. 分工

| | 功能侧（栈师） | 视觉侧（Kimi） |
|---|---|---|
| 负责 | 数据层、文件系统、状态流转、交互逻辑、构建通过 | 布局、配色、字体、材质、动效、组件外观 |
| 目录 | `src/db` `src/fs` `src/storage` `src/lib` | `src/ui`（新建）`src/features/*/*.css` |
| 不碰 | 视觉参数（除非为了可读性修对比度） | 数据调用、`useEffect` 里的读写、`db`/`fs` 的函数 |

**明确归功能侧的判断**：某个字段该不该显示、点了之后发生什么、失败了怎么提示。
**明确归视觉侧的判断**：这块放哪、多大、什么颜色、有没有动效。

## 2. 接口契约（视觉侧可以自由改结构，但不能改这些 props）

```ts
DashboardScreen  { data, paidCounts, onOpen, onAll, onLibrary }
ReconcileScreen  { students, assignment, initialPaid,
                   onBack, onOpenImport, onToggleStatus, onClone }
AssignmentList   { assignments, paidCounts, onOpen,
                   onCreate, onUpdate, onDelete, onImportRoster, onToday }
LibraryScreen    { onBack }
ImportScreen     { onCancel, onDone }
```

需要新字段：**先跟功能侧说**，由功能侧加进 `db/index.ts` 的类型与查询函数，视觉侧再接。

## 3. 三条纪律（都是已经踩过的坑）

1. **提交只能由一方做。** 上次 `git add -A` 把另一路的文档、README 索引一起卷进提交，还误生成过一份 478 行的方案。
   现在：功能侧只 `git add` 自己改过的路径；视觉侧**只写文件，不执行 git 命令**。
2. **同一个文件不要两边同时改。** 尤其是 `features/*/XxxScreen.tsx`——它同时含结构和逻辑。
   视觉侧要动结构时，先只改 CSS；必须改 JSX 时，先在会话里说一句"我要动 DashboardScreen 的 JSX"。
3. **改完跑一次 `npm run build`。** 它同时跑 `tsc --noEmit` 和打包，红了说明契约破了，别等对方发现。

## 4. 谁先做视觉，谁先做功能

- 功能侧：不等待，按 `15-m3-plan.md` 继续推（对象存储 → 学生端）。
- 视觉侧：可以基于**现有真实数据**改样式，不要为了好看伪造字段。
- 交汇点：功能侧每加一个新界面，先给**能跑的最小版**，再交给视觉侧改造。**不要先画空壳**。

## 5. 今天的收尾状态

| | 状态 |
|---|---|
| 功能 | M0/M1/M2 完成；M3 到"本地发布 + 已发布列表 + 下架" |
| 视觉 | 看板骨架（左导航 / 主行动区 / 时间轴 / 两栏数字），动效未做 |
| 卡点 | 对象存储选型未定（R2 / 腾讯 COS） |
| 已知不足 | 1024–1150px 宽度下面板偏挤；工作台页仍是旧样式 |
