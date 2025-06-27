import { z } from "zod";

// Supported transport identifiers
export type McpTransportType = "httpStream" | "sse";

/**
 * Prompt argument definition
 */
export const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

/**
 * Prompt definition
 */
export const PromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).default([]),
  // Other metadata (model, system prompt, etc.) can be extended later
});

export type PromptDefinition = z.infer<typeof PromptSchema>;

/**
 * Static resource definition
 */
export const ResourceSchema = z.object({
  uri: z.string(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
});

/**
 * Resource template definition
 */
export const ResourceTemplateSchema = z.object({
  uriTemplate: z.string(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).default([]),
});

export type ResourceDefinition = z.infer<typeof ResourceSchema>;
export type ResourceTemplateDefinition = z.infer<typeof ResourceTemplateSchema>;

/**
 * Content type enum
 */
export const ContentTypeSchema = z.enum([
  "text",
  "image",
  "resource",
  "embedded_resource",
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Text content
 */
export const TextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/**
 * Image content
 */
export const ImageContentSchema = z.object({
  type: z.literal("image"),
  image_url: z.string(),
});

/**
 * Resource content
 */
export const ResourceContentSchema = z.object({
  type: z.literal("resource"),
  resource: z.object({
    uri: z.string(),
    text: z.string().optional(),
    mimeType: z.string().optional(),
  }),
});

/**
 * Embedded resource content
 */
export const EmbeddedResourceSchema = z.object({
  type: z.literal("embedded_resource"),
  embedded_resource: z.object({
    uri: z.string(),
    data: z.unknown(),
  }),
});

/**
 * Union type for all content types
 */
export const ContentSchema = z.union([
  TextContentSchema,
  ImageContentSchema,
  ResourceContentSchema,
  EmbeddedResourceSchema,
]);
export type Content = z.infer<typeof ContentSchema>;

/**
 * Data structure returned by prompts/get
 */
export const PromptMessagesResultSchema = z.object({
  description: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.union([
        ContentSchema,
        z.array(ContentSchema),
      ]),
    }),
  ),
});
export type PromptMessagesResult = z.infer<typeof PromptMessagesResultSchema>;

/**
 * NuwaMCPClient interface definition
 */
export interface NuwaMCPClient {
  /** Raw client, can be accessed directly for lower-level methods */
  raw: any; // Actual type depends on MCPClient import

  /* -------- prompts -------- */
  prompts(): Promise<Record<string, PromptDefinition>>;
  prompt(name: string): Promise<PromptDefinition | undefined>; // sugar
  /**
   * Get prompt content (messages).
   * Corresponds to RPC method: prompts/get
   */
  getPrompt(name: string, args?: Record<string, unknown>): Promise<PromptMessagesResult>;

  /* -------- resources -------- */
  /**
   * Get all resources declared by the server (including templates).
   * key = resource URI or URI template; value = metadata object.
   */
  resources(): Promise<Record<string, ResourceDefinition | ResourceTemplateDefinition>>;
  /**
   * Read a static resource.
   * Corresponds to RPC method: resources/read
   */
  readResource<T = unknown>(uri: string): Promise<T>;
  /**
   * Read a templated resource with arguments.
   * Corresponds to RPC method: resources/read
   */
  readResourceTemplate<T = unknown>(uriTemplate: string, args: Record<string, unknown>): Promise<T>;

  /* -------- tools -------- */
  /**
   * Get all tools provided by the server.
   * Returns a record where keys are tool names and values are tool objects.
   */
  tools(): Promise<Record<string, any>>;

  /** Close the client connection */
  close(): Promise<void>;
}

/**
 * MCP error type
 */
export class MCPError extends Error {
  code?: string;
  detail?: string;

  constructor(options: { message: string; code?: string; detail?: string }) {
    super(options.message);
    this.name = 'MCPError';
    this.code = options.code;
    this.detail = options.detail;
  }
} 