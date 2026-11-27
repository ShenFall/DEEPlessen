# 36 个人站（shenfall.cn）

> 2026-11-27。给备案准备的一页静态站，源码在 `personal/`。
> **备案下号当天上传即可用**，目标是把「主域名必须能打开」这件事提前做完。

## 1. 为什么先做这一页

备案下号当天主域名要能访问；抽查看的是**内容与备案主体是否一致**。这一页定位为**个人主页**：自述、在做的事、几条记录。不提供下载、不挂付费入口、不出现教育类字样。

## 2. 内容红线（比技术更重要）

| 不要 | 原因 |
|---|---|
| 「课程」「教育」「学校」「学生」「老师」「资料平台」 | 个人备案最容易被驳回的字样（33 号 §4） |
| 指向 `course` 子域名的链接 | 主域名保持纯个人页，资料分发不在这一页露出 |
| 付费、会员、打赏、广告 | 非经营性，一句话写在页脚 |
| 第三方统计、外部字体、CDN | 拖慢首屏，也多一类合规与隐私问题 |
| 真实姓名、学号、宿舍、课表 | 仓库公开、站点公开 |

页面里只出现 handle（`ShenFall`）、GitHub 链接，以及自用工具名「深时」。

## 3. 文件

```
personal/
├── index.html      单文件：样式与脚本全部内联，零外部请求
├── 404.html        独立 404（自带深浅色）
├── favicon.svg     深色圆环 + 金点
└── robots.txt      允许抓取
```

改配色只动 `index.html` 顶部 `:root` 与 `[data-theme="dark"]` 两组变量。默认纸白，右上角可切深夜，选择存 `localStorage`（与门户一致）。

## 4. 备案下号当天：部署（约 15 分钟）

**第 0 步别忘**：把页脚 `ICP 备案号待补充` 换成真实备案号。`index.html` 里那行上方有注释给出成句示例，记得链到 `https://beian.miit.gov.cn/`。

```bash
# 1. 解析：@ 和 www 都指向 <服务器IP>，TTL 600（见 33 号 §5）
# 2. 面板 → 网站 → 添加站点
#    shenfall.cn + www.shenfall.cn
#    根目录 /www/wwwroot/personal
#    纯静态，不建数据库、不选 PHP
# 3. 面板「文件」进根目录 → 上传 zip → 解压 → 删 zip
#    确认根目录下直接是 index.html，而不是 personal/index.html
# 4. 站点设置 → SSL → Let's Encrypt → 勾两个域名 → 申请 → 开「强制 HTTPS」
# 5. 验收
curl -I http://shenfall.cn            # 301 到 https
curl -I https://shenfall.cn           # 200
curl -s https://shenfall.cn | head -5 # 能看到 <title>
```

最后用手机 4G 打开一次（不要在校园网/内网里测），确认地址栏有小锁。

## 5. 以后怎么改

- 只改 `personal/index.html`，改完直接覆盖服务器上的同名文件。**不需要**重建 manifest——那是 `course` 门户的事。
- 三块内容：`在做`（三件东西）、`记`（时间线，新的放上面）、`关于`（自述与技术栈）。
- 时间线宁缺毋滥，一季度补一条就够。
- 本地预览：双击 `index.html`；或 `python -m http.server 8080 -d personal`。

## 6. 自定义 404（可选）

站点设置 → 配置文件，在 `server` 块内加：

```nginx
error_page 404 /404.html;
location = /404.html { internal; }
```

改完 `nginx -t && nginx -s reload`（面板里点「重载配置」也行）。

## 7. 已知取舍

| 项 | 说明 |
|---|---|
| 单文件内联 | 首屏一个请求，代价是改样式要动 HTML；页面小，值 |
| 系统字体 | 不引外部字体；Windows 与安卓都是系统黑体，层级靠字号和字距 |
| 页面无统计 | 不知道访问量；个人站不需要，也少一类合规问题 |
| 深浅色 | 默认纸白，手动切换并记忆；不跟随系统，避免首屏跳色 |

## 8. 与门户的分工（有一处不一致，部署时注意）

| 站点 | 内容 | 根目录 |
|---|---|---|
| `shenfall.cn` | 个人主页（本页） | `/www/wwwroot/personal` |
| `course.shenfall.cn` | 资料索引（见 34 号） | 现状 `/www/wwwroot/deep` |

33 号规划里门户根目录写的是 `/www/wwwroot/course`，实际部署在 `/www/wwwroot/deep`。**下号建站时以现状为准**：给门户建站时根目录直接指 `/www/wwwroot/deep`，只改域名指向，别搬 400 MB 文件。
