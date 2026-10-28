# SVG Editor — Lab1

TypeScript 面向对象 SVG 命令行编辑器，支持六种图形、嵌套容器、撤销/重做及 SVG 读写。

需要 Node.js 22+。从工程根目录执行：

```sh
npm ci
npm run cli
```

输入 `help` 查看语法，Ctrl-D 退出。可回放课程流程图：

```sh
npm run cli < examples/flowchart.commands
```

生成的 `examples/flowchart.svg` 可用浏览器打开。

```sh
npm run check
npm test
npm run build
node dist/main.js
```

课程提交文档：[doc/README.md](doc/README.md)，包含架构图、Command/Composite 设计、AI 协作过程、依赖自查、19 项测试的验证依据及已知限制。

本阶段不实现 box 和插件系统；导入不支持的 SVG 特性会明确报错。最终提交版本由 `final` 标签标记。
