# 27 GitHub 收尾接手说明

> 2026-11-23 22:55。总师（代码实现侧）做到一半模型限额，本文件由视觉侧接手补齐 GitHub 收尾，并记录哪些还能由人来完成。
> 依据：仓库 `ShenFall/DEEPlessen`、`.github/workflows/android.yml`、`docs/13-status.md`、仓库截图两张。

## 1. 接手时看到的状态

| 项 | 当时状态 | 问题 |
|---|---|---|
| README | 标题「拾课 / DEEP」、状态写 v0.7 / M0、正文是 20+ 条文档索引 | 与实际产物完全脱节：项目已改名「深时」、三端成形、APK 可装；访客打开仓库看不到能用什么 |
| 仓库可见性 | Private | 用户要求公开 |
| 安装包 | CI 有 `upload-artifact`，但没有 Release | 访客必须登录 GitHub 才能从 Actions 取包，且 artifact 30 天过期，不适合当下载入口 |
| CI 本身 | `fd0897f` 加的云端编译 APK，`8b1a3a0` 补了依赖兜底与环境诊断 | 配置完整，本机无 JDK / Android SDK，无法本地复现编译 |

## 2. 本次已改的三处

1. **`README.md` 重写为公开门面**：一句话定位 + 三端能力表 + 图标 + CI 徽章 + 下载入口 + 快速开始 + 设计基线 + 文档索引下沉。删掉过时的 v0.7/M0 描述和整张 ADR 表（保留链接）。
2. **`.github/workflows/android.yml` 加自动发版**：补 `permissions: contents: write`；在构建成功的 artifact 步骤后加 `softprops/action-gh-release@v2`，把 debug APK 发到固定 tag `shenshi-latest`。这样仓库公开后，访客在 Releases 页无需登录即可下载；每次 `app/` 改动自动重建更新。
3. **本文件**：交接记录与待办动作。

验证：`npm run build` 通过（tsc --noEmit + vite 构建，322KB JS / 105KB gzip，PWA 19 项预缓存）；workflow 关键结构与缩进校验通过。本机没有 Java / Android SDK / gh CLI，APK 是否真正产出要等云端 CI 首次跑成功。

## 3. 还需要人做的两件事（我无法代劳）

### 3.1 把仓库设为 Public

我没有 GitHub 网页操作权限，本机也没有 `gh` CLI，这一步只能你在浏览器点：

1. 打开 https://github.com/ShenFall/DEEPlessen → **Settings**
2. 拉到最底 **Danger Zone** → **Change repository visibility** → **Make public**
3. 按提示输入仓库名确认

> 公开前请确认仓库里没有真实名单 / 学号 / 私人文件路径。当前 `.gitignore` 已排除 `fixtures/real/`、`exports/`、`*.private.*`，仓库里的示例数据是 28 人假名单。

### 3.2 首次触发 CI 生成 Release

改了 workflow 后需要一个提交触发。两条路任选：

- 本次改动**已 commit（`6875fbd`），未 push**（按用户要求只提交不推送）。由用户 push 到 `main` 后，workflow 的 `on.push.paths` 含 `.github/workflows/android.yml`，会自动触发
- 或 push 后到 Actions 页 → 「构建安卓 APK」→ **Run workflow** 手动再跑一次
- 本机有 TLS 拦截（`schannel` 吊销检查），push 需要用户本机执行或用放宽验证的方式

跑完进 Releases 页确认出现 `shenshi-latest` 和里面的 APK。若失败，点开那次 run 看日志——最常见是 Capacitor 生成 Android 工程时 JDK / SDK 版本问题，日志里会写明。

## 4. 已知风险与说明

- **Debug 包**：CI 编的是 `assembleDebug`，可安装但不是正式签名包；更新需卸载旧版。要正式包得改 `assembleRelease` 并配签名密钥，本次没做（密钥不入库）。
- **图标**：`13-status.md` 记录「CI 里 `@capacitor/assets` 可能被跳过，需确认是否默认图标」。CI 里该步骤是 `continue-on-error: true`，即使失败也继续编译，APK 可能用 Capacitor 默认图标。首次构建后请装到手机确认。
- **README 的下载链接**：写的是 Releases 与 Actions，仓库公开后即可点开；公开前点进去会要求登录，属正常。

## 5. 本次改动文件

| 文件 | 改动 |
|---|---|
| `README.md` | 整体重写为公开门面 |
| `.github/workflows/android.yml` | 加 `permissions.contents: write`；加自动发布 Release 步骤 |
| `docs/27-handover-github.md` | 本文件（新增） |

本次未改动功能代码（`app/src/**`），未改动视觉资产；`npm run build` 已跑通。
