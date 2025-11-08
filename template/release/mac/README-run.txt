One-click run (macOS)

1) 安装 Node.js >= 20
2) 双击运行 run.command
3) 程序将自动寻找可用端口（默认从 4321 开始，冲突则递增），并自动打开浏览器

配置：
- 可在 ./config/.env 中设置 HOST、PORT、NODE_ENV 等
- 日志输出在 ./logs/app.log
- 如需初始化数据库，已在打包阶段执行（如有 seed），或在首次启动时由应用自行初始化（视项目而定）

许可：
- 见 ./THIRD_PARTY_LICENSES.txt
