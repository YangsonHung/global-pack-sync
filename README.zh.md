# global-pack-sync

🚀 Node.js 全局 npm 包迁移工具 - 轻松在不同 Node.js 版本间迁移全局安装的包

[![npm version](https://badge.fury.io/js/global-pack-sync.svg)](https://www.npmjs.com/package/global-pack-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 问题背景

在 Node.js 开发中，我们经常遇到这样的痛点：

- 🔄 Node.js 版本更新频繁，需要切换版本测试项目兼容性
- 📦 全局安装的 npm 包在切换 Node.js 版本后需要重新安装
- ⏰ 手动记住和重新安装几十个全局包既费时又容易遗漏
- 🔧 不同包管理器（npm/yarn/pnpm）的包无法便捷迁移

**global-pack-sync** 就是为了解决这个问题而生！

## 特性

✨ **智能版本管理**

- 🆕 默认安装最新版本，避免安全漏洞
- 🔒 支持锁定到保存时的确切版本
- 📊 版本变更可视化展示

⚡ **高性能安装**

- 🚀 并行安装，大幅提升迁移速度
- 🎯 智能跳过已安装的包
- 🔄 失败包自动生成重试脚本

🛠 **多包管理器支持**

- 📦 npm、yarn、pnpm 全支持
- 🔍 自动检测当前使用的包管理器
- 🔧 灵活指定包管理器

🎨 **用户体验优化**

- 🌈 彩色终端输出，清晰易读
- 📋 详细的进度和状态反馈
- 🔍 交互式选择性恢复
- 📊 配置差异对比功能

🛡 **安全稳定**

- 🔒 进程锁防止并发冲突
- 🚫 自动过滤系统包和工具本身
- 💾 配置文件自动备份

## 安装

```bash
# 全局安装
npm install -g global-pack-sync

# 或使用 yarn
yarn global add global-pack-sync

# 或使用 pnpm
pnpm add -g global-pack-sync
```

## 快速开始

### 基本工作流程

```bash
# 1. 在当前 Node.js 版本保存全局包配置
global-pack-sync save

# 2. 切换到新的 Node.js 版本
nvm use 18.0.0  # 或 n 18.0.0

# 3. 恢复全局包到新环境（默认安装最新版本）
global-pack-sync restore
```

就是这么简单！🎉

## 命令详解

### 📥 保存配置

```bash
# 保存当前环境的全局包列表
global-pack-sync save

# 保存到指定配置名称
global-pack-sync save my-project-packages

# 保存时会显示详细信息
✓ 已保存配置文件 "node-v18.17.0-1693123456789"
  Node 版本: v18.17.0
  npm 版本: 9.6.7
  包管理器: npm
  包数量: 15
  保存位置: ~/.global-pack-sync/packages.json
```

### 📤 恢复配置

```bash
# 恢复最新保存的配置（使用最新版本）
global-pack-sync restore

# 恢复指定配置
global-pack-sync restore my-project-packages

# 使用保存时的确切版本
global-pack-sync restore --exact-version

# 指定包管理器和并发数
global-pack-sync restore --pm yarn --concurrency 5
```

### 🎯 选择性恢复

如果只想恢复部分工具，可以使用交互式选择：

```bash
global-pack-sync select

# 示例交互：
选择要恢复的包 (配置: node-v18.17.0-1693123456789):

包列表:
  1. @vue/cli@5.0.8
  2. create-react-app@5.0.1
  3. typescript@5.2.2
  4. nodemon@3.0.1
  5. pm2@5.3.0

输入要跳过的包序号 (用空格分隔，直接回车安装全部):
2 4    # 跳过 create-react-app 和 nodemon

将安装 3 个包
```

也可以直接查看保存的配置文件，了解具体内容：

```json
{
  "my-project-packages": {
    "nodeVersion": "v18.17.0",
    "npmVersion": "9.6.7",
    "packageManager": "npm",
    "packages": {
      "@vue/cli": "5.0.8",
      "typescript": "5.2.2"
    },
    "savedAt": "2025-08-27T10:30:56.789Z",
    "packagesCount": 15,
    "platform": "darwin",
    "arch": "x64"
  }
}
```

## 常见问题

### Q: 为什么默认安装最新版本而不是保存时的版本？

A: 为了安全考虑。最新版本通常包含安全修复和 bug 修复。如果需要确切版本，可使用 `--exact-version` 参数。

### Q: 哪些包会被自动过滤？

A: 工具会自动过滤以下包，避免冲突：

- `npm`、`npx` - npm 核心工具
- `corepack` - Node.js 内置包管理器
- `node-gyp` - 通常会自动安装
- `global-pack-sync` - 工具本身

### Q: 安装失败的包怎么处理？

A: 工具会自动生成重试脚本 `~/.global-pack-sync/retry-failed.sh`，您可以手动执行或修改后执行。

### Q: 支持私有 npm 源吗？

A: 是的，工具使用当前环境的 npm 配置，包括私有源配置。

### Q: 可以在不同操作系统间迁移吗？

A: 大部分包可以，但一些依赖原生模块的包可能需要重新编译。工具会保存平台信息供参考。

## 故障排查

### 权限问题

```bash
# macOS/Linux
sudo global-pack-sync restore

# 或者修复 npm 权限
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
```

### 网络问题

```bash
# 设置 npm 源
npm config set registry https://registry.npmmirror.com

# 或临时使用
global-pack-sync restore --pm npm
```

### 清理和重置

```bash
# 清理配置文件
rm -rf ~/.global-pack-sync

# 重新开始
global-pack-sync save
```

## 贡献指南

欢迎贡献代码！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

### 开发环境搭建

```bash
# 克隆仓库
git clone https://github.com/your-username/global-pack-sync.git
cd global-pack-sync

# 安装依赖
yarn install

# 构建一次（输出到 dist/）
yarn build

# 本地运行 CLI
node dist/cli.js --help

# 运行测试
yarn test
```

## 更新日志

### v2.0.0 (最新)

- ✨ 新增选择性恢复功能
- 🆕 默认使用最新版本策略
- 🚀 支持并行安装提升性能
- 📊 增加配置差异对比
- 🛠 支持多包管理器 (yarn/pnpm)
- 🔒 增加进程锁防止冲突

### v1.0.0

- 🎉 初始版本发布
- 📦 基础的保存和恢复功能
- 💾 JSON 配置文件存储

查看完整更新日志：[CHANGELOG.md](./CHANGELOG.md)

## 许可证

[MIT License](./LICENSE) © 2025

## 链接

- 🏠 [项目主页](https://github.com/your-username/global-pack-sync)
- 🐛 [问题反馈](https://github.com/your-username/global-pack-sync/issues)
- 📖 [Wiki 文档](https://github.com/your-username/global-pack-sync/wiki)
- 💬 [讨论区](https://github.com/your-username/global-pack-sync/discussions)

---

如果这个工具帮助到了您，请给我们一个 ⭐ Star！

**快乐编码！** 🎉
