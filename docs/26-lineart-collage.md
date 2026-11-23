# 26 线稿拼贴：设计方式记录（待用于桌面端）

> 2026-11-23。学生端已上线这套做法，桌面端**本轮不做**，先记下参数与坑，避免下次重新试错。

## 1. 设计意图

不是"放一张背景图"，而是把插画当成**构成主义海报的印刷块**：

- 画面被**斜切**成不完整的一块，故意切掉主体的一部分（不追求看全）
- 两块碎片：右下主块（大、清晰）、左下反向块（小、更淡）
- 加两根竖直细线，模拟海报的分栏标尺
- 整体压在纸白底上，靠 `multiply` 让白色消失、只留线条

关键词：`裁切 / 斜切 / 碎片 / 印刷感 / 低对比`。

## 2. 技术实现（可直接复用）

```css
.art  { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none }
.frag { position: absolute; mix-blend-mode: multiply; will-change: transform }

.frag--a {
  right: -5%; top: -14%; height: 120vh; opacity: .15;
  clip-path: polygon(26% 0, 100% 0, 100% 100%, 0 100%);   /* 左侧斜切 */
}

.frag--b {
  left: -14%; bottom: -18%; height: 64vh; opacity: .09;
  transform: rotate(180deg);
  clip-path: polygon(0 0, 100% 0, 74% 100%, 0 100%);       /* 右下斜切 */
}

.rule { position: absolute; top: 0; width: 1px;
  background: linear-gradient(var(--line), transparent) }
.rule--a { right: 24%; height: 42vh }
.rule--b { right: calc(24% + 8px); height: 26vh; opacity: .6 }
```

要点：

| 项 | 值 | 说明 |
|---|---|---|
| 定位 | `fixed` | 不参与文档流，滚动时画面不动，内容滑过 |
| 混合 | `multiply` | 白底自动消失，不需要抠图 |
| 透明度 | 主块 .15 / 次块 .09 | 再高就会抢文字 |
| 高度 | 120vh / 64vh | 超出视口，天然被裁 |
| 层级 | `z-index: 0`，内容 `z-index: 1` | 卡片白色不透明，自然遮挡 |

## 3. 素材处理（`sharp`）

原图是彩色厚涂插画，必须转成纯线条：

```js
sharp(src)
  .extract({ left: 0, top: 84, width: 400, height: 636 }) // 先裁掉顶部水印文字
  .resize({ width: 900 })                                 // 900 宽；520 会糊
  .grayscale()
  .linear(0.62, 52)                                      // 提亮，弱化灰面
  .threshold(232)                                        // 只留最深的线
  .png({ compressionLevel: 9, palette: true, colours: 2 })
```

结果：**900×1431，41 KB，2 色**。

## 4. 桌面端怎么用（待做）

桌面端（`app/` 看板）不要整页铺，会与数据密度打架。建议三处：

| 位置 | 做法 |
|---|---|
| 看板页头右侧 | 夹一块 40vh 高的斜切碎片，透明度 .10，横向裁切更狠（`polygon(60% 0, 100% 0, 100% 100%, 30% 100%)`） |
| 空态（无待办/无清点） | 居中淡线稿 + 一句文案，替代空白 |
| 加载态 | 线稿做遮罩，配合 Orbit Plotter 动画 |

**不要**用在：对账台（高密度操作区）、资料列表（会干扰扫读）、弹层。

## 5. 三个坑（都踩过）

1. **边缘检测救不了厚涂**
   用 `convolve` 拉普拉斯提取轮廓，彩色插画会碎成短片。正确做法是**灰度 + 提亮 + 阈值**，保留线条的连续性。

2. **`sticky` + 改高度 = 抽搐**
   顶栏用 `sticky` 并动画 `min-height`，收缩瞬间文档变短，`scrollY` 被夹回阈值以下，反复触发。改成 `fixed` + `top` / `transform` 过渡即可。

3. **正则改 CSS 会静默毁样式**
   删一段规则时留下未闭合的 `@media`，后续规则全被吞掉，页面变成裸 HTML。改模板后必须校验：`{` 与 `}` 数量相等、关键选择器仍在。

## 6. 验收标准

- 内容卡片处明显更实、留白处能看见线稿
- 文字区域无第二层线条干扰（对比度不下降）
- 首屏体积增量 ≤ 50 KB
- 手机 402px 下碎片不压在文字上
- `prefers-reduced-motion` 下不新增动效（本方案本身无动画）

## 7. 状态

- 学生端：已上线（`portal/brand/lines.png`）
- 桌面端：**未做**，等看板改版时一起接
