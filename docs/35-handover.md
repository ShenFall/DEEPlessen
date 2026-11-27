# 35 交接文档（换账号后用这一页）

> 2026-11-27。仓库与工作区不变，只是换了账号继续。**新会话先读这一页，读完就能接手。**
> 更细的专题在 33（域名上线）、34（服务器运维）。

## 0. 一句话现状

学生门户已从 Cloudflare Pages 迁到**用户自己的阿里云轻量服务器**，用 IP 访问、**51 个文件**（约 392 MB）全量在线；Android App 走 GitHub Actions 出包；域名已购已实名，**等备案（待提交）**；个人站占位页已备好（`personal/`，见 36 号）。

## 1. 这个项目是什么

「深时」= 一个人的学委工具，刻意做成**两条产品线**而不是一个大看板：

| 线 | 形态 | 做什么 | 代码 |
|---|---|---|---|
| 手机 | 安卓 APK（Capacitor） | 待办、点名（Excel 名单导入）、纸白/深夜双主题 | `app/`，`--mode mobile` |
| 电脑 | 浏览器 | **只做资料管理**（已停用，改为脚本） | `app/`，`--mode desk` |
| 学生 | 静态网页 | 搜索（子串/跳字/拼音首字母）、类型筛选、下载 | `app/src/storage/portal.ts` 里的 `PORTAL_HTML` |

**关键决策（不要重新讨论）**：

1. 不做后端、不引入账号。数据在各端本地（IndexedDB + 磁盘目录）。
2. 手机端与电脑端用 `VITE_PLATFORM`/`--mode` 分开构建，**不开 Git 分支**。
3. 资料管理 UI 停用，改成「脚本打包 + 手动上传」，因为 UI 会往资料目录写文件。
4. 学生端是**静态 HTML + manifest.json**，文件变了要重建索引（见 §4）。
5. 服务器上**不切分 PPT**（无 25 MiB 限制），压缩降为可选优化。

## 2. 目录地图

```
app/                     前端（React + Vite + Capacitor）
  src/storage/portal.ts  学生门户的唯一模板（改这里 → 重新打包才生效）
  src/features/*         看板、待办、资料库、对账
tools/
  build-portal.mjs       生成门户包（读 I:\DataSystem，产物落桌面）
  make-manifest.mjs/.py  扫描 files/ 重建 manifest.json（服务器用 py 版）
  deploy.ps1             部署到 Cloudflare Pages（wrangler 增量）
  split-pptx.ps1         PPT 按页段切分（已退役，留着备用）
  打包资料.bat / 部署.bat 双击即用
docs/                    01~34 编号文档，35 是本页
  ../../13-status.md     每日进度（每次收工更新）
release/apk/             APK 落地页（部署到 deep-apk 项目）
personal/              **个人站（shenfall.cn 用）**：单文件静态页 + 404 + favicon，见 36 号
local/                   **本机实况：IP、端口、账号（已 gitignore，不入库）**
tools/.cf-token          Cloudflare API Token（已忽略）
tools/.cf-account        Cloudflare 账户 ID（已忽略）
```

## 3. 服务器

| 项 | 值 |
|---|---|
| 类型 | 阿里云**轻量应用服务器**（不是 ECS，防火墙在实例详情「防火墙」页，没有安全组概念） |
| 规格 | 2C2G / 40G，Alibaba Cloud Linux 3（`dnf`） |
| 面板 | 宝塔 9.2.0，端口与安全入口见 `sudo bt 14`（真实值在 `local/server.md`） |
| Web | Nginx，站点根目录 `/www/wwwroot/deep` |
| 访问 | `http://<服务器IP>/`（备案后改 `course.<域名>`） |
| 索引脚本 | `/root/rebuild.sh` |
| 调优 | BBR+fq、`vm.swappiness=10`、swap 2G（fstab 已登记）、nofile 65535 |
| 面板 SSL | 已关（宝塔会弹「请开启面板SSL」，可忽略或重开） |

**登录方式**：阿里云控制台 → 轻量实例 → 「远程连接」进终端（用户平时用无影云桌面 + ssh，两者都行）。

## 4. 日常三件事

```bash
# ① 改了 files/ 里的东西（增删改名）后，必须重建索引
/root/rebuild.sh

# ② 新增课程 = 在 files/ 下建目录，再跑 ①

# ③ 备份（建议加进宝塔计划任务，每周）
tar czf /www/backup/deep-$(date +%F).tar.gz -C /www/wwwroot deep
```

**不重建索引的后果**：页面显示旧文件名、点击 404。

## 5. 本机侧（Windows）常用命令

```bash
# 生成门户包（默认排除大目录；SHENSHI_FLAT=1 用原始中文目录名）
cd tools && SHENSHI_FLAT=1 node build-portal.mjs
# 产物：桌面 deep-portal-site-YYYYMMDD/ 与 .zip

# 部署到 Cloudflare（备用路线，需要 tools/.cf-token）
tools\部署.bat

# 前端开发
cd app && npm run dev:mobile   # 5178
cd app && npm run dev:desk     # 5179
npm run build:mobile           # 输出 dist/（给 Capacitor）
```

## 6. 凭据在哪（不要写进文档，也不要提交）

| 凭据 | 位置 | 怎么拿 |
|---|---|---|
| 服务器 IP / 面板端口 | `local/server.md` | 直接看 |
| 服务器 SSH 密码 | 用户自己记 | 问用户 |
| 宝塔账号密码 / 安全入口 | 服务器上 `sudo bt 14` | 用户执行 |
| Cloudflare Token | `tools/.cf-token` | 本机文件 |
| Cloudflare 账户 ID | `tools/.cf-account` | 本机文件 |

**脱敏规则（重要）**：仓库是**公开**的。所有文档用 `<服务器IP>`、`<面板端口>` 占位；真实值只写 `local/`。禁止把 token、密码、内网地址写进 `docs/` 或提交。

## 7. 已完成 / 待办

### 已完成

- 手机端：待办、点名、名单导入、纸白/深夜主题、APK 云端构建（`.github/workflows/android.yml`）
- 学生端：门户模板、搜索、类型筛选、主题切换、**搜索时自动收起首屏留白**（`ba852fb`）
- 服务器：系统调优、Nginx、站点上线；索引 2026-11-27 重建后为 **51 个文件 / 391.5 MB**（地科 9 / 高数上 38 / 通知 3 / 答案 1）
- 工具链：打包、清单重建、Cloudflare 部署、PPT 切分（备用）
- 仓库：README 重写为双线结构、APK 下载页（`deep-apk-dv6.pages.dev`）
- 个人站：占位页做完并本地验收（纸白/深夜、404、favicon），部署步骤见 36 号
- APK 图标：11-25 那次构建的「生成应用图标与启动图」步骤是 success，**已不是 Capacitor 默认图标**

### 待办（按顺序）

1. **提交备案**：域名已实名且满 3 天，在阿里云 App 提交（网站名别带教育字样，备注别空）
2. 备案下号当天：主域名上个人站（照 36 号，**先换页脚备案号**）、`course` 子域名指到 `/www/wwwroot/deep`、两个站各上 Let's Encrypt + 强制 HTTPS
3. APK 图标小尺寸可读性：现用满幅线稿人脸（`app/resources/icon.png`），48px 下发灰；候选 `assets/icon-concepts/d-eye-light.png`（圆环 + 金「深」）
4. 确认门户文件数从 62 降到 51 是有意合并（地科 20 → 9）
5. 电脑端资料库空态、课程命名批量移动（低优先，UI 已停用）

## 8. 踩过的坑（别重复踩）

| 坑 | 症状 | 解法 |
|---|---|---|
| `sticky` + 改高度 | 滚动抽搐回弹 | 改 `fixed` |
| 正则改 CSS 漏花括号 | 后面规则全被吞，页面变裸 HTML | 改完 `{` `}` 计数 |
| Windows npm 脚本 `VAR=x cmd` | 报「不是内部或外部命令」 | 用 `vite --mode xxx` |
| PowerShell 5.1 读 UTF-8 无 BOM | 中文乱码、语法报错 | 存成 `utf-8-sig` |
| 宝塔 `chown .user.ini` | `Operation not permitted` | 正常，宝塔防篡改锁 |
| Cloudflare 网页拖拽上传 | 全部「未知」失败 | 改用 `wrangler pages deploy`（增量） |
| 本机 `git push` | TLS 拦截 `CRYPT_E_NO_REVOCATION_CHECK` | 只能用户本机推；不要关校验证书 |
| 门户改文件后 | 名字没变、下载 404 | `/root/rebuild.sh` |

## 9. 新会话开场怎么说

直接粘贴给新会话：

> 先读 `docs/35-handover.md` 和 `docs/13-status.md`，然后继续。工作区还是这个，仓库是公开的，脱敏规则按 35 号文档执行。

## 10. 一分钟自检（接手先跑）

```bash
cd /path/to/workspace
git log --oneline | head -5      # 看最近改动
git status --short               # 有没有未提交
cat docs/13-status.md | head -40 # 看进度
cat local/server.md              # 看服务器实况（本机才有）
```
