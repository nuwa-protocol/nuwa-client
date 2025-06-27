# Nuwa MCPClient 设计方案

> 本文档位于 `nuwa-client/docs`，记录了在 Vercel AI SDK 基础上封装专属 **NuwaMCPClient** 的整体思路与 API 设计。文中说明使用中文，代码示例与类型定义使用英文。

---

## 目标
1. **补齐功能缺口**：AI-SDK 当前仅暴露 `client.request()`，对 `prompts/list`、`prompts/get`、`resources/list`、`resources/read` 等实验性接口缺乏一层易用封装。我们需要：
   * 列表接口：`prompts/list`、`resources/list`。
   * 读取接口：`prompts/get`（替代此前草案中的 `prompts/load`）、`resources/read`（替代 `resources/load`）。
2. **类型安全**：为 *Prompt* 与 *Resource* 定义 Zod Schema，以便在运行时校验入参、出参，也为 IDE 提供完整类型提示。
3. **与 AI-SDK 自然融合**：让大语言模型能够通过 **prompts** / **resources** API 发现、调用后端能力；前端/中间件使用体验不逊色于 `openai.functions`。

## 总览
```mermaid
flowchart TD;
    subgraph Browser（nuwa-client）
      direction TB
      FrontEnd -->|getMcpClient()| NuwaMCPClient
      NuwaMCPClient -->|HTTP Streaming / SSE| FastMCP
    end
    subgraph FastMCP Server
      direction TB
      Prompts & Resources
    end
```

NuwaMCPClient 在创建时持有底层 `createMCPClient()` 返回的实例，通过 *Proxy* 或 *mixin* 方式注入以下能力：

* `prompts()` – 获取以 `name` 为键的提示模板元数据映射。
* `prompts.get(name, args)` – 获取指定 prompt 的 messages 列表（content blocks）。
* `resources()` – 返回服务器侧全部静态资源 URI；若包含模板则以 `uriTemplate` 字段区分。
* `resources.read(uri, args?)` – 读取资源内容；若 `uri` 为模板则带参渲染。

所有调用最终都会下沉到统一的 `client.request({ method, params, resultSchema })`，并复用现有 DIDAuth 认证与传输协商逻辑。

## API 设计（TypeScript）
```ts
// src/features/mcp/types.ts
import { z } from "zod";

export const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

export const PromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).default([]),
  // 其他元信息（模型、系统提示等）后续扩展
});

export type PromptDefinition = z.infer<typeof PromptSchema>;

export const ResourceSchema = z.object({
  uri: z.string(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
});

export const ResourceTemplateSchema = z.object({
  uriTemplate: z.string(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).default([]),
});

export type ResourceDefinition = z.infer<typeof ResourceSchema>;
export type ResourceTemplateDefinition = z.infer<typeof ResourceTemplateSchema>;

/** prompts/get 返回的数据结构 */
export const PromptMessagesResultSchema = z.object({
  description: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.unknown(), // 兼容 text / resource / image 等多模态
    }),
  ),
});
export type PromptMessagesResult = z.infer<typeof PromptMessagesResultSchema>;
```

### NuwaMCPClient 接口
```ts
export interface NuwaMCPClient {
  /** 原生 client，必要时可直接访问 `request()` 等底层方法 */
  raw: MCPClient;

  /* -------- prompts -------- */
  prompts(): Promise<Record<string, PromptDefinition>>;
  prompt(name: string): Promise<PromptDefinition | undefined>; // sugar
  /**
   * 获取 prompt 具体内容（messages）。
   * 对应 RPC method: prompts/get
   */
  getPrompt(name: string, args?: Record<string, unknown>): Promise<PromptMessagesResult>;

  /* -------- resources -------- */
  /**
   * 获取服务器已声明的资源（含模板）。
   * key = 资源 URI 或 URI 模板；value = 元数据对象。
   */
  resources(): Promise<Record<string, ResourceDefinition | ResourceTemplateDefinition>>;
  /**
   * 读取静态资源。
   * 对应 RPC method: resources/read
   */
  readResource<T = unknown>(uri: string): Promise<T>;
  /**
   * 读取模板资源并渲染。
   * 对应 RPC method: resources/read
   */
  readResourceTemplate<T = unknown>(uriTemplate: string, args: Record<string, unknown>): Promise<T>;

  /** 透传关闭 */
  close(): Promise<void>;
}
```

## 实现要点
1. **类型补丁**：沿用 `src/features/mcp/services/factory.ts` 中现有逻辑，将 `patchClientWithExtras()` 抽象为可重用 util，并补充 `getPrompt` / `readResource`：
   ```ts
   const pass = { parse: (v: any) => v } as const;
   await client.request({
     request: { method: 'prompts/get', params: { name, arguments: args } },
     resultSchema: pass,
   });

   await client.request({
     request: { method: 'resources/read', params: { uri } },
     resultSchema: pass,
   });
   ```

2. **Schema 校验**：服务端返回值用上方 Zod Schema 解析；若不符立刻抛错，方便前端/LLM 调试。

3. **Proxy 辅助调用**（可选增强）：
   ```ts
   // 允许 client.prompts.shout({ text: "hi" }) 这样链式体验
   Object.defineProperty(client.prompts, name, {
     enumerable: true,
     value: (args) => loadPrompt(name, args),
   });
   ```

4. **与 AI-SDK Prompts 集成**：
   * 在 `prompts/` 目录下维护 `.prompt` 文件或 JSON 格式描述，利用 SDK 的 `definePrompts()` API（假设未来提供）。
   * 构建阶段（或运行时首次调用）通过 NuwaMCPClient 拉取 prompts，再动态注入到 `ai` 上下文，使得 `useChat()` 等 Hook 可以直接 `callPrompt("shout", { text })`。

5. **错误处理策略**：
   * 对 4xx / 5xx 统一封装 `MCPError`，内含 `code`、`message`、`detail`（Server stack）
   * 对 Capability 缺失做降级提示，保持向后兼容。

## 目录结构建议
```
nuwa-client/
  src/
    features/
      mcp/
        services/
          factory.ts        // 已有：创建底层客户端
          nuwaClient.ts     // 新增：实现 NuwaMCPClient 封装
        types.ts            // 新增：Prompt / Resource schema
  docs/
    mcp-client-design.md   // ← 当前文档
```

## 下一步
* [ ] 根据本文档落地 `types.ts` 与 `nuwaClient.ts`。
* [ ] 调整现有调用方（如 React hooks）使用新接口。
* [ ] 完善单元测试：使用 `fastmcp` mock server，覆盖列表、加载、异常流程。
* [ ] PR 提交并同步文档至团队 Wiki。

## Prompt 与 Tool 的集成策略

> 参考 [vercel/ai PR #6358](https://github.com/vercel/ai/pull/6358/files) 中的实现，`prompts.<name>.execute()` 现在与 `tools.<name>.execute()` 在调用方式上一致；但在 **协议** 与 **语义** 上，两者仍存在差异，需要在 Agent 层做出显式选择。

### 协议差异
| 维度 | Tool | Prompt |
| ---- | ---- | ------ |
| RPC method | `tools/list` / `tools/call` | `prompts/list` / `prompts/call` |
| 典型返回值 | 结构化 JSON（供 LLM 函数调用） | content blocks（text/image/embed…） |
| 设计目的 | 让 LLM 执行具备强约束的"函数" | 生成可直投上下文的模板内容 |

因此，简单把 *prompt* 描述直接塞进 `tools` 数组发给模型并不可行——服务端收到的仍然是 `tools/call` 而非 `prompts/call`，会导致 404/Unsupported method。

### 两种通用集成方案

| 场景 | 实现思路 | 适用情形 |
| --- | --- | --- |
| **方案 A**：将 Prompt 包装为"虚拟 Tool" | 1. Agent 启动时 `listPrompts()`；<br/>2. 对每个 prompt 生成 wrapper：`execute()` 内部转调 `prompts/call`；<br/>3. 连同真正的 tools 一起暴露给模型。 | 需要让 LLM **自行决定** 何时调用某个 prompt 的场景。 |
| **方案 B**：Prompt 作为上下文生成节点（默认） | 1. Agent 侧逻辑/规则判断触发 prompt；<br/>2. 调用 `prompts/call` 得到 content blocks；<br/>3. 把结果插入对话历史，再继续让模型生成。 | Prompt 主要用于系统提示、总结、补充资料等，不希望 LLM 直接决策时使用。 |

> **最佳实践**：在 Nuwa Agent 中默认采用 **方案 B**，保证语义清晰；若开发者在配置中设置 `exposePromptsAsTools: true`，则同时启用 **方案 A** 以获得更大的灵活度。

### 示例 Wrapper（方案 A）
```ts
import { z } from 'zod';

function toolFromPrompt(p: PromptDefinition, client: NuwaMCPClient) {
  return {
    name: p.name,
    description: p.description ?? 'Prompt wrapper',
    parameters: p.inputSchema ?? z.object({}).passthrough(),
    async execute(args: any) {
      const messages = await client.getPrompt(p.name, args);
      return { messages };
    },
  };
}
```

集成时：
```ts
const promptMap = await client.prompts();
const wrappedTools = Object.values(promptMap).map((p) => toolFromPrompt(p, client));
const toolsForLLM = [...realTools, ...wrappedTools];
```

---
**更新记录**
* 2024-06-27：初稿，涵盖 API 草案与整合思路 – @AI 
* 2024-06-27：补充 Prompt 与 Tool 的集成方案 – @AI 
* 2024-06-27：与 MCP 正式文档保持一致，将 *load*/*call* 更换为 *get*/*read* – @AI 