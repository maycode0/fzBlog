---
title: LangChain 浅尝
description: 对 LangChain 框架开发 agent 初步了解以及周边生态的了解。
pubDate: Jun 12 2026
category: AI Agent
tags:
  - LangChain
  - hello
  - 智能体
  - AI
heroImage: ../../assets/blog-placeholder-2.jpg
---

初步学习 `LangChain` 框架开发智能体，包含第一次阅读文档的记录与理解。

## 0. 大观

初步阅读出现几个技术名词：`LangChain`、`LangGraph`、`DeepAgent`。大致区别用以下表格进行区分：

| 框架 | 描述 | 区别 |
| --- | --- | --- |
|`LangChain`|智能体框架|1|
|`DeepAgent`|智能体框架|2|
|`LangGraph`|智能体运行时框架|3|

## 1. agent 组件

agent即是一个可以循环调用各种工具，直到完成任务的模型。agent的哲学就是：
`Agent = Model + Harness`
其中`Harness`的作用可以说是为了帮助模型完成指定任务或者是试图控制模型利用可控的路径完成任务。而`Harness`包含任何可以试图影响结果的中间件。


### 对话客户端

自定义对话模型
```python
model = init_chat_model(
    model="MODEL_NAME",
    model_provider="openai",
    base_url="OPENAI_BASE_URL",
    api_key="OPENAI_API_KEY",
)
```

其中与模型自定义供应相关的参数可配置在`.env`文件夹中，

### 系统提示词 System Prompt

### 工具 Tools

### 结构化输出 Response Format

存在问题未解决：
```python
json_schema = {
    "title": "Movie",
    "description": "A movie with details",
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "description": "The title of the movie"
        },

        "year": {
            "type": "integer",
            "description": "The year the movie was released"
        },
        "director": {
            "type": "string",
            "description": "The director of the movie"
        },
    },
    "required": ["title", "year", "director"]
}

class Movie(BaseModel):
    """A movie with details."""
    title: str = Field(description="The title of the movie")
    year: int = Field(description="The year the movie was released")
    director: str = Field(description="The director of the movie")
model = import_model() # 初始化的一个chatmodel
model_with_structure = model.with_structured_output(json_schema,method="json_schema",)
# model_with_structure = model.with_structured_output(Movie)
response = model_with_structure.invoke("Provide details about the movie Inception")
print(response)
```

无论是使用`json_schema`还是`pydantic`执行时都会出现问题

### 记忆 Checkpointer

### 命名 Name

在多智能体系统中作为子图节点的名称。

### 调用方式

#### Invoke

使用`thread_id`来持久化对话历史需要给agent配置一个检查点`checkpointer`：
```python
agent = create_agent( 
	model=model, tools=[], 
	checkpointer=InMemorySaver()
) # 配置检查点
config = {"configurable": {"thread_id": str(uuid7())}}
result = agent.invoke( 
	{"messages": [{"role": "user", "content": "What's the weather in San Francisco?"}]}, 
	config=config, # 配置会话id
)
```

如果需要将每次运行的配置（api密钥，用户id或一些配置第三方配置信息）传递给工具和中间件，则需要将其作为`context`与`config`一起传递。使用`context_schema`定义该数据的结构。

```python
@dataclass 
class Context: 
	user_id: str
agent = create_agent( 
model="google_genai:gemini-3.5-flash", 
	tools=[], 
	context_schema=Context, 
	checkpointer=InMemorySaver(), 
) 
result = agent.invoke( 
	{"messages": [{"role": "user", "content": "What's the weather in San Francisco?"}]}, 
	config={"configurable": {"thread_id": str(uuid7())}}, 
	context=Context(user_id="user-123"), 
	)
```

`thread_id`限定了会话的范围（历史信息和检查点）而`context`承载着工具与中间件在调用时的数据，两者通常一起传递。

####  流式输出 Streaming

agent执行多个步骤需要时间，为了显示中间过程进度发送实时信息流。

```python
model = init_chat_model(
    model=os.getenv("MODEL_NAME"),
    model_provider="openai",
    base_url=os.getenv("OPENAI_BASE_URL"),
    api_key=os.getenv("OPENAI_API_KEY"),
    streaming=True, # 启用流式输出
)
full = None
for chunk in model.stream("你是谁?"):
	full = chunk if full is None else full + chunk
    print(chunk.text, end="", flush=True)
    
print(full.content_blocks)
```

实现一个字一个字吐出来的效果。

> 高级的流式输出`astream_events`，后续了解。


#### batch 批

## Model

### 工具调用

工具`tool`是`scheam`和`function`或`coroutine`(协程)的组合。
当模型与agent分开使用的时候，需要主动执行请求的工具并将结果返回给模型。

```python
# step 1: 给模型绑定工具
model_with_tools = model.bind_tools([tool1,tool2])
# model_with_tools = model.bind_tools([tool1,tool2],tool_choice="tool1") 强制使用tool1
# step 2: 生成tool call信息
messages = ["role":"user", "content":"who are you?"]
ai_msg = model_with_tools.invoke(message) # 返回{"name":str,"id":str,"args":dict}
messages.append(ai_msg)
# step 3: 执行需要调用的工具
for tool_call in ai_msg.tool_call:
	# 执行tool
	tool_result = tool_.invoke(tool_call) # 此处的tool_代表模型选择调用的tool
	messages.append(tool_result)
# step 4: 将结果反馈给模型以获得最终结果
final_response = model_with_tools.invoke(messages)
```

工具调用也可以并行执行，大多数模型支持，也可以禁用：
`model.bind_tools([tool1,tool2], parallel_tool_calls=False)`


### 工具创建

`@tool`装饰器创建。通常创建一个工具需要包含以下内容：

```python
@tool('web_search',description="search the data for matching the query")
def search(qurey:str, limit:int = 10) -> str: # 包含函数返回类型，参数类型
	# 工具的功能和参数也是必须的
	""" search the data for matching the qurey 
	
	Args:
		query: search terms
		limit: maximum number of results to return
	"""
	return f"Found {limit} results for '{query}'"
```

> 注意不能使用`config` or `runtime`作为参数变量，这两个名称是保留参数。`runtime`参数对model是隐藏的，模型无法看到此参数。注意：这个参数适用于 **LangGraph Agent**

默认情况工具名称来源于函数名称，如果需要更具描述性的名称将其覆盖使用`@tool('web_search')`，使用`search.name`可以显示工具的名字。

使用`@tool('description="search the data for matching the query")`可以覆盖自动生成的工具描述，以获取更清晰的模型指导。

可以使用`Pydantic `模型定义高级的复杂输入：
```python
from pydantic import BaseModel, Field 
from typing import Literal 
class WeatherInput(BaseModel): 
"""Input for weather queries.""" 
	location: str = Field(description="City name or coordinates") 
	units: Literal["celsius", "fahrenheit"] = Field(
		default="celsius", 
		description="Temperature unit preference" 
	)# Literal指定值只能填"celsius", "fahrenheit"
	include_forecast: bool = Field(
		default=False, 
		description="Include 5-day forecast" 
	)
@tool(args_schema=WeatherInput)
def get_weather(
	location: str, 
	units: str = "celsius", i
	nclude_forecast: bool = False
) -> str:
	pass
```

### 高阶

可以使用`tool`来更新代理状态，后续补。

## Messages

包含以下字段：

- System message
- Human message：
	- `content`必须属性
	- `name`和`id`可选属性
- AI message：
	- `text`：正文内容
	- `content`：原始内容，可能包含推理和引用
	- `content_blocks`：标准化内容块，不是content的替代属性，而是用于标准化格式访问信息的新属性
	- `tool_calls`：工具调用，如果不调用工具就是空的，包含调用的工具列表`{name:"tool_name", args:{arg1:" ", arg2:" "}`
	- `id`：信息标识符
	- `usage_metadata`：包含输入输出token等元信息
	- `response_metadata`：
	- `tool_call_chunk`：
- Tool message

### `content_blocks`

`message`的属性，是一个标准的属性，包含以下属性：
- type
- text