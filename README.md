# 高级软件开发技术 Lab1：SVG 编辑器（CLI）

使用 TypeScript 实现的面向对象 SVG 命令行编辑器。通过 Command 模式组织编辑与撤销重做，通过 Composite 统一操作图形与嵌套容器。

**实验报告：[doc/README.md](doc/README.md)**，包含架构方案、PlantUML 模块依赖图、AI 协作过程、一致性自查及质量保证。

## 功能范围

- 六种内置图形：`rect`、`circle`、`ellipse`、`line`、`text`、`g`。
- 文档新建与 SVG 读写、画布尺寸设置。
- 图形创建、删除、移动、缩放、属性修改、分组、解组、归属与层叠顺序调整。
- 结构树和属性显示、命令帮助、撤销与重做。
- 统一错误反馈；失败命令不改变文档与编辑历史。

`box` 和插件系统属于后续阶段。SVG 导入支持范围及实现限制见实验报告第 1.6 节与第 4.3 节。

## 运行方式

环境要求：Node.js 22 或更高版本。

```sh
git clone https://github.com/LetSets/svg-editor-lab1.git
cd svg-editor-lab1
npm ci
npm run cli
```

交互提示符为 `svg>`，输入 `help` 查看命令语法，Ctrl-D 退出。

回放课程两节点流程图：

```sh
npm run cli < examples/flowchart.commands
```

输出文件：[examples/flowchart.svg](examples/flowchart.svg)，可在浏览器中打开。

## 验证

```sh
npm run check
npm test
npm run build
```

已通过 19 项自动化测试，覆盖领域模型、撤销重做、SVG 读写及 CLI 端到端流程。GitHub Actions 在 Node.js 22 和 24 上执行类型检查、测试和构建。

编译后可通过 `node dist/main.js` 启动。

## 项目结构

| 路径 | 内容 |
| --- | --- |
| `src/domain/` | 图形模型、容器、文档和图形工厂 |
| `src/commands/` | 编辑命令与撤销快照 |
| `src/application/` | 文档会话和历史管理 |
| `src/ports/`、`src/infrastructure/` | 存储接口、SVG 转换与文件读写 |
| `src/cli/` | 命令解析、分发与终端交互 |
| `tests/` | 自动化测试 |
| `examples/` | 课程命令脚本与 SVG 示例 |
| `doc/` | 实验报告和架构图 |

## 版本记录

开发过程按工程骨架、领域模型、命令历史、SVG 读写、CLI、测试和文档分阶段提交并推送，详见 [提交历史](https://github.com/LetSets/svg-editor-lab1/commits/main/)。

代码验收版本：[final](https://github.com/LetSets/svg-editor-lab1/tree/final)（`e188be3`）。面向评阅的文档修订保存在 `main` 分支。
