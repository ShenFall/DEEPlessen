# 23 Token 与动效规格（对应 22 号 §5 / §6）

> 2026-11-23。视觉侧（Kimi）交付稿。
>
> 依据 [22-spec-v3.md](22-spec-v3.md) 的结构判断；本文只定义**视觉参数**，不涉及数据字段、点击行为、失败提示和 props 契约。
> 合并方式：直接替换 22 号的 §5 / §6，其余章节不动。为避免与总工并发编辑，本文暂不直接改 22。

## 5. 设计 Token

### 5.0 三层结构

| 层 | 作用 | 例子 |
|---|---|---|
| Primitive | 唯一色值、字号、间距、曲线 | `#0F1620`、`13px`、`cubic-bezier(.2,.8,.2,1)` |
| Semantic | 说明“用在哪” | `--text-primary`、`--panel-bg`、`--border-control` |
| Component | 单组件局部变量 | `--todo-check-size`、`--name-cell-min-h` |

规则：

1. 组件 CSS 只引用 Semantic / Component 变量，不写裸十六进制。
2. 色值只存在于 `tokens.css` 一处，端级只覆盖圆角、面板底、密度。
3. 现有 `--bg / --surface / --cell / --line / --text / --dim / --mute / --gold / --amber / --red / --signal` 变量名保留，不重命名，避免大面积回归。
4. 新增语义变量是对现有色的**可访问性变体**，不是新品牌色。

### 5.1 色彩 Token 与实测对比度

对比度按 WCAG 2.x 相对亮度计算。正文要求 ≥ 4.5:1；大字与非文本 UI 要求 ≥ 3:1。

#### 深空（`[data-theme="void"]`）

| Token | 值 | 对 `--bg` | 对 `--surface` | 对 `--cell` | 用途与限制 |
|---|---|---:|---:|---:|---|
| `--bg` | `#0F1620` | — | — | — | 页面底 |
| `--surface` | `#16233A` | — | — | — | 卡片面 |
| `--cell` | `#1B3152` | — | — | — | 姓名格、输入底 |
| `--line` | `rgba(242,237,228,.12)` | 1.37 | — | — | 只做装饰性细线，不能作为控件唯一边界 |
| `--line-control` | `#6B7C94` | 4.27 | 3.70 | 3.07 | 输入框、可点控件的可见边界 |
| `--text` | `#F2EDE4` | 15.58 | 13.48 | 11.20 | 主文字 |
| `--dim` | `#9AA6B8` | 7.37 | 6.38 | 5.30 | 次级信息、时间、计数、说明 |
| `--mute` | `#5C6878` | 3.21 | 2.78 | 2.31 | **只给禁用态 / 装饰**，不承载信息 |
| `--gold` | `#D38A43` | 6.48 | 5.61 | 4.66 | 主按钮底、归位态、金色图形 |
| `--gold-text` | `#D38A43` | 6.48 | 5.61 | 4.66 | 金色文字（深空与 `--gold` 同值） |
| `--amber` | `#E9A341` | 8.46 | 7.32 | 6.08 | 提醒、倒计时 |
| `--red` | `#E2603F` | 5.17 | 4.48 | 3.72 | 2px 边线、图形；面板内正文用 `--red-text` |
| `--red-text` | `#E86F4F` | 5.90 | 5.10 | 4.24 | 面板内红色文字；只用于 bg / surface，cell 上不可承载正文 |
| `--signal` | `#4C7BE0` | 4.51 | 3.91 | 3.24 | 焦点环、2px 边线、图形 |
| `--signal-text` | `#6E9BFF` | 6.74 | 5.84 | 4.85 | 卡片内链接 / 可点文字；原色在 surface 上不足 4.5 |
| `--green` | `#7FA36B` | 6.36 | 5.51 | 4.57 | 成功 / 已发布 |
| `--on-accent` | `#1A1206` | — | — | — | 金底按钮文字，对 `--gold` 6.61 |

#### 纸白（`[data-theme="paper"]`）

| Token | 值 | 对 `--bg` | 对 `--surface` | 用途与限制 |
|---|---|---:|---:|---|
| `--bg` | `#F7F4EE` | — | — | 页面底 |
| `--surface` | `#FFFFFF` | — | — | 卡片面 |
| `--cell` | `#FFFFFF` | — | — | 姓名格 |
| `--line` | `#E2DCD1` | 1.24 | 1.36 | 只做装饰细线 |
| `--line-control` | `#8A8175` | 3.49 | 3.83 | 控件可见边界 |
| `--text` | `#1A1F2A` | 15.02 | 16.49 | 主文字 |
| `--dim` | `#5E6572` | 5.34 | 5.87 | 次级信息（**修正项**） |
| `--mute` | `#616875` | 5.11 | 5.61 | 三级非必要提示 / 禁用态；弱化姓名用 `--dim`，不用 `--mute` |
| `--gold` | `#B4762C` | 3.44 | 3.77 | 只做边线 / 图标，不能做正文 |
| `--gold-text` | `#8C5A20` | 5.32 | 5.84 | 金色文字、链接、选中态（**新增**） |
| `--amber` | `#8C5A20` | 5.32 | 5.84 | 提醒文字（**修正项**） |
| `--red` | `#C0432A` | 4.69 | 5.15 | 危机边线与文字 |
| `--red-text` | `#C0432A` | 4.69 | 5.15 | 与 `--red` 同值 |
| `--signal` | `#2F5BD8` | 5.30 | 5.82 | 链接、焦点环 |
| `--signal-text` | `#2F5BD8` | 5.30 | 5.82 | 与 `--signal` 同值 |
| `--green` | `#4E7A3F` | 4.58 | 5.02 | 成功 / 已发布 |
| `--on-accent` | `#1A1206` | — | — | 对 `--gold` 4.91 |

#### 三条硬规则

1. **`--mute` 永不承载必要信息。** 时间、计数、老师姓名、已交姓名、说明文字一律用 `--dim`；`--mute` 只给禁用、占位、装饰。
2. **金色拆成“线”和“字”。** 纸白 `--gold` `#B4762C` 只有 3.44:1，只可做边线/图标；任何文字用 `--gold-text` `#8C5A20`。
3. **红色全站最多一处。** 仅“欠交且距 DDL < 24h”或危险确认；不能同时出现在导航、按钮和标签上。

### 5.2 字体 Token

现有 `--font-mono`、`--font-sans` 保留。新增字号与行高：

| Token | 字号 / 行高 | 字重 | 字距 | 用途 |
|---|---|---|---|---|
| `--fs-11` | 11 / 1.45 | 400 | mono `.12em`（eyebrow） | 来源、快捷键、极小元信息 |
| `--fs-12` | 12 / 1.5 | 400 | 0 | 标签、筛选项、说明 |
| `--fs-13` | 13 / 1.5 | 400 | 0 | 默认正文 |
| `--fs-15` | 15 / 1.55 | 400–500 | 0 | 文件名、按钮、重点行 |
| `--fs-20` | 20 / 1.35 | 500 | 中文 `.02em` | 卡片标题、页面小标题 |
| `--fs-26` | 26 / 1.25 | 500 | 拉丁 `-.02em` | 手机展示标题 |
| `--fs-34` | 34 / 1.15 | 500 | 拉丁 `-.02em` | 桌面展示标题 |
| `--fs-display` | 手机 26 / 桌面 34 | 500 | 同上 | 只用于首页问候与资料空间主标题 |

规则：

- 全站只用 400 / 500 两档；不引入 600 / 700。
- 数字、人数、时间、倒计时：`font-family: var(--font-mono)` + `font-variant-numeric: tabular-nums`。
- 正文行高不低于 1.5；学生门户 1.6–1.7。
- 中文正文不加字距；仅短标题可 `.02em`。

### 5.3 间距与布局 Token

4px 基础单位，8px 主节奏。

| Token | 值 | 用途 |
|---|---:|---|
| `--space-1` | 4px | 图标与文字、格子缝 |
| `--space-2` | 8px | 组件内部紧凑间距 |
| `--space-3` | 12px | 按钮/输入水平内边距 |
| `--space-4` | 16px | 卡片内边距、常规块间距 |
| `--space-5` | 20px | 看板区块间距 |
| `--space-6` | 24px | 页面区块 |
| `--space-8` | 32px | 大区块分隔 |
| `--space-10` | 40px | 桌面页边距、Hero 留白 |

布局常量：

| Token | 值 | 说明 |
|---|---:|---|
| `--rail-w` | 64px | 桌面左侧导航（以现有骨架为准，替代旧 56px） |
| `--topbar-h` | 56px | 顶栏 |
| `--content-max` | 1180px | 内容最大宽（现有骨架）；更宽屏只增加留白 |
| `--reader-max` | 560px | 学生门户单列 |
| `--page-gutter` | 手机 14px / 桌面 40px | 保留现有 14px，不强行并进 4px 栅格 |
| `--touch-min` | 48px | 学委端手机触控目标 |
| `--reader-touch` | 44px | 学生门户最小触控目标 |

例外与迁移：

- `dashboard.css` 的 `margin-bottom: 18px` 应改为 `20px`；`18px` 不在刻度内。
- 现有 `--pad-x: 14px` 保留为移动端页边距，属于刻意例外，不改成 16。
- 不用 `gap: 18px`、`padding: 22px` 这类未登记值。

### 5.4 圆角、边线与高度

| Token | 看板 | 工作台 | 学生门户 | 说明 |
|---|---:|---:|---:|---|
| `--r-card` | 20px | 8px | 12px | 大卡片 |
| `--r-card-inner` | 16px | 4px | 8px | `calc(var(--r-card) - 4px)` |
| `--r-ctrl` | 10px | 4px | 8px | 按钮、输入、行 |
| `--r-pill` | 999px | 999px | 999px | 状态胶囊 |
| `--border-hairline` | 1px | 1px | 1px | 装饰细线 |
| `--border-control` | 1px | 1px | 1px | 控件边界，色值用 `--line-control` |
| `--border-accent` | 2px | 2px | 2px | 左侧状态线 |
| `--focus-ring` | 2px | 2px | 2px | `outline`，外偏移 2px |

保留旧 `--r-sm:4 / --r-md:6 / --r-lg:10` 供未迁移页面使用；新组件一律用 `--r-card / --r-ctrl`，不引用旧变量。

端级覆盖落点（**纯 CSS，不改 JSX**）：

```css
/* tokens.css：工作台是默认密度 */
:root {
  --r-card: 8px;
  --r-ctrl: 4px;
}

/* dashboard.css：看板根节点已经是 .db */
.db {
  --r-card: 20px;
  --r-ctrl: 10px;
}

/* 学生门户新建时在根节点加 data-app="portal"；现在无迁移成本 */
[data-app="portal"] {
  --r-card: 12px;
  --r-ctrl: 8px;
}
```

阴影与材质：

- 工作台：卡片无阴影，只用细线。
- 看板：卡片无阴影；只有抽屉、命令面板、Toast 允许 `--shadow-overlay: 0 24px 80px rgba(0,0,0,.45)`。
- 看板面板：`--panel-bg: rgba(21,41,75,.56)`，实色降级 `#101C2E`；`backdrop-filter: blur(12px)` 只允许顶栏和浮层，正文后必须有实色。
- 学生门户：不用玻璃和阴影。

### 5.5 层级

| Token | 值 | 用途 |
|---|---:|---|
| `--z-base` | 0 | 内容 |
| `--z-sticky` | 10 | 吸顶栏、筛选条 |
| `--z-drawer` | 20 | 未交抽屉、待办抽屉 |
| `--z-dialog` | 30 | 命令面板、确认层 |
| `--z-toast` | 40 | Toast |
| `--z-skip` | 50 | 跳转正文链接 |

### 5.6 可直接合并的 CSS

```css
:root {
  /* legacy radii: 保留给未迁移页面 */
  --r-sm: 4px;
  --r-md: 6px;
  --r-lg: 10px;

  /* semantic radii：工作台默认，看板在 .db 覆盖 */
  --r-card: 8px;
  --r-card-inner: calc(var(--r-card) - 4px);
  --r-ctrl: 4px;
  --r-pill: 999px;

  /* type */
  --fs-11: 11px;
  --fs-12: 12px;
  --fs-13: 13px;
  --fs-15: 15px;
  --fs-20: 20px;
  --fs-26: 26px;
  --fs-34: 34px;
  --fs-display: var(--fs-26);

  /* space */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* layout */
  --pad-x: 14px;
  --page-gutter: 14px;
  --rail-w: 64px;
  --topbar-h: 56px;
  --content-max: 1180px;
  --reader-max: 560px;
  --touch-min: 48px;
  --reader-touch: 44px;

  /* panel material */
  --panel-blur: 12px;
  --shadow-overlay: 0 24px 80px rgba(0, 0, 0, 0.45);

  /* motion */
  --t-press: 90ms;
  --t-hover: 120ms;
  --t-check: 120ms;
  --t-fade: 120ms;
  --t-page: 180ms;
  --t-panel: 200ms;
  --t-mark: 220ms;
  --t-toast-in: 180ms;
  --t-toast-out: 140ms;
  --t-toast-dwell: 3500ms;
  --t-drawer: 200ms;
  --t-drawer-out: 140ms;
  --t-stagger: 24ms;
  --t-loader-delay: 150ms;
  --t-loader-min: 240ms;
  --t-loader-draw: 900ms;
  --t-loader-exit: 160ms;
  --t-skeleton: 2400ms;
  --t-dots: 1400ms;
  --t-orbit: 6000ms;
  --t-guides: 12000ms;

  /* easing */
  --ease-fall: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* z */
  --z-sticky: 10;
  --z-drawer: 20;
  --z-dialog: 30;
  --z-toast: 40;
  --z-skip: 50;
}

@media (min-width: 1024px) {
  :root {
    --fs-display: var(--fs-34);
    --page-gutter: 40px;
  }
}

[data-theme="void"] {
  --bg: #0f1620;
  --surface: #16233a;
  --cell: #1b3152;
  --panel-bg: rgba(21, 41, 75, 0.56);
  --panel-solid: #101c2e;
  --line: rgba(242, 237, 228, 0.12);
  --line-control: #6b7c94;
  --text: #f2ede4;
  --dim: #9aa6b8;
  --mute: #5c6878;
  --gold: #d38a43;
  --gold-text: #d38a43;
  --amber: #e9a341;
  --red: #e2603f;
  --red-text: #e86f4f;
  --signal: #4c7be0;
  --signal-text: #6e9bff;
  --green: #7fa36b;
  --on-accent: #1a1206;
  --cell-edge: rgba(233, 163, 65, 0.45);
  --paid-fill: rgba(242, 237, 228, 0.035);
  color-scheme: dark;
}

[data-theme="paper"] {
  --bg: #f7f4ee;
  --surface: #ffffff;
  --cell: #ffffff;
  --panel-bg: #ffffff;
  --panel-solid: #ffffff;
  --line: #e2dcd1;
  --line-control: #8a8175;
  --text: #1a1f2a;
  --dim: #5e6572;
  --mute: #616875;
  --gold: #b4762c;
  --gold-text: #8c5a20;
  --amber: #8c5a20;
  --red: #c0432a;
  --red-text: #c0432a;
  --signal: #2f5bd8;
  --signal-text: #2f5bd8;
  --green: #4e7a3f;
  --on-accent: #1a1206;
  --cell-edge: #dcc8a6;
  --paid-fill: rgba(26, 31, 42, 0.03);
  color-scheme: light;
}
```

## 6. 动画规格

### 6.1 原则

1. 动效只解释状态变化，不做气氛烟花的常驻动画。
2. 只动 `transform`、`opacity`；SVG 描边与颜色过渡作为必要例外。
3. 连续标记姓名时，动画不许排队；新点击立即接管当前过渡。
4. 任何动效都不能改变布局尺寸；不做 `height / width / top / left` 过渡。
5. 动效关闭时，信息与操作必须仍然完整。

### 6.2 缓动曲线

| Token | 曲线 | 用途 |
|---|---|---|
| `--ease-fall` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 页面/面板入场、姓名标记、落位 |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | 悬停、按下、勾选、文字退色 |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | 仅循环提示 |
| `linear` | `linear` | 骨架、轨道旋转、卫星匀速 |

旧文档里的 `ease` / `ease-out` 关键字全部替换为显式曲线，避免浏览器默认值不一致。

### 6.3 时长 Token

| Token | 值 | 说明 |
|---|---:|---|
| `--t-press` | 90ms | 按钮按下 / 松开 |
| `--t-hover` | 120ms | 悬停边线、底色 |
| `--t-check` | 120ms | 勾选圆圈与勾线 |
| `--t-fade` | 120ms | 减少动态时的统一淡入 |
| `--t-page` | 180ms | 页面切换 |
| `--t-panel` | 200ms | 面板 / 卡片入场 |
| `--t-mark` | 220ms | 姓名格标记 |
| `--t-toast-in` | 180ms | Toast 进入 |
| `--t-toast-out` | 140ms | Toast 退出 |
| `--t-stagger` | 24ms | 列表逐条延迟 |
| `--t-loader-draw` | 900ms | 轨道轨迹绘制一次 |
| `--t-loader-exit` | 160ms | 加载器退出 |
| `--t-skeleton` | 2400ms | 骨架呼吸循环 |
| `--t-dots` | 1400ms | 加载文案省略号循环 |
| `--t-orbit` | 6000ms | 卫星绕行一圈 |
| `--t-guides` | 12000ms | 虚线辅助环旋转一圈 |

说明：22 号表中的「骨架/加载 2.4s」只指**骨架呼吸**；Orbit Plotter 的卫星与辅助环分别按 6s / 12s，不把品牌加载器加速到 2.4s。两者是不同组件，不共用一个时长。

### 6.4 逐项动效表

| # | 场景 | 属性与数值 | 时长 | 延迟 | 缓动 | 触发 / 打断 |
|---:|---|---|---|---|---|---|
| 1 | 页面切换 | `opacity 0→1`，`translateY(4px)→0` | 180ms | 0 | `--ease-fall` | 路由切换；新导航直接接管 |
| 2 | 面板入场 | `opacity 0→1`，`translateY(6px)→0` | 200ms | 0 | `--ease-fall` | 首次挂载；重复渲染不重播 |
| 3 | 列表逐条入场 | 同 #2，每条延迟 `24ms × index` | 200ms | 0–168ms | `--ease-fall` | 首屏最多 8 条；第 9 条起不延迟 |
| 4 | 卡片/按钮悬停 | 边框 `--line → rgba(255,255,255,.16)`，底不变 | 120ms | 0 | `--ease-out` | 仅 `(hover:hover)`；移出反向 |
| 5 | 按钮按下 | `translateY(1px)` | 90ms | 0 | `--ease-out` | `:active`；松开 120ms 回位 |
| 6 | 待办勾选 | 圆圈 `scale(.98)→1`；勾线 `stroke-dashoffset 24→0` | 120ms | 0 | `--ease-out` | 点击；重复点击从头开始 |
| 7 | 完成文字退色 | `color: --text → --dim`，不位移 | 180ms | 120ms | `--ease-out` | 勾选 120ms 后 |
| 8 | 姓名标记 | 底色/边线/文字色过渡，无缩放 | 220ms | 0 | `--ease-fall` | 点击格子；连点不排队 |
| 9 | Toast 进入 / 退出 | `opacity 0→1`，`translateY(8px)→0`；退出反向 | 180 / 140ms | 0 | `--ease-out` | 标记后；新 Toast 替换旧 Toast |
| 10 | 抽屉 | `opacity 0→1`，`translateX(12px)→0` | 200ms | 0 | `--ease-fall` | 打开；Esc 反向 140ms |
| 11 | 骨架呼吸 | `opacity .55→.85→.55`，循环 | 2400ms | 0 | `linear` | 加载中；页面隐藏时暂停 |
| 12 | Orbit 轨迹绘制 | `stroke-dashoffset 760→0` | 900ms | 0 | `--ease-fall` | 加载器出现，只播一次 |
| 13 | Orbit 辅助环 | `rotate(0→360deg)` | 12000ms | 0 | `linear` | 循环，减少动态时停止 |
| 14 | Orbit 卫星 | `rotate(0→360deg)` | 6000ms | 0 | `linear` | 循环，减少动态时停止 |
| 15 | 加载省略号 | `opacity 1→.25→1` | 1400ms | 0 | `--ease-in-out` | 循环 |
| 16 | 焦点环 | 立即出现，无过渡 | 0ms | 0 | — | 键盘聚焦；不能延迟 |
| 17 | 数字更新（可选） | 旧值 `opacity 1→0`，新值 `0→1` | 180ms | 0 | `--ease-out` | 仅数值真实变化；不滚动计数 |

禁止项：

- 姓名格 `scale`、弹跳、发光、粒子、扫描线。
- 列表项因状态变化重排时的位移动画；坐标必须稳定。
- 超过 250ms 的功能反馈；加载器除外。
- 滚动视差、背景自动游动、光标拖尾。

### 6.5 关键帧与工具类

```css
@keyframes dk-enter-page {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes dk-enter-panel {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes dk-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes dk-check {
  to { stroke-dashoffset: 0; }
}

@keyframes dk-orbit-spin {
  to { transform: rotate(360deg); }
}

@keyframes dk-dots {
  50% { opacity: 0.25; }
}

@keyframes dk-skeleton {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 0.85; }
}

.dk-enter-page {
  animation: dk-enter-page var(--t-page) var(--ease-fall) both;
}

.dk-enter-panel {
  animation: dk-enter-panel var(--t-panel) var(--ease-fall) both;
}

.dk-stagger > * {
  animation: dk-enter-panel var(--t-panel) var(--ease-fall) both;
  animation-delay: calc(var(--i, 0) * var(--t-stagger));
}

.dk-stagger > :nth-child(n + 9) {
  animation: none;
}

.dk-hover {
  transition:
    border-color var(--t-hover) var(--ease-out),
    background-color var(--t-hover) var(--ease-out);
}

.dk-press:active {
  transform: translateY(1px);
  transition: transform var(--t-press) var(--ease-out);
}

.dk-skeleton {
  animation: dk-skeleton var(--t-skeleton) linear infinite;
}

.dk-orbit-spin {
  transform-origin: center;
  animation: dk-orbit-spin var(--t-orbit) linear infinite;
}
```

`--i` 由渲染层按索引写入（0–7）；超过 8 条不加动画，避免首屏一次动 40 个格子。

### 6.6 减少动态

```css
@media (prefers-reduced-motion: reduce) {
  .dk-enter-page,
  .dk-enter-panel,
  .dk-stagger > * {
    animation: dk-fade var(--t-fade) linear both !important;
  }

  .dk-hover,
  .dk-press {
    transition:
      opacity var(--t-fade) linear,
      border-color var(--t-fade) linear,
      background-color var(--t-fade) linear,
      color var(--t-fade) linear !important;
  }

  .dk-press:active { transform: none; }

  .dk-skeleton,
  .dk-orbit-spin,
  .dk-dots,
  .dk-orbit-guides {
    animation: none !important;
  }

  .dk-skeleton { opacity: 0.7; }
  .dk-orbit-trace { stroke-dashoffset: 0; }

  * { scroll-behavior: auto !important; }
}
```

要求：

- 减少动态时保留 120ms 的透明度反馈，不做位移与缩放。
- 加载器直接显示完整轨道，不旋转、不闪。
- 焦点环从不做动画。
- 任何动画关闭后，状态仍能通过颜色、符号、文字判断。

### 6.7 Orbit Plotter 加载时序

| 时间 | 事件 |
|---:|---|
| 0ms | 发起加载，**不立即显示加载器** |
| 150ms | 仍未完成，挂载加载器，120ms 淡入 |
| 150–1050ms | 轨迹绘制 900ms；辅助环开始 12s 旋转；卫星开始 6s 绕行 |
| 数据就绪 | 若加载器已出现，至少停留至 240ms（防闪烁）；随后 160ms 淡出 |
| 数据在 150ms 内就绪 | 完全不出现加载器，直接显示内容 |
| > 8000ms | 文案追加 `仍在加载，检查网络或重试` |
| > 15000ms | 显示重试按钮；不显示伪造百分比 |

规则：

- 不为看动画延迟退出；240ms 只是防闪烁下限。
- 骨架用于卡片局部刷新，Orbit Plotter 只用于首次进入看板或整页加载。
- `document.hidden` 时暂停循环动画，回来再继续；减少动态时永不停留在“半张图”。

### 6.8 性能与验收

- 目标：中端安卓 60fps；连续标记 40 人时无可感知掉帧。
- 只允许动画 `transform` / `opacity`；SVG 描边与颜色为必要例外。
- 不对 `width / height / top / left / margin` 做过渡。
- `will-change` 只在动画期间添加，结束后移除；不常驻。
- 离屏卡片暂停骨架与循环动画；`document.hidden` 时全部暂停。
- 持续帧率 < 50fps 时自动降级：取消列表逐条入场，保留 120ms 淡入。
- 禁止频闪；任何闪烁不得高于 3Hz。

验收：

- [ ] 页面切换 180ms；没有任何界面反馈超过 250ms（加载器除外）。
- [ ] 列表首屏最多 8 条逐条入场，第 9 条起立即可见。
- [ ] 连续点 10 个姓名，每次都在 220ms 内完成，不排队、不阻塞下一次点击。
- [ ] 快速加载 < 150ms 时加载器完全不出现。
- [ ] `prefers-reduced-motion` 下无位移、无旋转、无逐条延迟，信息完整。
- [ ] 所有时长与缓动来自 `--t-*` / `--ease-*`，组件里没有裸 `ms`。
- [ ] 颜色、符号、文字三者至少两者能独立表达状态。

## 7. 与现有代码的差异清单

本次只交付规格，未改代码。合并后需要动的点：

| 文件 | 现状 | 规格要求 |
|---|---|---|
| `tokens.css` | 纸白 `--dim:#6B7280`（4.40）、`--mute:#9A958C`（2.71）、`--amber:#B4762C`（3.44） | 改为 `#5E6572` / `#616875` / `#8C5A20`，新增 `--gold-text` 等可访问性变体 |
| `tokens.css` | 无 `--fs-26/34`、间距、动效时长、z-index | 补齐第 5、6 节变量 |
| `dashboard.css` | 局部 `--void/--panel/--ink/--hair` 与全局并存；`margin-bottom:18px`；`26/34px` 裸值；圆角 20/16/11/10/6 裸值 | 映射到全局语义变量；18→20；字号与圆角用 Token |
| `reconcile.css` | `--mute` 用于计数、提示、元信息；已交格 `opacity:.38` | 信息文字改 `--dim`；已交只弱化底与边，姓名保持可读 |
| `dashboard.css` | 加载动画尚未实现 | 按第 6.7 节接入 Orbit Plotter |

以上改动属于视觉侧 CSS 范围，不改 `.tsx`。执行前先确认功能侧不在同一批文件上工作。
