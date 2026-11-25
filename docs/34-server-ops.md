# 34 自托管门户运维手册

> 2026-11-25。学生门户已迁到自有轻量服务器，域名待备案。本文件记录日常怎么维护、出事怎么查、以及一年后怎么搬。

## 1. 现状

| 项目 | 状态 |
|---|---|
| 服务器 | 阿里云轻量应用服务器，2C2G / 40G（真实 IP 记在本地 `local/server.md`） |
| 面板 | 宝塔，端口与安全入口见 `bt 14`，SSL 已关（按需可再开） |
| Web | Nginx，站点根目录 `/www/wwwroot/deep` |
| 访问 | `http://<服务器IP>/`（备案下号后改 `course.<域名>`） |
| 资料 | `files/<课程>/` 原始文件，含 100 MB 级 PPT，未切分 |
| 索引 | `manifest.json`，由 `/root/rebuild.sh` 生成 |
| 域名 | 已购、已实名，等备案 |

## 2. 日常三步

```
① 面板「文件」→ /www/wwwroot/deep/files/<课程>/ → 上传或重命名
② 终端执行 /root/rebuild.sh
③ 浏览器 Ctrl+F5 强刷
```

**任何对 `files/` 的增删改名，都必须跑第 ② 步**，否则页面显示旧名字、点击 404。

只改 `index.html`、CSS 这类文件不需要重建。

### rebuild.sh

放在 `/root/`（不在网站目录，避免公网可下载）：

```bash
#!/bin/bash
set -e
cd /www/wwwroot/deep
python3 - <<'PY'
import json, os, urllib.parse, datetime
courses = []
for g in sorted(os.listdir('files')):
    d = os.path.join('files', g)
    if not os.path.isdir(d): continue
    items = [{'name': n, 'size': os.path.getsize(os.path.join(d, n)),
              'url': 'files/%s/%s' % (urllib.parse.quote(g), urllib.parse.quote(n))}
             for n in sorted(os.listdir(d)) if os.path.isfile(os.path.join(d, n))]
    if items: courses.append({'name': g, 'items': items})
json.dump({'generatedAt': datetime.datetime.utcnow().isoformat() + 'Z',
           'courses': courses}, open('manifest.json', 'w'),
          ensure_ascii=False, indent=2)
print('✅ %d 个分组 / %d 个文件 / %.1f MB' % (
    len(courses), sum(len(c['items']) for c in courses),
    sum(i['size'] for c in courses for i in c['items']) / 1048576))
PY
chown -R www:www /www/wwwroot/deep/files 2>/dev/null || true
```

## 3. 目录约定

```
/www/wwwroot/deep/
├── index.html          学生门户首页（主题切换、搜索、筛选）
├── manifest.json       资料索引，脚本生成，不要手改
├── brand/              头像与线稿底纹
└── files/
    ├── 地科/
    ├── 高数上/
    ├── 通知/
    └── 答案/
```

新建一个课程文件夹后跑一次脚本，页面上就多一个分组。

## 4. 排障对照表

| 现象 | 原因 | 处理 |
|---|---|---|
| 页面还是旧名字 / 下载 404 | manifest 没重建 | `/root/rebuild.sh` + Ctrl+F5 |
| 还是宝塔绿色「站点创建成功」 | 根目录里还有默认 `index.html` | 删掉它 |
| 403 Forbidden | 缺 `index.html`，或文件属主不对 | `chown -R www:www /www/wwwroot/deep` |
| 页面空白、控制台报 404 | 目录多套了一层（`deep/deep/index.html`） | 把内容上移一级 |
| 站点打不开、超时 | 防火墙没放行 80 | 控制台 → 防火墙 |
| 改了文件属主报 `.user.ini` 错误 | 宝塔防篡改锁，正常 | 忽略 |
| 中文文件名下载后变乱码 | 浏览器编码 | 用 Chrome / Edge，别用旧版 IE 内核 |

## 5. 备份

每周一次，存在服务器 + 每月下载一份到本地（**别只留在服务器上**）：

```bash
tar czf /www/backup/deep-$(date +%F).tar.gz -C /www/wwwroot deep
find /www/backup -name "deep-*.tar.gz" -mtime +30 -delete
```

宝塔「计划任务」里加一条 Shell 脚本，每周执行。

## 6. 一年后搬迁预案

服务器只有一年。让搬迁成本趋零的三条已经做了：

| 措施 | 状态 |
|---|---|
| 内容全部在单目录 `/www/wwwroot/deep`，可整包 tar | ✅ |
| 访问入口用域名（DNS 指向哪都行），不用 IP 做长期入口 | ⏳ 等备案 |
| 保留 Cloudflare Pages 作为兜底（`tools/deploy.ps1`） | ✅ |

**搬迁五步**：

```
① 新机装宝塔 + Nginx（20 分钟）
② scp 旧机 deep.tar.gz 到新机并解压到 /www/wwwroot/
③ 面板建站，根目录指 /www/wwwroot/deep
④ 域名 A 记录改新 IP（TTL 设 600 秒，10 分钟生效）
⑤ 旧机保留 3 天做回滚
```

DNS 的 TTL 要提前设成 **600 秒**，否则切换要等几小时。

## 7. 已知限制

| 限制 | 说明 | 缓解 |
|---|---|---|
| 静态索引 | 文件变了要手动重建 manifest | 一条命令，1 秒 |
| 单机单盘 | 机器或磁盘故障即全站不可用 | 每周 tar + 每月下载 |
| 无 HTTPS | 没有域名，只能 http | 备案后上 Let's Encrypt |
| 上传靠浏览器 | 大包易断 | WinSCP 续传，或分批 |
| 个人备案内容限制 | 不宜出现「课程」「教育」等字样 | 站点定位写「学习资料整理」 |
