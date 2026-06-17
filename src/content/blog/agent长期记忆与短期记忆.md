---
title: agent长期记忆与短期记忆
description: 对agent记忆的学习。
pubDate: Jun 13 2026
category: AI Agent
tags:
  - LangChain
  - LangGraph
  - hello
  - 智能体
  - AI
  - 智能体记忆系统
heroImage: ../../assets/blog-placeholder-2.jpg
---


## Context

## Thread Id

## 短期记忆 State

默认情况下`AgentState`的shema只包含`messages`字段，但是可以通过初始agent时传入自定义的状态`schema`
```python
from langchain.agents import create_agent, AgentState

@dataclass
class CustomState(AgentState):# 注意要继承这个类
	userID: str
	
agent = create_agent(
	model,
	tools = [...],
	state_schema = CustomState
)
response = agent.invoke(
	{
		"messages":[HumanMessage(content:"look up user information")],
		"userID":"user_id",
	}
)
```

可通过tool 来查看和更新状态：
```python
@tool
def lookup_state(runtime:ToolRuntime) -> str:
	""""查看用户state info"""
	info = runtime.state
	return f"user id{info['userID']}" if info['userID']=="user_id" else "error"
def updata_state(runtime:ToolRuntime):
	pass
```


### `before_model`

### `after_model`

## 长期记忆 Store