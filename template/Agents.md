# Astro-Exe

## 项目介绍
这是个 astro 项目，前端使用纯 astro + tailwind v4 + daisyUI v5 来完成页面开发。后端使用 astro db + astro actions 完成 api 开发，如果用户希望对外提供 api 访问，可以改成普通的 api 方式开发。

项目模板已经确定，不要轻易修改原本的配置，坚持使用 tailwind v4 的语法，而不是 v3

## 工作流程

- 推荐用户使用 git 来维护项目代码，如果没有初始化 git，推荐用户进行初始化
- 前端使用 astro 格式来组织代码，推荐和鼓励封装组件，一个是为了代码复用，另一个是为了方便维护。
- 后端使用 astro db 来存储数据，推荐用户在项目初始化时就创建好数据库，避免后续手动创建。
- 根据用户的需求，建立后端代码，使用 actions 完成，持久化数据使用 db，注意 db 提示用户开发阶段不保留数据
- 为了页面美观，使用 tailwind v4 来完成样式，推荐用户使用 daisyUI v5 来完成组件的样式，daisyUI 提供了丰富的组件，用户可以根据需要选择使用。

## 相关文档

daisyUI 组件文档
https://daisyui.com/components/

daisyUI 相关文档完整 llm 文档
@web https://daisyui.com/llms.txt

astro db 文档
https://docs.astro.build/zh-cn/guides/astro-db/

astro actions 文档
https://docs.astro.build/zh-cn/guides/actions/

astro view transitions 文档
https://docs.astro.build/zh-cn/guides/view-transitions/

普通的 astro api
https://docs.astro.build/zh-cn/guides/endpoints/

astro node 构建部署文档
https://docs.astro.build/zh-cn/guides/integrations-guide/node/