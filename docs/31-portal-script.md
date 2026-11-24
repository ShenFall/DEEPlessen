# 31 打包脚本（替代资料管理 UI）

> 2026-11-24 22:30。资料已手工分好类，不再需要资料库界面；改成「放好文件 → 点一下 → 得到 zip → 拖上传」。

## 为什么换

原来的资料页会往数据目录里写东西（`portal/`、`publish/`），把 `I:\DataSystem` 搞乱。脚本改成**只读**资料目录，所有中间产物放系统临时目录，成品只落在桌面。

## 怎么用

双击 `tools/打包资料.bat`（建议发送到桌面快捷方式）。

或者终端：

```bash
node tools/build-portal.mjs
```

## 它做什么

1. 读 `I:\DataSystem`，**每个一级文件夹 = 一个分组**，组内文件 = 条目
2. 跳过 `portal`、`publish`、`node_modules`、`.git`、`Thumbs.db` 等
3. 超过 **25MB** 的文件不打包，末尾列出来
4. 在 `%TEMP%\shenshi-portal\` 拼出门户：`index.html` + `manifest.json` + `files/` + `brand/`
5. 同时产出两样东西（都在桌面）：
   - `深时门户-YYYYMMDD\` **文件夹**，拖它上传最稳
   - `deep-portal-YYYYMMDD.zip` 压缩包，备用
6. 自动打开 Cloudflare 上传页

## 输出示例

```
深时 · 资料打包
─────────────────────────────
资料目录：I:\DataSystem

分组：4 个  ·  文件：45 个
体积：59.7 MB

✅ 已生成：C:\Users\ShenFall\Desktop\deep-portal-20261124.zip

⚠️  3 个文件超过 25MB，未打包：
    Capt 2_矿物NEW.pptx（63.8 MB）
    Capt 3_岩浆作用与岩浆岩 NEW.pptx（89.7 MB）
    Capt 4_外力地质作用与沉积岩NEW.pptx（103.2 MB）
```

## 上传时拖哪个

**优先拖文件夹。** 实测：把 59.7MB 的 zip 拖进 Cloudflare，会被当成"一个超过 25MB 的文件"直接拒收；拖文件夹则按单个文件逐个上传，23.7MB 的课件不会触发限制。

## 依赖

- 需要 Node.js（你机器上已有，WorkBuddy 自带）
- 模板与图标从仓库里读：`app/src/storage/portal.ts`、`app/public/brand/*.png`
- **不装任何依赖包**，zip 是脚本内置的（store 模式，UTF-8 文件名）

## 改资料目录

默认 `I:\DataSystem`。要换的话：

```bash
set SHENSHI_DATA=D:\课程资料
node tools/build-portal.mjs
```

## 超 25MB 的三个 PPT

`地科` 的三份课件（64 / 90 / 103 MB）进不了 Cloudflare。三条路：

| 做法 | 效果 |
|---|---|
| 导出成 PDF | 通常压到 1/5，且手机直接能看，**推荐** |
| 压缩包内图片降质 | 要手工处理 |
| 传网盘，门户里只放链接 | 需要额外维护一份链接表 |

## 以后要做真正的资料管理器吗

如果将来自己租服务器，脚本这套逻辑可以直接搬：目录约定不变、`manifest.json` 结构不变，只把「生成静态 zip」换成「写入数据库 + 上传对象存储」。
