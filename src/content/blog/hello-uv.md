---
title: 'Hello UV'
description: 'uv——python包管理工具'
pubDate: 'Jun 11 2026'
category: '包管理'
tags: ['uv','python','hello']
heroImage: '../../assets/blog-placeholder-2.jpg'
---

记录使用`uv`包管理工具管理python项目的命令

## 0. 初始化项目

```bash
uv init -p 3.12 #初始化并指定python版本为3.12
```

## 1. 添加包

```bash
uv add <包名>
```

## No Module Named xxx 解决方法

为什么会产生这个问题呢？是因为运行该脚本的时候，解释器会默认去找脚本所在目录的模块，但是统计文件夹并未被暴露出来，

编辑`pyproject.toml`文件，增加配置项：

```
[tool.setuptools]
packages = ["文件夹1", "文件夹2"]
```

然后运行`uv pip install -e .`，之后即可解决。

> 这行命令执行了读取`pyproject.toml`中的元信息，获取包列表，然后构建可编辑安装的链接，将项目源码目录添加到sys.path中。