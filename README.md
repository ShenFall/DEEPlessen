# 拾课 / DEEP

> ShenFall 的学委工作台：收作业对账、通知拆解、资料取件、个人日程。

**当前状态：设计阶段（v0.2），仓库里只有设计文档，没有代码。**
等讨论收敛到「界面与流程不再改动」再开工。

<img src="assets/avatar-shenfall.jpg" width="120" alt="ShenFall 头像">

---

## 一句话

给一个人的作战台。后台是深夜终端，前台是白天取件柜。

- **学委端**：信息密度高、键盘优先、深空暗色
- **学生端**：不注册、不登录、像取快递一样三步拿到文件

## 目录

| 文件 | 内容 |
|---|---|
| [docs/01-vision.md](docs/01-vision.md) | 定位、用户、五个痛点与四条主线、设计原则、明确不做的事 |
| [docs/02-brand.md](docs/02-brand.md) | 视觉识别：从头像提取的双星体系、色板、字体、图形语言、动效 |
| [docs/03-information-architecture.md](docs/03-information-architecture.md) | 信息架构、路由表、两套前台的边界 |
| [docs/04-data-model.md](docs/04-data-model.md) | 班级/学生/课程/作业/资料的数据模型、花名册导入规范、姓名匹配算法 |
| [docs/05-flows.md](docs/05-flows.md) | 五条核心流程：建档、对账点名、通知拆解、发布资料、换班级 |
| [docs/06-screens.md](docs/06-screens.md) | 界面清单与规格、状态设计、文案表 |
| [docs/07-tech.md](docs/07-tech.md) | 技术选型、存储与成本、隐私边界 |
| [docs/08-roadmap.md](docs/08-roadmap.md) | 分期计划与待决问题（讨论入口） |
| [docs/decisions/](docs/decisions/) | 架构决策记录（ADR），改主意就新开一条，不删旧的 |

## 已定决策

| 编号 | 决策 | 一句话理由 |
|---|---|---|
| [0001](docs/decisions/0001-single-operator.md) | 单人后台 + 公开取件页，不做双角色系统 | 同学不会为了拿一份资料注册账号 |
| [0002](docs/decisions/0002-names-never-disappear.md) | 名字永不消失，只降权；位置恒定位 | 勾一个少一个会重排，手指立刻失去记忆 |
| [0003](docs/decisions/0003-cohort-as-source-of-truth.md) | 花名册是一等公民，班级与课程解耦 | 换班、跨学期、一门课带两个班都要能活 |

## 怎么一起讨论

1. 每个决定落到 `docs/decisions/NNNN-*.md`，编号递增。改主意不删旧文件，新开一条并注明 `Supersedes`。
2. 改界面规格时，连「为什么」一起改，别只改结果。
3. 还没想清楚的问题统一堆在 `docs/08-roadmap.md` 的「待决问题」里，一次讨论一批。
4. 这个仓库可以直接推 GitHub；`.workbuddy/` 已忽略。
