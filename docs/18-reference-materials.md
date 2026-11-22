# 18 参考素材库说明

> 2026-11-22。为 DEEP-001～004 收集的视觉参考，集中归档在 [`assets/reference/`](../assets/reference/)，并打包一份 [`assets/reference-materials.zip`](../assets/reference-materials.zip) 便于整体取用。
> 本页只写「这些图是什么、怎么用」；生成登记仍看 [16-assets-generation.md](16-assets-generation.md)。

## 怎么用这批素材

这批图是**风格与纹理参考**，不是可直接贴进界面的成品，也不是生成时的「必须保真参考图」（DEEP-003 的真实头像、DEEP-004 的轨道截图才是硬约束参考）。用途分三类：

1. **定气质** — 精密点阵、细线稿、天文几何、黑底金线的组合，是「双星驾驶舱」想要的高级感来源。
2. **给 DEEP-004 轨道背景找线稿语言** — 虚线圆、同心环、轴线、连续轨迹的画法。
3. **给 DEEP-003 个人空间找装饰元素** — 金色星相符号、月相、细圆环，作为纸白页上的轻装饰。

⚠️ 生成时**不要把整张参考图复刻进画面**，只提取线条语言、色彩关系和留白节奏。图上的英文标题、水印、素材站字样一律不要出现在产物里。

> **2026-11-22 23:05 修订**：信息架构以 [`19-ui-execution-brief.md`](19-ui-execution-brief.md) 为准，本页只管风格。两点新边界：
>
> 1. `ref-01` 的精密点阵与网格只用于页头背景、加载器、空态和分隔细节，**不能据此在首页铺满图表、曲线、进度条或统计卡**；首页已删除热度 / 健康分 / 下载趋势。
> 2. `assets/generated/images/DEEP-001-dashboard-desktop.png` 降级为「视觉壳参考」，其中的英文占位标签与灰线假文字不属于本项目信息架构，不得被派生稿继承。
>
> `ref-02 / 03 / 04 / 05` 的魔法阵、图腾、捕梦网、占星符号只取「同心圆、细金线、少量星点、放射线」这四种抽象语言；不要做成神秘学、塔罗或游戏准星风。`ref-06` 的多彩靶心同理，只取轨道构图，不取紫 / 绿 / 霓虹配色。

## 素材清单

| 文件 | 尺寸 | 内容 | 主要用途 |
|---|---|---|---|
| `ref-01-precision-dataviz.jpg` | 900×1858 | 黑白精密数据可视化海报合集：密集点阵、网格、透视曲面、粒子流、等宽小字排版，标题多为 "DEEP STRUCTURED LEARNING / QUANTUM COMPUTING" | **DEEP-001/002 桌面与手机看板**的精密仪器感、点阵网格、信息密度参考 |
| `ref-02-mandala-lineart.png` | 658×991 | 6 个黑白对称魔法阵 / 曼陀罗线稿：同心圆、几何嵌套、符号环 | **DEEP-004 轨道背景**的同心圆与几何嵌套画法参考 |
| `ref-03-tribal-gold-geometry.png` | 750×792 | 黑底金色部落几何符号：日芒、月相、三角、生命花、同心环 | **DEEP-004 深色轨道背景**的金线语言；**DEEP-003** 金色细节 |
| `ref-04-gold-totem.png` | 750×439 | 黑底金色捕梦网 / 太阳图腾线稿：放射线、垂饰、对称结构 | **DEEP-004 深色版**的放射与垂饰线稿；注意别做成"塔罗/神秘学"过头 |
| `ref-05-gold-celestial-set.jpg` | 296×1920 | 金色星相素材长图：月相、行星纹理、星座连线、星框、星轨、流星 | **DEEP-003 个人资料空间**的金色轻装饰、**DEEP-004** 星轨元素 |
| `ref-06-orbit-backgrounds.jpg` | 251×1920 | 深空背景 + 彩色同心圆轨道靶心合集，多配色（含蓝、金、紫） | **DEEP-004 双星轨道背景**的核心参考：靶心环、轴向、深空底 |
| `ref-07-v2-content-dense.jpg` | 1920×1200 | DEEP-001 v2 行动中心：五类真实内容、中文条目密集、文字按钮 | **内容基准**：v3 重绘时保留五类行动内容与蓝金配色 |
| `ref-08-v1-sparse-icons.jpg` | 1920×1200 | DEEP-001 第一版：大留白、细线图标、低信息密度（含被禁的巨大 DEEP 与灰线假文字） | **气质基准**：只取简洁、图标按钮、呼吸感；禁项不照搬 |
| `ref-09-hero-orbit-simple.jpg` | 1920×1200 | 用户再次指定的贴近参考：大幅轨道线稿 Hero 卡、虚线圆 + 轨迹 + 金卫星点、极低文字密度 | **首屏构图基准**：v4 的 Hero 主卡由此而来；巨大 DEEP 与灰线占位不照搬 |

## 补充参考方向（自行检索）

除你给的 6 张，我另外找了几个方向，供后续细化风格时取用：

| 方向 | 来源 | 可借鉴点 |
|---|---|---|
| 轨道几何复古海报 | [PromptsZone · Orbital Geometry](https://promptszone.com/image/mysterious-retro-poster-orbital-geometry) | 深炭底 + 暖金几何线、蓝图式分面、细技术文字块——和 DEEP 的蓝金纪律很贴 |
| 极简行星轨道海报 | [Displate · Planetary Orbit](https://displate.com/displate/10965419) | 深海军蓝底上的同心环 + 小行星点，干净对称、克制 |
| 开普勒《世界的和谐》视觉语言 | [Curio Design · Kepler Harmonices Mundi](https://designbycurio.com/learn/kepler-harmonices-mundi-1619) | 赭金线稿当作"证据"而非装饰；几何作为论证、大留白、对称、不发光——与"精确视觉"高度契合 |
| Op-Art 同心线场 | [OpenPromptLib · Concentric Line Vortex](https://openpromptlib.com/prompt/hypnotic-black-line-vortex-makes-your-subject-puls-mn2_isj6) | 只取"连续同心线场"的纪律感，**不要**照搬黑白强对比的眩晕效果 |
| Bento 网格 / 深色高级感 | [CherryPick · UI/UX Trends 2025](https://store.cherrypick.studio/blog/ui-ux-trends-2025)、[LinkedIn · UI Trends 2025](https://www.linkedin.com/pulse/top-7-ui-design-trends-shaping-2025-hassam-shabbir-zhbhf) | 一卡一意、深色从底层设计、克制动效、radical simplification——与 17 号文档判断一致 |

> 检索结论：2025 的 bento + dark mode + 克制微交互是主流，DEEP 的方向与趋势一致；差异点在于「双星轨道 + 赭金精密线稿 + 中文等宽」这套自有语言，不要被通用 SaaS 模板感带跑。

## 与 DEEP 需求的对应

- **DEEP-001 / 002（看板）**：主要看 `ref-01` 的精密点阵与网格，气质参考 `ref-06` 的深空底。审美基准以已定稿的锚点图为准。
- **DEEP-003（个人空间）**：`ref-05` 的金色星相、`ref-03` 的金线细节，纸白底上做轻装饰，不要堆满。
- **DEEP-004（双星轨道背景）**：`ref-06` + 用户原始轨道截图为主参考，`ref-02/03/04` 提供同心圆与放射线稿语言。深色版偏 `ref-03/04`，浅色版走细线低对比。
