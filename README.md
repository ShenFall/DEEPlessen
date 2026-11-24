# 深时 / DEEP

> 一个人的学委工作台：手机上点名、电脑里整资料、同学扫码取件。
> 由 ShenFall 自用并持续整理，2026 秋。

![深时图标](app/public/icon-512.png)

[![构建安卓 APK](https://github.com/ShenFall/DEEPlessen/actions/workflows/android.yml/badge.svg)](https://github.com/ShenFall/DEEPlessen/actions/workflows/android.yml)

---

## 它解决什么

收作业这件事，难的不是"收齐"，是**第一个人交的时候就立刻能用、还能离线、不能因为少一个人就重排格子**。深时把这件事做成一个人的行动看板，再把资料整理成同学三步能拿到的取件柜。

- **不注册、不登录、不联网也能用**：数据在浏览器 IndexedDB 和本地目录，不上传
- **点名位置恒定**：谁交了只降权不消失，勾一个人下面不会重排
- **零服务器成本**：学生门户是静态网页，资料靠手动导出发布

## 三端

| 端 | 形态 | 能做什么 | 怎么用 |
|---|---|---|---|
| 📱 手机 | 安卓 APK | 待办、点名（含名单导入），纸白主题、离线可用 | 见下方[下载](#下载) |
| 💻 电脑 | 浏览器（Edge） | 看板、待办、作业清点、资料库、发布学生门户 | `cd app && npm install && npm run dev` |
| 🔗 同学 | 静态网页 | 搜索、按类型筛选、下载课件 | 由学委在资料页导出并部署，不提供公共演示站 |

三端数据**各自独立**：手机自己导名单，电脑管资料，靠导出 / 导入 JSON 备份搬运。这是刻意的取舍——不引入账号和服务器。

## 下载

| 想要什么 | 去哪拿 | 国内速度 |
|---|---|---|
| **安卓 App（推荐）** | **https://deep-apk-dv6.pages.dev/** —— 一个按钮直接下载 | 快 |
| 安卓 App（备用） | [Releases · shenshi-latest](https://github.com/ShenFall/DEEPlessen/releases/latest) → `app-debug.apk` | 可能超时 |
| 构建日志 | [Actions · 构建安卓 APK](https://github.com/ShenFall/DEEPlessen/actions/workflows/android.yml) | — |

Release 由 CI 自动更新：`app/` 有改动 → 重新构建 → 覆盖 `shenshi-latest` 里的 APK。**仓库公开后无需登录即可下载。**

> Debug 包可直接安装；升级时先卸载旧版再装。想自己编译需要 JDK 17 + Android SDK，或用上面的云端 Actions。

## 两种构建

一份代码，两个产物——手机端只做待办与点名，桌面端只做资料。

| 命令 | 产物 | 用途 |
|---|---|---|
| `npm run dev:mobile` | 端口 5178 | 手机版，底部 tab，任意宽度单列 |
| `npm run dev:desk` | 端口 5179 | 桌面版，只有资料库 |
| `npm run build:mobile` | `dist/` | 打进 APK |
| `npm run build:desk` | `dist-desk/` | 拖到 Cloudflare Pages |

平台由 `--mode` 决定，写进 `index.html` 的 `data-platform`，样式与路由都按它分支。

## 快速开始

```bash
git clone https://github.com/ShenFall/DEEPlessen.git
cd DEEPlessen/app
npm install          # .npmrc 已配国内镜像
npm run dev:desk     # 桌面：资料库 → http://127.0.0.1:5179
npm run dev:mobile   # 手机：待办/点名 → http://127.0.0.1:5178
```

学生门户的导出与部署见 [docs/25-publish-guide.md](docs/25-publish-guide.md)。
双端拆分方案见 [docs/29-platform-split.md](docs/29-platform-split.md)。

## 设计基线

- 品牌：深空蓝 `#0F1620` 与归位金 `#D38A43`，双星轨道为图形语言；头像中央书法「深」字是个人印记
- 工作台（点名 / 导入）守细线、≤8px 圆角、克制动效；看板与个人空间可用更细腻的材质
- 视觉概念稿 14 件收在 `deep-visual-assets.miora`，素材与分析见 [docs/16](docs/16-assets-generation.md)、[docs/18](docs/18-reference-materials.md)

## 文档

设计、数据与协作文档按编号放在 `docs/`，从 [docs/01](docs/01-vision.md) 到 [docs/26](docs/26-lineart-collage.md)。常看的几份：

| 文档 | 内容 |
|---|---|
| [docs/13-status.md](docs/13-status.md) | **当前进度**：做到哪、下一步 |
| [docs/22-spec-v3.md](docs/22-spec-v3.md) | **主规格书 v3**（唯一真相源） |
| [docs/20-handoff.md](docs/20-handoff.md) | 双智能体分工与接口契约 |
| [docs/25-publish-guide.md](docs/25-publish-guide.md) | 学生门户发布三步 |
| [docs/decisions/](docs/decisions/) | 架构决策 ADR，改主意新开一条不删旧的 |

## 怎么讨论

1. 每个决定落到 `docs/decisions/NNNN-*.md`，编号递增；改主意不删旧文件，新开一条注明 `Supersedes`。
2. 改界面规格时连「为什么」一起改，不只改结果。
3. 没想清楚的问题堆到 `docs/08-roadmap.md` 的「待决问题」，一次讨论一批。
4. 本仓库可直接推 GitHub；`.workbuddy/` 已忽略。
