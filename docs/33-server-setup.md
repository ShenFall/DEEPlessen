# 33 服务器与域名上线手册

> 2026-11-25。服务器已备好，等域名实名 + 备案。本文件是那之后照做即可的清单。
>
> **本文件不含真实 IP 与端口**，具体值记在本地 `local/server.md`（已 gitignore，不入库）。

## 1. 现状（2026-11-25 12:20）

| 项目 | 状态 |
|---|---|
| 服务器 | 阿里云轻量应用服务器，杭州，2C2G / 40G，IP `<服务器IP>` |
| 系统 | Alibaba Cloud Linux 3（`dnf`，兼容 CentOS 8） |
| 面板 | 宝塔 9.2.0，端口 **<面板端口>**，自带安全入口，SSL 已关 |
| 内核调优 | BBR + fq、`vm.swappiness=10`、nofile 65535 |
| swap | 2 G（`/www/swap`，已写 fstab） |
| 防火墙 | 控制台「防火墙」放行 22 / 80 / 443 / ICMP / <面板端口> |
| 域名 | `shenfall.cn` 已购，实名审核中；未备案 |
| Nginx | 未安装（等域名） |

## 2. 时间线

```
今天        实名审核中（1-3 工作日）
+3 天       提备案（阿里云 App）
+10~20 天   备案下号
下号后      解析 → 建站 → 证书
```

备案期间照样能用 `http://<服务器IP>` 访问，不影响先把内容放上去。

## 3. 域名分工

| 域名 | 用途 | 根目录 |
|---|---|---|
| `shenfall.cn` / `www` | 个人站（作品、博客、自我介绍） | `/www/wwwroot/personal` |
| `course.shenfall.cn` | 学生门户（资料下载） | `/www/wwwroot/course` |
| `files.shenfall.cn` | 大文件（可选，以后拆） | `/www/wwwroot/files` |

子域名免费、不限数量（免费版 DNS 每域名 10 条记录）。**面板不开子域名。**

## 4. 备案填写模板

实名通过、域名注册满 3 天后，在**阿里云 App** 提交。

| 字段 | 建议填写 | 说明 |
|---|---|---|
| 主体 | 个人，身份证 | 与域名实名信息一致 |
| 网站名称 | `深时` 或 `个人主页` | **不要出现**「学校」「教育」「课程」「资料平台」 |
| 服务内容 | 其他 → 个人主页 / 博客 | 不要选「在线教育」 |
| 备注 | 个人学习记录与技术笔记整理，非经营性，不涉及在线教学、付费与会员 | 一句话说清性质 |
| 服务器 | 选轻量实例，用其备案服务码 | 实例剩余时长需 ≥3 个月 |

**驳回率最高的两处**：网站名称含教育字样、备注为空。

## 5. 解析记录

阿里云 → 云解析 DNS → `shenfall.cn` → 解析设置：

| 记录类型 | 主机记录 | 记录值 | 说明 |
|---|---|---|---|
| A | `@` | `<服务器IP>` | 主域名 |
| A | `www` | `<服务器IP>` | www |
| A | `course` | `<服务器IP>` | 学生门户 |

TTL 用 10 分钟。验证：`ping course.shenfall.cn` 能看到 IP。

## 6. 装 Nginx 并建两个站点

### 6.1 装 Nginx

面板 → 软件商店 → `Nginx` → 极速安装（**不要装 LNMP 一键包**）。

### 6.2 建站点

网站 → 添加站点，两次：

| 站点 | 域名 | 根目录 | PHP |
|---|---|---|---|
| 个人站 | `shenfall.cn` + `www.shenfall.cn` | `/www/wwwroot/personal` | 纯静态 |
| 门户 | `course.shenfall.cn` | `/www/wwwroot/course` | 纯静态 |

建完宝塔会自动生成两个 server 块，靠 `server_name` 分流同一个 80 端口。

### 6.3 门户目录约定

```
/www/wwwroot/course/
├── index.html          ← 打包产物
├── manifest.json
├── brand/
└── files/              ← 大文件放这里，没有 25 MiB 限制
```

上传方式：面板「文件」→ 进目录 → 上传 zip → 解压 → 删 zip。

### 6.4 大文件下载优化（可选）

在站点设置 → 配置文件里追加：

```nginx
# 让 pptx/pdf 直接触发下载，而不是浏览器内打开
location ~* \.(pptx?|docx?|xlsx?|zip)$ {
    add_header Content-Disposition "attachment";
    expires 7d;
}

# 静态资源缓存
location ~* \.(png|jpe?g|webp|svg|css|js)$ {
    expires 30d;
    add_header Cache-Control "public";
}
```

改完 `nginx -t && nginx -s reload`（宝塔里点「重载配置」也行）。

## 7. HTTPS（Let's Encrypt 免费证书）

域名解析生效后，站点设置 → **SSL** → **Let's Encrypt** → 勾选域名 → 申请。

- 有效期 90 天，宝塔会**自动续期**（计划任务里能看到）
- 申请前必须：域名已解析到本机、80 端口可访问
- 申请成功后，站点设置里打开「强制 HTTPS」

> 通配符证书（`*.shenfall.cn`）需要 DNS 验证，宝塔支持，但个人站用「每个子域名各申请一张」更简单。

## 8. 上线验收清单

```bash
# 1. Nginx 配置合法
nginx -t

# 2. 站点响应
curl -I http://shenfall.cn
curl -I http://course.shenfall.cn

# 3. 证书
curl -I https://course.shenfall.cn

# 4. 大文件能下
curl -o /dev/null -w "%{http_code} %{size_download}\n" https://course.shenfall.cn/files/xxx.pptx
```

浏览器再确认三件事：

- 地址栏有小锁（不是“不安全”）
- 输入 `http://` 会自动跳 `https://`
- 手机 4G 打开也正常（不要在校园网内网环境下测）

## 9. 长期维护

| 周期 | 做什么 |
|---|---|
| 每月 | 看一眼面板「监控」：CPU、内存、磁盘、流量包 |
| 每月 | 更新资料后重新打包上传（本地 `打包资料.bat`） |
| 每季 | `dnf update` 打补丁，先打快照 |
| 出问题 | 先看 `/www/wwwlogs/` 下的站点日志与 `error_log` |

## 10. 已知风险与取舍

| 风险 | 现状 | 处理 |
|---|---|---|
| 面板端口暴露公网 | <面板端口> + 安全入口 + 强密码 | 可接受；更严可改 SSH 隧道 |
| 移动网络 IP 会变 | 未做 IP 白名单 | 不做白名单，靠密码 |
| 流量包有限 | 轻量按月给流量 | 大文件放自己服务器比 Cloudflare 省心，但下载量大时留意用量 |
| 备案内容抽查 | 子域名在做资料分发 | 无付费入口、不公开宣传、可加访问口令 |
| 单点故障 | 只有一台机器、一个盘 | 定期下载备份；重要资料本地留一份 |
