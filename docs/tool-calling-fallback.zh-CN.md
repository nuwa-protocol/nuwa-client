# 不支持原生 Tool Calling 模型的兼容方案

> 适用范围：DeepSeek-R1、Phi、Llama3 等暂未开放 Tool Calling 能力的模型。

## 1. 背景

在当前 AI SDK（Vercel AI SDK ≥ v4.2）中，Tool Calling 需要 **调用方显式传入 `tools` 参数**。SDK 不会根据模型能力自动删除该字段。

当我们切换到 *不支持* Tool Calling 的模型（如 `deepseek/deepseek-r1-0528:free`）时，请求体中的 `tools` 字段会导致网关或模型侧返回 4XX/5XX 错误。

为了保证所有模型都能复用统一的工具体系，需要提供**降级兼容层**。

## 2. 设计目标

1. **一次实现，双路径复用**：支持原生 Tool Calling 的模型继续走标准流程；不支持的模型自动降级为 Tag-Based 调用。
2. **对业务层透明**：业务只调用统一的 `ToolCallEngine.run()`，无需关心底层执行策略。
3. **支持流式**：兼容 `streamText()` 的逐字输出，不阻塞首字节时间。
4. **最小侵入**：不改动 Vercel AI SDK 源码，仅在应用层做包装。

## 3. 总体架构

```
                +---------------------+
业务代码  --->   |  ToolCallEngine.run |  
                +---------+-----------+
                          | (a) 原生 Tool Calling
                          v
                +---------+-----------+
                |   AI SDK (tools)   |
                +--------------------+
                          ^
                          | (b) Tag-Based 调用
                +---------+-----------+
                | Tag 执行/解析层     |
                +--------------------+
```

### 3.1 能力探测

```ts
export interface ModelMeta {
  id: string;
  supportsTools: boolean;
}
```

`supportsTools` 来源：

* OpenRouter `GET /models` 接口的 `features.tool_calls` 字段；
* 后续可手动配置白名单。

### 3.2 ToolCallEngine 核心接口

```ts
run({
  model: LanguageModel;
  messages: Message[];
  tools: Record<string, ToolSpec>;
  ...options
}): StreamTextResult;
```

内部根据 `supportsTools` 分流：

* **supportsTools = true** → 直接 `streamText({ model, tools, ... })`。
* **supportsTools = false** → 进入 Tag 模式。

## 4. Tag 模式协议

### 4.1 Prompt 注入

在系统 Prompt 尾部追加：

```txt
你可以通过调用外部函数来完成任务。当你决定调用时，请使用如下 XML 标签格式：
<tool name="{功能名}">{JSON 参数}</tool>
```

并附上每个工具的 `name/description/parameters` 摘要。

### 4.2 流式解析

* 对 `streamText()` 返回的 **文本流** 增加 `TransformStream`：
  * 侦测 `<tool ...>` 起始与 `</tool>` 结束；
  * Buffer 数据直到标签闭合；
  * `JSON.parse()` 得到参数。
* 解析失败 → 将原始文本透传并记录告警。

### 4.3 工具执行与结果回流

步骤示例：

1. LLM 输出：
   ```xml
   好的，马上查询天气。
   <tool name="getWeather">{"location":"Beijing"}</tool>
   ```
2. 解析层截获 → 执行 `getWeather()` 得到 `{"temperature":30}`。
3. **再次调用同一模型**，构造新一轮消息：

   | role  | content |
   |-------|---------|
   | tool  | `<tool_result name="getWeather">{"temperature":30}</tool_result>` |

4. 新的 `streamText()` 响应即为最终答案。

> 如果对话无需 LLM 总结，可直接把结果拼入流并终止第二次调用。

## 5. 结果数据流（示意）

```
[assistant] 好的，马上查询天气。
[assistant] <tool name="getWeather">…</tool>
           └─> 解析 & 执行 → Stream 停顿
[tool]      <tool_result name="getWeather">…</tool_result>
           └─> 作为新输入喂回 LLM
[assistant] 北京当前 30°C，晴。
```

## 6. 关键实现片段

```ts
// tag-transform.ts
export const createTagTransform = (tools: ToolSet) => new TransformStream({
  async transform(chunk, controller) {
    const text = chunk.toString();
    const match = text.match(/<tool name="(.*?)">([\s\S]*?)<\/tool>/);
    if (!match) return controller.enqueue(chunk);

    const [, name, json] = match;
    const tool = tools[name];
    if (!tool) return controller.enqueue(chunk);

    const args = JSON.parse(json);
    const result = await tool.execute(args);

    // 将结果写回主流，供业务侧继续消费
    controller.enqueue(
      `\n<tool_result name="${name}">${JSON.stringify(result)}</tool_result>`,
    );
  },
});
```

## 7. 与业务集成

```ts
const result = await ToolCallEngine.run({
  model: provider.languageModel('chat-model'),
  messages,
  tools: { getWeather, createDocument, updateDocument },
});
return result.toDataStreamResponse();
```

业务层不再关注模型是否支持 Tool Calling。

## 8. 待办事项

1. **能力缓存**：`supportsTools` 可写入 IndexedDB / localStorage，减少频繁探测。
2. **解析健壮性**：使用状态机处理跨 chunk 标签、嵌套标签等异常。
3. **安全性**：对外部工具返回内容进行长度与敏感信息校验再注入。
4. **回流策略**：根据 `maxSteps` 决定是否总是二次调用 LLM，总结长结果时可强制。 

## 9. 业界方案调研与可复用组件

> 本节内容基于对主流闭源 / 开源模型、Agent 框架及解析库的系统调研，帮助我们判断"自研 vs 复用"的边界。

### 9.1 主流格式对比

| 格式 | 典型使用者 | 优点 | 缺点 | 解析难度 |
|------|------------|------|------|----------|
| **原生 JSON（函数调用）** | OpenAI GPT-4 / 3.5、Anthropic Claude Tool Use | 结构化强、事实标准、SDK 已支持 | 仅限支持模型 | ✅（AI SDK 内置） |
| **XML / 自定义标签** | Anthropic Claude 提示、LangChain XML Agent、LM-Studio 默认 `[TOOL_REQUEST]` | 边界清晰、容错性高、人可读 | Token 较多、需 XML/HTML 解析 | ⚠️ 需引入解析库 |
| **Markdown / 特殊定界符** | 社区实践 (` ```json` 代码块)、Guardrails `RAIL` | 定界简单、模型易遵循 | 标记多样，无统一标准 | ⚠️ 依赖正则 / Parser |
| **ReAct 伪自然语言** | LangChain Zero-Shot Agent、DSPy ReAct | 对模型最友好、可读性好 | 结构弱、易偏格式 | ❌ 需鲁棒正则 |

### 9.2 可直接复用的开源组件

| 组件 | 作用 | 适配策略 | 备注 |
|-------|------|----------|------|
| **LangChain XMLAgent / XMLOutputParser** | 生成 Tag-Based Prompt、流式解析 `<tool>` 标签 | 在 Tag 模式下可 `parser.transformStream()` 直接替换手写状态机 | 只需额外引入 `langchain` 依赖 (~80 KB tree-shaken) |
| **Guardrails RAIL + JSON/ XML Repair** | 声明式 Schema + 输出验证 / 修复 | 当要求严格 JSON 时，可在原生 & Tag 两条路径之后增加 `guardrails.validate()` | 提供 Type→Schema 自动生成，支持流式增量验证 |
| **xmllm** | 容错 XML→JS 解析 | 如果模型输出"几乎 XML"但不合法，可兜底提取 | 纯 JS，无依赖，数百行代码 |
| **JSON Repair (gpt-json / jsonrepair)** | 修复模型输出的无效 JSON | 原生 & Tag 均可用 | 可嵌入 Transform 流中自动重试 |

### 9.3 推荐采纳方案

1. **继续优先使用原生 JSON 函数调用**
   * 对 `supportsTools=true` 的模型（GPT-4o, Claude-3, Gemini-1.5 等）维持现状。
2. **Tag 模式落地时复用 *LangChain XMLAgent***
   * 替换 4.2 中的"手写 TransformStream"实现：

```ts
import { XMLAgentOutputParser } from 'langchain/agents/xml';

const parser = new XMLAgentOutputParser({
  toolHandlers: {
    getWeather: async (args) => { /* ... */ },
    // ...more tools
  },
});

const stream = await parser.transformStream(llmStream);
```

   * 优点：
     - LangChain 已支持跨 chunk 缓冲与并发工具执行；
     - 同时拥有 *Sync* 与 *Async* 解析 API，可按需切换。
3. **对 JSON 结果增加 Guardrails 校验**
   * 配置 RAIL 文件或直接传入 Pydantic Schema，防御模型输出非法 JSON；
   * 当 Tag 模式 → LLM 二次调用返回长文本时，也可用 Guardrails 做 XSS、PII 过滤。

### 9.4 工作量评估（在现有 8 项待办基础上）

| 任务 | 复杂度 | 预估工时 |
|------|--------|---------|
| 接入 LangChain XMLAgent（仅解析层） | ⭐⭐ | 0.5 天 |
| 将 Tool 调用 Schema 转换为 RAIL & 校验 | ⭐⭐⭐ | 1 天 |
| JSON Repair / Retry 封装 | ⭐ | 0.3 天 |
| 文档 & 示例更新 | ⭐ | 0.2 天 |

> **总计：≈ 2 天**，即可把兼容层从 PoC 升级为工业级实现，且最大化复用社区标准。

### 9.5 参考链接

* OpenAI Function Calling 文档：<https://platform.openai.com/docs/guides/function-calling>
* Anthropic Tool Use 指南：<https://docs.anthropic.com/claude/reference/tool-use>
* LangChain XML Agent：<https://js.langchain.com/docs/modules/agents/xml>
* Guardrails RAIL 规范：<https://docs.guardrailsai.com/rail>
* xmllm GitHub：<https://github.com/robustml/xmllm>
* Berkeley BFCL 评测：<https://bair.berkeley.edu/blog/2023/06/14/function-calling/>

---

> **结论**：与其完全自研解析，不如在 Tag 模式复用 *LangChain XMLAgent* + *Guardrails* 组合，既省时又可借力社区最佳实践；同时保持对原生函数调用的优先路径，满足未来模型能力升级。 