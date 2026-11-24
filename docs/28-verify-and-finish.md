# 28 收尾核验：交接物检查与剩余动作

> 2026-11-24 20:15。上一手写到 `3154168`（README 重写 + CI 发 Release + 27 号交接文档）被限额打断。
> 本页只记三件事：**核验结果、必须人做的操作、公开前的风险点**。

## 1. 核验结果

| 项 | 结果 | 依据 |
|---|---|---|
| 构建 | ✅ 通过 | `npm run build`，19 个预缓存条目，786 KiB |
| README | ✅ 已是新版 | 标题「深时 / DEEP」，含三端表格、下载、快速开始、设计基线；旧的「v0.7 / M0 / 20 条索引」已移除 |
| CI 发 Release | ✅ 已配 | `permissions.contents: write` + `softprops/action-gh-release@v2`，tag `shenshi-latest`，`prerelease: true` |
| 工作区 | ✅ 干净 | 无未提交改动 |
| 本地 vs 远端 | ⚠️ **不一致** | GitHub 网页仍显示旧 README，说明 `3154168` 没推上去 |

> 结论：代码侧已完成，**剩下三件都是网页上的操作**。

## 2. 只剩这三件事（都要你点）

### ① 推送（否则前两项都看不到）

```bash
cd "C:/Users/ShenFall/WorkBuddy/spaces/2026_11_20_23-51-05"
git push origin main
```

推完会自动触发 CI。3 分钟后 `Releases` 页出现 `shenshi-latest`，里面挂着 `app-debug.apk`。

> 若不想等自动触发，可在 Actions →「构建安卓 APK」→ **Run workflow**。

### ② 填仓库简介（现在显示 "No description, website, or topics provided"）

仓库首页右上角 **⚙ About** → 粘贴：

**Description**
```
深时 · 一个人的学委工作台：手机点名、电脑整资料、同学扫码取件。零后端、离线可用。
```

**Website**（可选，填学生门户地址）
```
https://deep-portal.pages.dev
```

**Topics**
```
offline-first  pwa  capacitor  react  vite  education  classroom  chinese
```

### ③ 公开仓库

`Settings` → 拉到最下 `Danger Zone` → **Change repository visibility** → **Make public**。

## 3. 公开前必须确认的两件事

| 检查 | 现状 | 处理 |
|---|---|---|
| 示例名单 `app/src/data/roster.ts` | 30 条：林嘉禾、陈知远、王思睿、李子衿 … | **若这些是真实同学，请先换成假名**；看起来是编排的示例名，但需你确认 |
| 学号格式 | `0108260001` 起，规则化 | 同上，确认非真实学号 |
| 设计素材 | `deep-visual-assets_assets/` 14 张、**17 MB** | 占了仓库一半体积。想瘦身可移到 `docs/images/` 压缩到 2 MB 以内；README 第 54 行有引用，移动后要同步改 |

## 4. 公开后的仓库长相

```
深时 / DEEP                              Public
深时 · 一个人的学委工作台：手机点名、电脑整资料、同学扫码取件
[构建安卓 APK ✓]  ⭐ Star 0  🍴 Fork 0

README 首屏：图标 → 三端表 → 下载 → 快速开始
Releases：shenshi-latest（APK，免登录下载）
```

## 5. 遗留（不影响公开）

- 学生门户线上仍是 11-23 中午版，需重新「导出 → 打包 → 拖 zip」
- 资料全在「未分类」，缺课程命名与批量移动
- 电脑看板在本机无名单时显示 0，缺空态文案
- CI 的 `@capacitor/assets` 步骤被设为 `continue-on-error`，APK 图标可能是 Capacitor 默认

## 6. 我为什么没直接推

本机 `git push` 被 TLS 拦截：

```
schannel: next InitializeSecurityContext failed: CRYPT_E_NO_REVOCATION_CHECK
openssl: unable to get local issuer certificate
```

换过 `http.sslBackend=openssl`、指定 CA 包，均失败；关闭证书校验属于自毁式操作，没做。**推送这一步只能在你本机的终端里完成。**
