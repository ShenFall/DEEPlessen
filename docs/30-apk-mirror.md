# 30 APK 国内分发（GitHub 下载不通时的替代）

> 2026-11-24 21:45。现象：`github.com/.../releases/download/shenshi-latest/app-debug.apk` 国内下载失败或极慢。

## 为什么慢

Release 资源走 `objects.githubusercontent.com`，国内经常超时。Actions 的 Artifacts 更糟——**必须登录**才能下载。

## 首选方案：Cloudflare Pages 托管 APK

和你正在用的 `deep-portal.pages.dev` 是同一个平台，国内可达、免费、HTTPS。

### 一次性准备

1. 从 Actions 拿到 APK（任选其一）
   - Actions → 最近一次成功运行 → **Artifacts** → `shenshi-debug-apk.zip` → 解压得 `app-debug.apk`
   - 或在能访问的网络上打开 Releases 直接下
2. 打开 `release/apk/`，把 `app-debug.apk` 复制进去
   目录变成：
   ```
   release/apk/
   ├── index.html        ← 已写好，深时风格的下载页
   └── app-debug.apk
   ```
3. Cloudflare → Workers & Pages → **Create application** → Pages → **Upload assets**
   项目名填 `deep-apk`
4. 把 `release/apk` 文件夹整个拖进去 → Deploy

### 得到的地址

```
https://deep-apk.pages.dev/            ← 下载页
https://deep-apk.pages.dev/app-debug.apk  ← 直链，可以发群里
```

### 以后更新

换掉 `app-debug.apk` → 项目里 **Create new deployment** → 拖新的文件夹。**网址不变。**

## 备选方案

| 方案 | 优点 | 缺点 |
|---|---|---|
| **Gitee Release** | 国内快，你已有实名账号 | 单文件上限，需手动上传；公开仓库有审核 |
| 蓝奏云 / 阿里云盘 | 快 | 需要登录、有广告页、链接会变 |
| 对象存储（COS/OSS） | 稳定 | 要备案或收费 |

**建议先做 Cloudflare Pages**：同域、免费、无广告，更新一步到位。

## 长期做法（可选）

让 CI 把 APK 顺便推到 Pages：需要 Cloudflare API Token 作为仓库 Secret，并加一个 `wrangler pages deploy` 步骤。收益是**全自动**，代价是多一份密钥要管。现在手动上传一次约 2 分钟，暂不值得。

## 注意

- Debug 包约 5–8 MB，换新版要**先卸载再装**（签名相同但版本号没变时，覆盖安装可能失败）
- 页面里的「下载 APK」是相对链接，`app-debug.apk` 必须与 `index.html` 同级
