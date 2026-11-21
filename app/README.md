# 拾课 · 前端代码

> 这部分是 M0（手机对账台骨架）。目前只有 28 个人和一屏格子，没有任何后端。

## 跑起来

```bash
cd app
npm install
npm run dev        # http://127.0.0.1:5178，手机同一 WiFi 可访问
npm run build      # 类型检查 + 生产构建
```

> `npm install` 用的是 `.npmrc` 里配的国内镜像，直连官方源只有 ~55KB/s。

## 目录

```
app/
├── index.html              只有一个空 div，其余全由 JS 挂载
├── vite.config.ts          端口 5178，host: true（手机能连）
├── tsconfig.json           strict + noUnusedLocals
├── .npmrc                  国内镜像
└── src/
    ├── main.tsx            入口：深浅主题跟随系统 + 挂载
    ├── App.tsx             目前只渲染一个界面
    ├── data/roster.ts      假数据：28 人在用 + 1 人离班
    ├── styles/
    │   ├── tokens.css      设计令牌：两套主题的全部颜色
    │   └── base.css        reset、触摸行为、安全区
    └── features/
        └── reconcile/      对账台（本项目的主界面）
            ├── ReconcileScreen.tsx
            └── reconcile.css
```

**为什么按 `features/` 分目录**：一个功能一个文件夹，组件和它的样式放一起。将来加「资料」「通知」就是并列的三个文件夹，不需要在 `components/`、`styles/`、`hooks/` 之间来回跳。

## 建议阅读顺序

按这 6 步读，每一步都能跑起来看效果：

| 顺序 | 文件 | 你会学到 |
|---|---|---|
| 1 | `index.html` | 现代前端只有一个 `<div id="root">`，页面是 JS 画出来的 |
| 2 | `main.tsx` | 怎么用 `matchMedia` 跟随系统深浅色 |
| 3 | `data/roster.ts` | 数据结构长什么样（`Student` 类型） |
| 4 | `styles/tokens.css` | 为什么颜色都写成 `--bg`、`--cell`，而不是直接写 `#15294B` |
| 5 | `ReconcileScreen.tsx` | 状态、事件、派生值——整个应用的核心逻辑都在这里 |
| 6 | `reconcile.css` | 样式怎么跟着状态走（`[data-state="paid"]`） |

## 三个关键概念

### ① 状态不可变：先复制，再修改

```tsx
const next = new Set(paid)   // 复制一份
next.add(id)                 // 改副本
setPaid(next)                // 交回去
```

**不要**写 `paid.add(id); setPaid(paid)`。React 靠「引用是否变了」判断要不要重渲染，原地改同一个 Set，它认为没变，界面就不更新。

### ② 状态用 `data-*` 表达，不拼 class

组件只负责说出「这个格子是已交还是未交」：

```tsx
data-state={isPaid ? 'paid' : 'unpaid'}
```

长什么样交给 CSS：

```css
.cell[data-state='paid'] { opacity: .38; }
```

好处：样式和逻辑互不干扰。想调"已交"的视觉，只改 CSS，不碰 TSX。

### ③ Pointer 事件：区分"点击"和"滚动"

手机上最大的坑是：你明明在滚动，浏览器也认为你点了。

```tsx
pointerdown  → 记住起点坐标和时间
pointermove  → 位移超过 8px，标记 moved = true
click        → 如果 moved 或超过 500ms，忽略
```

为什么最后用 `click` 而不是 `pointerup` 触发？因为 `click` 同时覆盖键盘回车和读屏软件——用 `pointerup` 会牺牲可访问性。

## 想改什么，改哪里

| 想改的 | 去哪 |
|---|---|
| 4 列改成 3 列 | `reconcile.css` → `.rs-grid` 的 `grid-template-columns` |
| 加/删学生 | `data/roster.ts` |
| 让人名更大 | `tokens.css` → `--fs-13`，或 `.cell` 的 `font-size` |
| 点击判定更灵敏 | `ReconcileScreen.tsx` → `TAP_MAX_DIST`（当前 8px） |
| 换主题色 | `tokens.css` → 对应主题下的 `--amber` / `--bg` / `--cell` |
| 撤销只留最近 3 步 | `history` 数组改成 `.slice(-3)` |

## 为什么不用 UI 组件库

Ant Design、MUI 这类库的默认圆角、阴影、间距，会把你锁死在它们的审美里。这套深空皮肤用它们的组件，得重写 80% 的样式——不如自己写 200 行 CSS，而且每一行你都看得懂。

## 下一步

M0 还差：本地持久化（0.9）、收尾态（0.10）、真机验收（0.11）。完整清单见 `../docs/12-m0-plan.md`。
