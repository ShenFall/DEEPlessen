# 深时 / DEEP

> 一个人用的学委工具：**手机管人，电脑管资料**。
> 不注册、不登录、不联网也能用。由 ShenFall 自用并持续整理，2026 秋。

![深时图标](app/public/icon-512.png)

[![构建安卓 APK](https://github.com/ShenFall/DEEPlessen/actions/workflows/android.yml/badge.svg)](https://github.com/ShenFall/DEEPlessen/actions/workflows/android.yml)

---

## 它解决什么

收作业与发资料是两件不同的事，硬塞进一个界面就会互相拖累。

- **收作业的难点不在"收齐"**，在于第一个人交的时候就要立刻能用、还不能因为少一个人就重排格子 → 拆成**手机端**：点名 + 待办，课堂上一只手能完成
- **发资料的难点不在"上传"**，在于同学不用注册、点开就能拿到 → 拆成**桌面端**：资料库 + 静态门户，导出一次、发一个链接

所以现在是**两个构建，一份代码**，不是一个大而全的看板。

## 两端

| | 形态 | 能做什么 | 状态 |
|---|---|---|---|
| 📱 **手机** | 安卓 APK | 待办、点名（含 Excel 名单导入）、看板；纸白/深夜双主题、离线可用 | 可用，持续打磨 |
| 💻 **电脑** | 浏览器（Edge） | **资料管理器**：收录、分课程、发布、导出学生门户、备份 | **当前主要开发线** |
| 🔗 **同学** | 静态网页 | 搜索（中文/跳字/拼音首字母）、按类型筛选、直接下载 | 可用 |

两端数据**各自独立**：手机自己导一份名单，电脑只管资料。不引入账号和服务器，代价是换设备要导出/导入 JSON 备份。

## 下载

| 想要什么 | 去哪拿 | 国内速度 |
|---|---|---|
| **安卓 App（推荐）** | **https://deep-apk-dv6.pages.dev/** —— 一个按钮直接下载 | 快 |
| 安卓 App（备用） | [Releases · shenshi-latest](https://github.com/ShenFall/DEEPlessen/releases/latest) | 可能超时 |
| 构建日志 | [Actions · 构建安卓 APK](https://github.com/ShenFall/DEEPlessen/actions/workflows/android.yml) | — |

CI 会自动重建并覆盖 `shenshi-latest`；本机打包需要 JDK 17 + Android SDK。

> Debug 包可直接安装，升级时先卸载旧版。

## 资料管理器（当前主线）

电脑端只做这一件事，页面按「库 → 发布 → 门户」三段组织。

### 目录结构

```
I:\DataSystem\
├── materials\<课程>\      ← 你的原件，资源管理器里也能直接整理
├── publish\<课程>-日期\    ← 点「发布」生成的快照，决定哪些给同学看
└── portal\                ← 导出后的学生端成品
```

### 一次发布的完整链路

1. 拖文件进资料页 → 落到 `materials/<课程>/`
2. 选中课程点 **发布** → 生成快照
3. 点 **导出学生门户** → 生成 `portal/`
4. 点 **打包并去上传** → 下载 zip 并打开 Cloudflare
5. Cloudflare → 项目 → Create new deployment → 拖 zip → 部署

网址不变，同学不用重新记。

### 已经做好的细节

- **状态一眼可辨**：分组头显示「已发布 3/8」，每个文件左侧一个点（金=已发布、灰=未发布）
- **发布记录可清理**：只列未下架的，已下架折叠成一行，可逐条删除
- **单文件 25MB 上限**：超出的不打包，另出 `portal/large-files.md` 清单
- **模糊搜索**：子串 → 跳字 → 扩展名 → 拼音首字母（`kpsp` 能搜到「科普视频」）
- **备份**：导出/导入 JSON，覆盖式恢复

### 还没做的

- 课程命名与批量移动（现在文件都在「未分类」）
- 上传时自动推断课程
- 电脑看板在本机无名单时的空态提示

## 两种构建

一份代码，两个产物，平台由 `--mode` 注入到 `index.html` 的 `data-platform`。

| 命令 | 产物 | 用途 |
|---|---|---|
| `npm run dev:mobile` | 端口 5178 | 手机版：底部三 tab，任意宽度单列 |
| `npm run dev:desk` | 端口 5179 | 桌面版：只有资料库 |
| `npm run build:mobile` | `dist/` | 打进 APK（Capacitor） |
| `npm run build:desk` | `dist-desk/` | 拖到 Cloudflare Pages |

## 快速开始

```bash
git clone https://github.com/ShenFall/DEEPlessen.git
cd DEEPlessen/app
npm install          # .npmrc 已配国内镜像
npm run dev:desk     # 资料管理器 → http://127.0.0.1:5179
```

首次进入需选择一个库根目录（建议 `I:\DataSystem`），浏览器会请求目录读写授权。

## 设计基线

- 品牌：深空蓝 `#0F1620`、归位金 `#D38A43`；纸白 `#F7F4EE` 为白天底色
- 线稿底纹取自个人插画，按大三角裁切、`multiply` 压底；深夜模式反相为白线
- 深时方框内是书法「深」字（来自头像），不是字体渲染
- 工作台（点名/导入）守细线、≤8px 圆角、克制动效

## 文档

| 文档 | 内容 |
|---|---|
| [docs/13-status.md](docs/13-status.md) | 当前进度：做到哪、下一步 |
| [docs/22-spec-v3.md](docs/22-spec-v3.md) | 主规格书 v3 |
| [docs/25-publish-guide.md](docs/25-publish-guide.md) | 学生门户发布三步 |
| [docs/29-platform-split.md](docs/29-platform-split.md) | 双端拆分：为什么用构建开关而不是分支 |
| [docs/30-apk-mirror.md](docs/30-apk-mirror.md) | APK 国内分发 |
| [docs/decisions/](docs/decisions/) | 架构决策 ADR |

## 怎么讨论

- 每个决定落到 `docs/decisions/NNNN-*.md`，编号递增；改主意不删旧文件，新开一条注明 Supersedes
- 改界面规格时连「为什么」一起改，不只改结果
- 没想清楚的问题堆到 `docs/08-roadmap.md` 的「待决问题」

本仓库可直接推 GitHub；`.workbuddy/`、构建产物、分发的 APK 均已忽略。
