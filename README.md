# @web.worker/create-astro-exe

一个用于快速创建 Astro 项目的 npm 模板包。

## 功能特性

- 🚀 通过 `npm create @web.worker/astro-exe` 快速创建 Astro 项目
- 📝 交互式配置项目信息（项目名、描述、作者等）
- 🎨 内置完整的 Astro 项目模板
- 📦 自动安装依赖（可选）
- 🔧 自动初始化 Git 仓库（可选）
- 🔄 模板变量替换系统

## 使用方法

### 基本用法

```bash
npm create @web.worker/astro-exe my-project
```

### 带参数使用

```bash
npm create @web.worker/astro-exe my-project --no-install --no-git
```

### 支持的参数

- `--no-install`: 跳过依赖安装
- `--no-git`: 跳过 Git 仓库初始化

## 生成的项目结构

```
my-project/
├── .gitignore
├── README.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   └── favicon.svg
└── src/
    ├── components/
    │   └── Layout.astro
    └── pages/
        └── index.astro
```

## 开发

### 本地测试

1. 克隆项目并安装依赖：
```bash
git clone <repository-url>
cd create-astro-exe
npm install
```

2. 链接到全局：
```bash
npm link
```

3. 测试 CLI 工具：
```bash
node bin/create-astro-exe.js test-project
```

### 项目结构

- `bin/` - CLI 入口文件
- `lib/` - 核心逻辑模块
- `template/` - Astro 项目模板文件
- `docs/` - 项目文档

## 发布到 npm

1. 登录 npm：
```bash
npm login
```

2. 发布包：
```bash
npm publish --access public
```

## 技术实现

- **CLI 框架**: 基于 Node.js 原生模块
- **交互式输入**: 使用 `inquirer` 库
- **模板引擎**: 自定义变量替换系统
- **文件操作**: 使用 `fs-extra` 进行文件复制和处理

## 验收标准

- ✅ 支持 `npm create @web.worker/astro-exe` 命令
- ✅ 交互式配置项目信息
- ✅ 生成完整可运行的 Astro 项目
- ✅ 模板变量正确替换
- ✅ 可选的依赖安装和 Git 初始化
- ✅ 生成的项目可正常启动开发服务器

## 许可证

MIT

## 作者

@web.worker team