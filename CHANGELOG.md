# Changelog

All notable changes to the "Orochi Zen" Japanese Snake Game will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [1.1.0] - 2026-09-08

### Fixed
- **按键长按死循环自旋冲突修复**: 彻底消除 `keydown` 设置绝对四向角与 `requestAnimationFrame` 游戏循环持续触发 `steerByDelta` 造成的剧烈自旋冲突，恢复经典俐落转向体验。
- **180° 反向防回头锁死保护**: 增加几何余弦判定保护机制（`thresholdCos = -0.7`），杜绝蛇头向后咬向颈脖自噬。
- **边界角度规范化修复**: 修复 `normalizeAngle` 在 `-PI` 边界下的模数翻转问题。

### Added
- **四向/舵向双操控模式架构 (Dual Control Architecture)**:
  - 经典四向模式 (`cardinal`)：WASD / 方向键俐落转向，支持极速双键转向缓冲队列 (`turnQueue`)，防丢键与自噬；
  - 游弋舵向模式 (`analog`)：360° 流畅平滑游弋，A/D 或左右键微操偏转，帧率无关物理角速度计算。
  - 顶栏 HUD 新增操控模式即时切换开关与状态指示。
- **全屏轻扫与虚拟罗盘触控升级**:
  - 画布原生支持移动端单指轻扫 (Canvas Swipe) 转向手势，支持连续滑动转弯；
  - 触控罗盘新增四向刻度标记与十字吸附提示，阻止触摸事件穿透冲突。
- **完整自动化物理单元测试套件**:
  - 引入 Vitest 自动化单元测试框架，覆盖角度正规化、反向锁死、转向队列缓冲、模式隔离与四向吸附判定。
- **高精视觉截图呈现**:
  - 仓库内嵌入多终端全景高精截图，并在 README 中视觉呈现。

## [1.0.0] - 2026-09-08

### Added
- **和风视觉渲染管线 (Sumi-e Canvas Engine)**:
  - 亚像素骨骼动力学 (Verlet Integration) 与样条曲线拟合白蛇神躯干，支持笔刷浓淡收尾与正弦游弋摆动；
  - 动态和风枯山水沙纹涟漪与八重樱花瓣飘落粒子系统；
  - 勾玉 (Magatama)、金鲤神魂 (Golden Koi) 与桜之雫 (Sakura Dew) 动态悬浮与发光渲染。
- **纯代码 Web Audio 合成音效引擎 (JapaneseSynthEngine)**:
  - 拍子木 (Hyoshigi) 双脉冲木板击鸣；
  - 和筝 (Koto) 平调子五声音阶（Hirajoshi）连击音阶上升拨弦；
  - 水琴窟 (Suikinkutsu) 清润水钟共鸣音；
  - 尺八 (Shakuhachi) 气息颤动与泛音（刹那缓时专用）；
  - 太鼓 (Taiko) 80Hz 指数衰减低频撞击感。
- **双重意境游戏玩法**:
  - 禅境模式 (Zen Flow)：无界循环、修身养息；
  - 修罗试练模式 (Bushido Trial)：朱红鸟居神域受限、庭石障碍四伏。
- **全平台交互响应式设计**:
  - 电脑键盘 WASD / 方向键转向与无极平滑偏角微调；
  - 移动端 / iPad 专属和风半透明虚拟触控罗盘；
  - 纯 SVG 矢量交互图标（禁用任何非专业 Emoji）；
  - 和风禅诗轮播提示与开局启封界面。
- **项目基础设施**:
  - 固定非冲突端口 `9438` 配置；
  - 完整 TypeScript 类型契约 (`src/engine/types.ts`)；
  - 自动化构建通过，静态预渲染验证通过。
