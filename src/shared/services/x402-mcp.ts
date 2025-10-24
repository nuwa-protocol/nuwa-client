import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  type experimental_MCPClient as MCPClient,
  type Tool,
  type ToolCallOptions,
  tool,
} from 'ai';
import {
  type Account,
  type Address,
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { createPaymentHeader } from 'x402/client';
import type { Wallet } from 'x402/types';
import { type ZodType, z } from 'zod';

export const x402Version = 1;

interface MCPClientInternal extends MCPClient {
  // Private methods
  request: <T extends ZodType<object>>(params: {
    request: any;
    resultSchema: T;
    options?: any;
  }) => Promise<z.infer<T>>;
  assertCapability: (method: string) => void;
  isClosed: boolean;
}

async function callToolWithPayment(
  client: MCPClientInternal,
  name: string,
  args: Record<string, unknown>,
  paymentAuthorization: string,
  options?: ToolCallOptions,
) {
  // Access private methods
  const request = client.request.bind(client);
  const assertCapability = client.assertCapability.bind(client);

  if (client.isClosed) {
    throw new Error('Attempted to send a request from a closed client');
  }

  assertCapability('tools/call');

  return request({
    request: {
      method: 'tools/call',
      params: {
        name,
        arguments: args,
        _meta: {
          'x402/payment': paymentAuthorization,
        },
      },
    },
    resultSchema: CallToolResultSchema,
    options: {
      signal: options?.abortSignal,
    },
  });
}

export interface ClientPaymentOptions {
  account: Account | Address;
  maxPaymentValue?: number;
  network: 'base-sepolia' | 'base';
}

const EvmAddressRegex = /^0x[0-9a-fA-F]{40}$/;

const networkToChain = {
  'base-sepolia': baseSepolia,
  base: base,
} as const;

const networkToUsdcAddress = {
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export async function withPayment(
  mcpClient: MCPClient,
  options: ClientPaymentOptions,
): Promise<MCPClient> {
  const walletClient = createWalletClient({
    account: options.account,
    transport: http(),
    chain: networkToChain[options.network],
  });
  const publicClient = createPublicClient({
    chain: networkToChain[options.network],
    transport: http(),
  });

  const client = mcpClient as MCPClientInternal;
  const maxPaymentValue = options.maxPaymentValue ?? BigInt(0.1 * 10 ** 6); // 0.10 USDC

  const viewAccountBalanceTool = tool({
    description:
      'View the balance of the account in USDC. (USDC has 6 decimals, always divide by 10**6 to get the amount in USDC)',
    inputSchema: z.object({}),
    outputSchema: z.object({
      amount: z
        .string()
        .describe(
          'uint256 as string -  balance of the account in USDC. (USDC has 6 decimals, always divide by 10**6 to get the amount in USDC)',
        ),
    }),
    execute: async () => {
      const address =
        typeof options.account === 'object'
          ? options.account.address
          : options.account;
      const result = await publicClient.readContract({
        address: networkToUsdcAddress[options.network],
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [address],
      });
      return {
        amount: result.toString(),
      };
    },
  });

  const generatePaymentAuthorizationTool = tool({
    description:
      'Generate a x402 payment authorization for another tool call which requires payment. Never guess the payment requirements, if you even need to call this its because you already know the payment requirements from another tool call.',
    inputSchema: z.object({
      paymentRequirements: z.object({
        scheme: z.literal('exact'),
        network: z.enum(['base-sepolia', 'base']),
        maxAmountRequired: z
          .string()
          .describe(
            'uint256 as string. if you need to display this to the user, divide by 10**6 to get the amount in USDC',
          ),
        resource: z.string().url(),
        description: z.string(),
        mimeType: z.string(),
        outputSchema: z.record(z.any()).optional(),
        payTo: z.string().regex(EvmAddressRegex),
        maxTimeoutSeconds: z.number().int(),
        asset: z.string().regex(EvmAddressRegex),
        extra: z
          .any()
          .describe(
            'This field is an optional schema-specific object. If the payment requirements specifies it, you *must* include it.',
          ),
      }),
    }),
    outputSchema: z.object({
      paymentAuthorization: z.string(),
    }),
    execute: async (input) => {
      const maxAmountRequired = BigInt(
        input.paymentRequirements.maxAmountRequired,
      );
      if (maxAmountRequired > maxPaymentValue) {
        throw new Error(
          'Payment requirements exceed user configured max payment value',
        );
      }

      if (input.paymentRequirements.scheme !== 'exact') {
        throw new Error('Only exact scheme is supported');
      }

      if (input.paymentRequirements.network !== options.network) {
        throw new Error('Unsupported payment network');
      }

      const paymentHeader = await createPaymentHeader(
        walletClient as unknown as Wallet, // dont know why this is needed
        x402Version,
        input.paymentRequirements,
      );
      return {
        paymentAuthorization: paymentHeader,
      };
    },
  });

  // Store reference to original tools method before overriding it
  const originalToolsMethod = client.tools.bind(client);

  const wrappedTools: MCPClient['tools'] = async (options) => {
    // Get the original tools from the wrapped client using the stored reference
    const originalTools = await originalToolsMethod(options);
    const wrappedToolsMap: Record<string, Tool> = {};

    // Wrap each tool to add payment support
    for (const [name, tool] of Object.entries(originalTools)) {
      wrappedToolsMap[name] = {
        ...tool,
        // @ts-expect-error
        inputSchema: {
          ...tool.inputSchema,
          jsonSchema: {
            // @ts-expect-error
            ...tool.inputSchema.jsonSchema,
            properties: {
              // @ts-expect-error
              ...tool.inputSchema.jsonSchema.properties,
              paymentAuthorization: {
                type: 'string',
                description:
                  'X402Payment authorization, this is optional and should *not* be provided by default. It is only required if the tool requires payment, which can be determined by calling it without this parameter.',
              },
            },
          },
        },
        execute: async (
          args: Record<string, unknown> & { paymentAuthorization?: string },
          toolOptions: ToolCallOptions,
        ) => {
          // Extract paymentAuthorization from args
          const { paymentAuthorization, ...toolArgs } = args;

          if (paymentAuthorization) {
            // Create a custom callTool request that includes _meta
            return callToolWithPayment(
              client,
              name,
              toolArgs,
              paymentAuthorization,
              toolOptions,
            );
          } else {
            // Call the original execute function without payment
            if (!tool.execute) {
              throw new Error(`Tool ${name} does not have an execute function`);
            }
            return tool.execute(toolArgs, toolOptions);
          }
        },
      };
    }

    return {
      ...wrappedToolsMap,
      generatePaymentAuthorization: generatePaymentAuthorizationTool,
      viewAccountBalance: viewAccountBalanceTool,
    } as any;
  };

  client.tools = wrappedTools;
  return client;
}
