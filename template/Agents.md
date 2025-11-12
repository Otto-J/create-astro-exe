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
- 每次都通过 astro check 检查是否有错误。

## 最佳实践

## daisyUI 的内置组件

内置组件有这些，合理使用下面的组件，避免自行实现 tailwind 组件和样式。
Accordion,Alert,Avatar,Badge,Breadcrumbs,Button,Calendar,Card,Carousel,Chat bubble,Checkbox,Collapse,Countdown,Diff,Divider,Dock,Drawer sidebar,Dropdown,FAB / Speed Dial,Fieldset,File Input,Filter,Footer,Hero,Hover Gallery,Indicator,Text Input,Join,Kbd,Label,Link,List,Loading,Mask,Menu,Browser mockup,Code mockup,Phone mockup,Window mockup,Modal,Navbar,Pagination,Progress,Radial progress,Radio,Range slider,Rating,Select,Skeleton,Stack,Stat,Status,Steps,Swap,Tabs,Table,Textarea,Theme Controller,Timeline,Toast,Toggle,Tooltip,Validator

### Astro Actions 最佳实践

- astro 不需要额外安装 zod，使用 `import { z } from 'astro:schema';`

astro actions 使用说明

文件：`src/actions/index.ts` 内容如下

```ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  getGreeting: defineAction({
    input: z.object({
      name: z.string(),
    }),
    handler: async (input) => {
      return `你好，${input.name}!`;
    },
  }),
};
```

页面中这样使用 `src/pages/index.astro`

```astro
---
---

<button>获取问候语</button>

<script>
import { actions } from 'astro:actions';

const button = document.querySelector('button');
button?.addEventListener('click', async () => {
  // 通过 action 弹出带有问候语的弹窗
  const { data, error } = await actions.getGreeting({ name: "Houston" });
  if (!error) alert(data);
})
</script>
```

为了避免 actions 特别冗长，应该拆分使用。

文件 `src/actions/user.ts` 定义。

```ts
import { defineAction } from "astro:actions";

export const user = {
  getUser: defineAction(/* ... */),
  createUser: defineAction(/* ... */),
};
```

在总的 src/actions/index.ts 中去使用

```ts
import { user } from "./user";

export const server = {
  myAction: defineAction({
    /* ... */
  }),
  user,
};
```

如果你还有疑问，可查阅文档 https://docs.astro.build/zh-cn/guides/actions/

### astro db 最佳实践

astro db 封装了 drizzleORM，因此不需要安装 drizzle 相关的库

```ts
import { eq, gt, count, sql } from "astro:db";
import { db, eq, Comment, Author } from "astro:db";

const comments = await db
  .select()
  .from(Comment)
  .innerJoin(Author, eq(Comment.authorId, Author.id));
```

这里例子就说明了，从 astro:db 中导出了哪些方法。所以不需要额外安装 drizzle 相关的库。

总是使用本地 libsql 文件，而不是远程的 url，示例如下

```shell
# 本地数据库文件配置（使用 libSQL 文件 URL）
ASTRO_DB_REMOTE_URL=file:./data/test-database.db
```

如果你有疑问应当，查看 astro db 文档
https://docs.astro.build/zh-cn/guides/astro-db/

## 相关文档

daisyUI 组件文档
https://daisyui.com/components/

daisyUI 相关文档完整 llm 文档
@web https://daisyui.com/llms.txt

astro actions 文档
https://docs.astro.build/zh-cn/guides/actions/

astro view transitions 文档
https://docs.astro.build/zh-cn/guides/view-transitions/

普通的 astro api
https://docs.astro.build/zh-cn/guides/endpoints/

astro node 构建部署文档
https://docs.astro.build/zh-cn/guides/integrations-guide/node/
