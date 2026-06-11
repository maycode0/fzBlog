# FZ Blog

基于 Astro 构建的静态个人博客。当前主题参考 `blog.skk.moe` 的三栏博客布局，实现了首页文章列表、文章页目录、归档、标签、分类、搜索、友链、About Me、分页和 Disqus 评论。

## 功能

- Astro 6 静态站点，支持 Markdown 和 MDX 文章。
- 首页文章列表每页 7 篇，超过后自动生成分页。
- 三栏布局：左侧站点信息/分类/标签，中间主内容，右侧近期文章/归档/相关文章。
- 文章页包含固定高度可滚动目录、文章标签、上一篇/下一篇跳转和评论区。
- 归档页按年份分组，标签页按文章数量调整字号。
- 客户端站内搜索，搜索索引在构建时生成。
- 友链页使用双列卡片布局。
- 顶部工具区包含 RSS、搜索、GitHub 主页和主题切换入口。
- 深色/浅色主题切换，主题偏好保存在 `localStorage`。
- 通过 Astro `ClientRouter` 实现站内无刷新跳转，减少页面切换抖动。

## 环境要求

- Node.js `>= 22.12.0`
- npm

## 开发

```sh
npm install
npm run dev
```

默认开发地址为：

```text
http://localhost:4321/
```

如果 4321 端口被占用，Astro 会自动使用其它端口，例如 `http://127.0.0.1:4322/`。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产静态文件到 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm run astro -- --help` | 查看 Astro CLI 帮助 |

## 项目结构

```text
public/                 静态资源
src/assets/             图片、字体等构建资源
src/components/         Header、Sidebar、PostCard、Comments 等组件
src/content/blog/       Markdown/MDX 博客文章
src/layouts/            文章页布局
src/lib/blog.ts         文章排序、分页、归档、标签统计等工具函数
src/pages/              路由页面
src/styles/global.css   全局主题和布局样式
```

## 写文章

文章放在 `src/content/blog/`，支持 `.md` 和 `.mdx`。

Frontmatter 示例：

```md
---
title: "文章标题"
description: "文章摘要"
pubDate: 2026-06-10
updatedDate: 2026-06-11
category: "技术向"
tags: ["Astro", "博客"]
heroImage: "../../assets/blog-placeholder-1.jpg"
---

正文内容...
```

字段说明：

- `title`：文章标题，必填。
- `description`：文章摘要，必填。
- `pubDate`：发布日期，必填。
- `updatedDate`：最后更新时间，可选。
- `category`：分类，可选，默认是 `笔记本`。
- `tags`：标签数组，可选。
- `heroImage`：文章封面，可选。

## 相关文章规则

文章页右侧的“相关文章”由 `src/lib/blog.ts` 中的 `relatedPosts()` 计算，不做全文语义分析，主要依据 `tags` 和 `category` 打分：

- 排除当前文章本身。
- 每命中 1 个相同标签，得 2 分。
- 分类相同，得 1 分。
- 过滤掉 0 分文章。
- 按分数从高到低排序；分数相同则发布时间新的排前面。
- 默认最多显示 5 篇。

因此，想控制相关文章的结果，优先维护文章的 `tags`，再维护 `category`。标签权重大于分类。

## 评论配置

评论使用 Disqus。创建 `.env` 后配置：

```env
PUBLIC_DISQUS_SHORTNAME=fzblog-1
PUBLIC_DISQUS_FULL_MODE=true
```

如果要启用 DisqusJS 基础模式，还可以补充：

```env
PUBLIC_DISQUSJS_API=
PUBLIC_DISQUSJS_API_KEY=
PUBLIC_DISQUSJS_SITE_NAME=FZ Blog
```

`.env` 不应提交到公开仓库。

评论区默认加载完整 Disqus。加载提示默认隐藏，只有在较长时间内没有检测到 Disqus iframe 时，才显示代理提示和“评论基础模式”入口，避免完整评论模块已经出现后仍残留“加载中”提示。

## 部署

生产构建：

```sh
npm run build
```

构建结果会输出到 `dist/`，可部署到任意静态站点平台，例如 GitHub Pages、Cloudflare Pages、Vercel、Netlify 或自己的静态服务器。
