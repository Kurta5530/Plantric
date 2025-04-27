// src/models/action.ts

import { Action, Tool, ExecutionContext, InputSchema, Property, PatchItem } from '../types/action.types';
import { NodeInput, NodeOutput } from '../types/workflow.types';
import {
  LLMProvider,
  Message,
  LLMParameters,
  LLMStreamHandler,
  ToolDefinition,
  LLMResponse,
  ToolCall,
} from '../types/llm.types';
import { ExecutionLogger } from '@/utils/execution-logger';
import { WriteContextTool } from '@/common/tools/write_context';
import { logger } from '@/common/log';

function createReturnTool(
  actionName: string,
  outputDescription: string,
  outputSchema?: unknown
): Tool<any, any> {
  return {
    name: 'return_output',
    description: `Return the final output of this action. Use this to return a value matching the required output schema (if specified) and the following description:
      ${outputDescription}

      You can either set 'use_tool_result=true' to return the result of a previous tool call, or explicitly specify 'value' with 'use_tool_result=false' to return a value according to your own understanding. Whenever possible, reuse tool results to avoid redundancy.
      `,
    input_schema: {
      type: 'object',
      properties: {
        isSuccessful: {
          type: 'boolean',
          description: '`true` if the workflow ultimately executes successfully, and `false` when the workflow ultimately fails, regardless of whether there are errors during the workflow.'
        },
        use_tool_result: {
          type: ['boolean'],
          description: `Whether to use the latest tool result as output. When set to true, the 'value' parameter is ignored.`,
        },
        value: outputSchema || {
          // Default to accepting any JSON value
          type: ['string', 'number', 'boolean', 'object', 'null'],
          description:
            'The output value. Only provide a value if the previous tool result is not suitable for the output description. Otherwise, leave this as null.',
        },
      } as unknown,
      required: ['isSuccessful', 'use_tool_result', 'value'],
    } as InputSchema,

    async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
      context.variables.set(`__action_${actionName}_output`, params);
      console.debug('debug the output...', params);
      context.variables.set("__isSuccessful__", (params as any).isSuccessful as boolean);
      return { success: true };
    },
  };
}

export class ActionImpl implements Action {
  private readonly maxRounds: number = 100; // Default max rounds
  private writeContextTool: WriteContextTool;
  private toolResults: Map<string, any> = new Map();
  private logger: ExecutionLogger = new ExecutionLogger();
  public tabs: chrome.tabs.Tab[] = [];

  constructor(
    public type: 'prompt', // Only support prompt type
    public name: string,
    public description: string,
    public tools: Tool<any, any>[],
    public llmProvider: LLMProvider | undefined,
    private llmConfig?: LLMParameters,
    config?: { maxRounds?: number }
  ) {
    this.writeContextTool = new WriteContextTool();
    this.tools = [...tools, this.writeContextTool];
    if (config?.maxRounds) {
      this.maxRounds = config.maxRounds;
    }
  }

  private async executeSingleRound(
    messages: Message[],
    params: LLMParameters,
    toolMap: Map<string, Tool<any, any>>,
    context: ExecutionContext
  ): Promise<{
    response: LLMResponse | null;
    hasToolUse: boolean;
    roundMessages: Message[];
  }> {
    let response: LLMResponse | null = null;
    let hasToolUse = false;
    let roundMessages: Message[] = [];

    let params_copy: LLMParameters = JSON.parse(JSON.stringify(params));
    params_copy.tools = params_copy.tools?.map(this.wrapToolInputSchema);

    while (!context.signal?.aborted) {
      roundMessages = [];
      hasToolUse = false;
      response = null;

      // Buffer to collect into roundMessages
      let assistantTextMessage = '';
      let toolUseMessage: Message | null = null;
      let toolResultMessage: Message | null = null;

      // Track tool execution promise
      let toolExecutionPromise: Promise<void> | null = null;

      // Listen for abort signal
      if (context.signal) {
        context.signal.addEventListener('abort', () => {
          context.__abort = true;
        });
      }

      const handler: LLMStreamHandler = {
        onContent: (content) => {
          if (content && content.trim()) {
            assistantTextMessage += content;
          }
        },
        onToolUse: async (toolCall) => {
          logger.info("toolCall start", JSON.stringify({
            assistant: assistantTextMessage,
            toolCall: {
              name: toolCall.name,
              input: toolCall.input,
            },
          }))
          hasToolUse = true;

          const tool = toolMap.get(toolCall.name);
          if (!tool) {
            toolUseMessage = {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: toolCall.id,
                  name: toolCall.name,
                  input: toolCall.input,
                },
              ],
            };
            toolResultMessage = {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: `Error: \`${toolCall.name}\` tool not found.`,
                },
              ],
            };
            throw new Error(`Tool not found: ${toolCall.name}`);
          }

          toolUseMessage = {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: toolCall.id,
                name: tool.name,
                input: toolCall.input,
              },
            ],
          };

          // Store the promise of tool execution
          toolExecutionPromise = (async () => {
            try {
              // beforeToolUse
              context.__skip = false;
              if (context.callback && context.callback.hooks.beforeToolUse) {
                let modified_input = await context.callback.hooks.beforeToolUse(
                  tool,
                  context,
                  toolCall.input
                );
                if (modified_input) {
                  toolCall.input = modified_input;
                }
              }
              if (context.__skip || context.__abort || context.signal?.aborted) {
                toolResultMessage = {
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: toolCall.id,
                      content: 'skip',
                    },
                  ],
                };
                return;
              }

              // unwrap the toolCall
              let unwrapped = this.unwrapToolCall(toolCall);
              let input = unwrapped.toolCall.input;
              logger.debug("unwrapped", unwrapped);
              if (unwrapped.thinking) {
                context.callback?.hooks.onLlmMessage?.(unwrapped.thinking);
              } else {
                logger.warn("LLM returns without `userSidePrompt`");
              }
              if (unwrapped.userSidePrompt) {
                context.callback?.hooks.onLlmMessageUserSidePrompt?.(unwrapped.userSidePrompt, toolCall.name);
              } else {
                logger.warn("LLM returns without `userSidePrompt`");
              }

              // Execute the tool
              let result = await tool.execute(context, input);
              // afterToolUse
              if (context.callback && context.callback.hooks.afterToolUse) {
                let modified_result = await context.callback.hooks.afterToolUse(
                  tool,
                  context,
                  result
                );
                if (modified_result) {
                  result = modified_result;
                }
              }

              const result_has_image: boolean = result && result.image;
              const resultContent = result_has_image
                ? {
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: result.text
                    ? [
                      { type: 'image', source: result.image },
                      { type: 'text', text: result.text },
                    ]
                    : [{ type: 'image', source: result.image }],
                }
                : {
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: [{ type: 'text', text: JSON.stringify(result) }],
                };
              const resultContentText = result_has_image
                ? result.text
                  ? result.text + ' [Image]'
                  : '[Image]'
                : JSON.stringify(result);
              const resultMessage: Message = {
                role: 'user',
                content: [resultContent],
              };
              toolResultMessage = resultMessage;
              const truncate = (x: any) => {
                const s = JSON.stringify(x);
                const maxLength = 1000;
                if (s.length < maxLength) {
                  return x;
                } else {
                  return s.slice(0, maxLength) + "...(truncated)";
                }
              };
              logger.info("toolCall done", JSON.stringify({
                toolCall: {
                  name: tool.name,
                  result: truncate(result),
                },
              }));
              // Store tool results except for the return_output tool
              if (tool.name !== 'return_output') {
                this.toolResults.set(toolCall.id, resultContentText);
              }
            } catch (err) {
              logger.error('An error occurred when calling tool:');
              logger.error(err);
              const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
              const errorResult: Message = {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolCall.id,
                    content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                    is_error: true,
                  },
                ],
              };
              toolResultMessage = errorResult;
            }
          })();
        },
        onComplete: (llmResponse) => {
          response = llmResponse;
        },
        onError: (error) => {
          logger.error('Stream Error:', error);
          logger.debug('Last message array sent to LLM:', JSON.stringify(messages, null, 2));
          throw error;
        },
      };

      this.handleHistoryImageMessages(messages);

      // Wait for stream to complete
      if (!this.llmProvider) {
        throw new Error('LLM provider not set');
      }
      try {
        await this.llmProvider.generateStream(messages, params_copy, handler);
      } catch (e) {
        logger.warn("an error occurs when LLM generate response, retry...", e);
        console.error(e);
        continue;
      }

      // Wait for tool execution to complete if it was started
      if (toolExecutionPromise) {
        await toolExecutionPromise;
      }

      if (context.__abort) {
        throw new Error('Abort');
      }

      // Add messages in the correct order after everything is complete
      if (assistantTextMessage) {
        roundMessages.push({ role: 'assistant', content: assistantTextMessage });
      }
      if (toolUseMessage) {
        roundMessages.push(toolUseMessage);
      }
      if (toolResultMessage) {
        roundMessages.push(toolResultMessage);
      }
      break;
    }
    return { response, hasToolUse, roundMessages };
  }

  private handleHistoryImageMessages(messages: Message[]) {
    // Remove all images from historical tool results except the most recent user message
    const initialImageCount = this.countImages(messages);

    let foundFirstUser = false;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === 'user') {
        if (!foundFirstUser) {
          foundFirstUser = true;
          continue;
        }

        if (Array.isArray(message.content)) {
          // Directly modify the message content array
          message.content = message.content.map((item: any) => {
            if (item.type === 'tool_result' && Array.isArray(item.content)) {
              // Create a new content array without images
              if (item.content.length > 0) {
                item.content = item.content.filter((c: any) => c.type !== 'image');
                // If all content was images and got filtered out, replace with ok message
                if (item.content.length === 0) {
                  item.content = [{ type: 'text', text: 'ok' }];
                }
              }
            }
            return item;
          });
        }
      }
    }

    const finalImageCount = this.countImages(messages);
    if (initialImageCount !== finalImageCount) {
      logger.debug(`Removed ${initialImageCount - finalImageCount} images from history`);
    }
  }

  private countImages(messages: Message[]): number {
    let count = 0;
    messages.forEach((msg) => {
      if (Array.isArray(msg.content)) {
        msg.content.forEach((item: any) => {
          if (item.type === 'tool_result' && Array.isArray(item.content)) {
            count += item.content.filter((c: any) => c.type === 'image').length;
          }
        });
      }
    });
    return count;
  }

  async execute(
    input: NodeInput,
    output: NodeOutput,
    context: ExecutionContext,
    outputSchema?: unknown
  ): Promise<{ nodeOutput: unknown; reacts: Message[] }> {
    logger.debug(`Executing action started: ${this.name}`);
    // Create return tool with output schema
    const returnTool = createReturnTool(this.name, output.description, outputSchema);

    // Create tool map combining context tools, action tools, and return tool
    const toolMap = new Map<string, Tool<any, any>>();
    this.tools.forEach((tool) => toolMap.set(tool.name, tool));
    context.tools?.forEach((tool) => toolMap.set(tool.name, tool));
    toolMap.set(returnTool.name, returnTool);

    // get already existing tabs as task background
    const currentWindow = await context.lyvoConfig.chromeProxy.windows.getCurrent();
    const existingTabs: chrome.tabs.Tab[] = await context.lyvoConfig.chromeProxy.tabs.query({
      windowId: currentWindow.id,
    });

    // get patchs for task
    let patchs: PatchItem[] = [];
    // if (context.lyvoConfig.patchServerUrl) {
    //   patchs = await this.getPatchs(this.name, context.lyvoConfig.patchServerUrl);
    // }
    logger.debug("patchs:", patchs);

    // Prepare initial messages
    const messages: Message[] = [
      { role: 'system', content: this.formatSystemPrompt() },
      {
        role: 'user',
        content: this.formatUserPrompt(this.name, this.description, context.variables, this.tabs, [], patchs),
      },
    ];

    logger.info("action start", {
      action: {
        name: this.name,
        input,
      },
    });

    // Configure tool parameters
    const params: LLMParameters = {
      ...this.llmConfig,
      tools: Array.from(toolMap.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      })) as ToolDefinition[],
    };

    let roundCount = 0;
    let lastResponse: LLMResponse | null = null;

    while (roundCount < this.maxRounds) {
      // Check for abort signal
      if (context.signal?.aborted) {
        throw new Error('Workflow cancelled');
      }

      roundCount++;
      logger.info(`Starting round ${roundCount} of ${this.maxRounds}`);

      const { response, hasToolUse, roundMessages } = await this.executeSingleRound(
        messages,
        params,
        toolMap,
        context
      );

      lastResponse = response;

      // Add round messages to conversation history
      messages.push(...roundMessages);

      // Check termination conditions
      if (!hasToolUse && response) {
        // LLM sent a message without using tools - request explicit return
        logger.info(`Assistant: ${response.textContent}`);
        logger.warn('LLM sent a message without using tools; requesting explicit return');
        const returnOnlyParams = {
          ...params,
          tools: [
            {
              name: returnTool.name,
              description: returnTool.description,
              input_schema: returnTool.input_schema,
            },
          ],
        } as LLMParameters;

        messages.push({
          role: 'user',
          content:
            'Please process the above information and return a final result using the return_output tool.',
        });

        const { roundMessages: finalRoundMessages } = await this.executeSingleRound(
          messages,
          returnOnlyParams,
          new Map([[returnTool.name, returnTool]]),
          context
        );
        messages.push(...finalRoundMessages);
        break;
      }

      if (response?.toolCalls.some((call) => call.name === 'return_output')) {
        break;
      }

      // If this is the last round, force an explicit return
      if (roundCount === this.maxRounds) {
        logger.warn('Max rounds reached, requesting explicit return');
        const returnOnlyParams = {
          ...params,
          tools: [
            {
              name: returnTool.name,
              description: returnTool.description,
              input_schema: returnTool.input_schema,
            },
          ],
        } as LLMParameters;

        messages.push({
          role: 'user',
          content:
            'Maximum number of steps reached. Please return the best result possible with the return_output tool.',
        });

        const { roundMessages: finalRoundMessages } = await this.executeSingleRound(
          messages,
          returnOnlyParams,
          new Map([[returnTool.name, returnTool]]),
          context
        );
        messages.push(...finalRoundMessages);
      }
    }

    // Get and clean up output value
    const outputKey = `__action_${this.name}_output`;
    const outputParams = context.variables.get(outputKey) as any;
    if (!outputParams) {
      logger.warn('outputParams is `undefined`, action return `{}`');
      return { nodeOutput: {}, reacts: messages };
    }
    context.variables.delete(outputKey);

    // Get output value, first checking for use_tool_result
    const outputValue = outputParams.use_tool_result
      ? Array.from(this.toolResults.values()).pop()
      : outputParams?.value;

    if (outputValue === undefined) {
      logger.warn('Action completed without returning a value');
      return { nodeOutput: {}, reacts: messages };
    }

    return { nodeOutput: outputValue, reacts: messages };
  }

  private formatSystemPrompt(): string {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    logger.debug('Now is ' + formattedTime);
    return `您是一个旨在自动化浏览器任务的 AI 代理。您的目标是在遵循规则的情况下完成最终任务。现在是 ${formattedTime}。

## 通用规则：
- 您的工具调用必须始终是具有指定格式的 JSON。
- 每次操作后都需要截图，以确保工具已成功执行。
- 用户的要求可能并不完美，但用户不会提供更多信息，您需要自行探索并遵循常识。
- 如果遇到问题（例如需要登录），请尝试绕过它或探索其他方法和链接。
- 在返回输出之前，请反思输出是否是用户所需的，以及是否过于简洁。
- 如果找到用户想要的内容，请点击 URL 并在当前页面显示。

## 时间规则：
- 当前时间是 ${formattedTime}。
- 如果用户指定了特定的时间要求，请根据用户指定的时间范围完成任务。
- 如果用户给出了模糊的时间要求，例如“最近一年”，请先根据当前时间确定时间范围，然后再完成任务。

## 导航规则：
- 如果没有合适的元素，请使用其他功能来完成任务。
- 如果卡住，请尝试其他方法，例如返回上一页、重新搜索、打开新标签页等。
- 通过接受或关闭弹窗/cookie 来处理它们。
- 使用滚动来查找您要查找的元素。
- 如果需要研究某些内容，请打开一个新标签页，而不是使用当前标签页。

## 人工操作：
- 当您需要登录或输入验证码时：
1. 首先检查用户是否已登录。

请根据前端页面元素确定用户是否已登录。分析可以从以下方面进行：
用户信息显示区域：登录后，页面会显示用户信息，如头像、用户名和个人中心链接；如果未登录，则会显示登录/注册按钮。
导航栏或菜单变化：登录后，导航栏会包含独家菜单项，如“我的订单”和“我的收藏”；如果未登录，则会显示登录/注册入口。

2. 如果已登录，请正常继续执行任务。
3. 如果未登录或遇到验证码界面，请立即使用“human_operate”工具将操作权限转交给用户。
4. 在登录/验证码界面，不要使用任何自动输入工具（如“input_text”）来填写密码或验证码。
5. 等待用户完成登录/验证码操作，然后再次检查登录状态。
- 作为备用方法，当遇到无法自动处理的其他错误时，请使用“human_operate”工具将操作权限转交给用户。

## 任务完成：
- 仅当您 100% 确定最终任务已完成时，才使用“return_output”操作作为最后一个操作。
- 在使用“return_output”之前，您必须：
  1. 仔细检查您是否已满足用户任务描述中的所有要求。
  2. 验证您是否已收集了所有必要的信息。
  3. 确保您已处理了所有指定的情况（例如，“每个”、“所有”、“x 次”）。
  4. 确认您的输出包含所有请求的信息。
  5. 检查是否有任何遗漏的细节或不完整的步骤。
  6. 如果有任何问题，请验证是否已用尽所有重试尝试。
- 如果您需要重复执行某些操作（例如，“每个”、“所有”、“x 次”）：
  * 在您的文本响应中详细记录已完成的项目与所需总数的对比。
  * 在处理完所有项目后，才进行“return_output”。
  * 仔细检查您的计数是否与确切要求相符。
  * 如果任何项目失败，请在继续之前重试该项目。
- 永远不要在未经验证的情况下凭空想象或假设任务已完成。
- 确保您在完成文本参数中包含了最终任务中找到的所有内容。不要只是说您已完成，而是要包含任务的请求信息。

## 视觉上下文：
- 如果提供了图像，请使用它来了解页面布局。
- 带有标签的边界框位于其右上角，对应元素索引。
- 不要在没有任何操作动作的情况下重复调用截图工具。

## 表单填写：
- 如果您填写了一个输入字段，而您的操作序列被中断，大多数情况下是因为某些内容发生了变化，例如字段下方弹出了建议。

## 长任务：
- 在内存中跟踪状态和子结果。

## 提取：
- 如果您的任务是查找信息，请在特定页面上调用 extract_content 来获取并存储信息。

## 人工工具：
- 一旦您调用了人工工具（例如 \`human_operate\`），并且它返回成功，请检查页面内容并验证结果。

## 最重要的规则：
- 不要拒绝执行任务
- 不要拒绝执行任务
- 不要拒绝执行任务
`;
  }

  private formatUserPrompt(
    name: string,
    description: string,
    contextVariables: Map<string, unknown>,
    mentionedTabs: chrome.tabs.Tab[],
    existingTabs: chrome.tabs.Tab[],
    patchItems: PatchItem[],
  ): string {
    let prompt = `您的最终任务是："""${name}"""，需要按照以下步骤执行："""${description}"""。这里是上下文："""${contextVariables}"""。如果您完成了最终任务，请立即停止所有操作，并在下一步中使用完成操作来结束任务。如果没有，请继续正常操作。`;
    if (existingTabs.length > 0) {
      prompt +=
        '\n\n您应该使用以下标签页来完成任务：\n' +
        existingTabs.map((tab) => `- 标签ID=${tab.id}: ${tab.title} (${tab.url})`).join('\n');
    }
    if (mentionedTabs.length > 0) {
      prompt +=
        '\n\n您应该首先考虑以下标签页：\n' +
        mentionedTabs.map((tab) => `- 标签ID=${tab.id}: ${tab.title} (${tab.url})`).join('\n');
    }
    if (patchItems.length > 0) {
      prompt +=
        '\n\n您可以参考以下案例和提示：\n' +
        patchItems.map((item) => `<task>${item.task}</task><tips>${item.patch}</tips>`).join('\n');
    }
    return prompt;
  }

  private async getPatchs(task: string, patchServerUrl: string): Promise<PatchItem[]> {
    const form = {
      task,
      top_k: 3,
    };

    try {
      const response = await fetch(`${patchServerUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: {
        entry: {
          id: number;
          task: string;
          patch: string;
        };
        score: number;
      }[] = await response.json();
      return data.map((entryWithScore) => entryWithScore.entry);
    } catch (error) {
      logger.error('Failed to fetch patches:', error);
      return [];
    }
  }

  // Static factory method
  static createPromptAction(
    name: string,
    description: string,
    tools: Tool<any, any>[],
    llmProvider: LLMProvider | undefined,
    llmConfig?: LLMParameters
  ): Action {
    return new ActionImpl('prompt', name, description, tools, llmProvider, llmConfig);
  }

  private wrapToolInputSchema(definition: ToolDefinition): ToolDefinition {
    (definition.input_schema as InputSchema) = {
      type: "object",
      properties: {
        // comment for backup
        // observation: {
        //   "type": "string",
        //   "description": 'Your observation of the previous steps. Should start with "In the previous step, I\'ve ...".',
        // },
        thinking: {
          "type": "string",
          "description": 'Your thinking draft.',
        },
        userSidePrompt: {
          "type": "string",
          "description": 'The user-side prompt, showing what you are doing. e.g. "Openning x.com." or "Writing the post."',
        },
        toolCall: (definition.input_schema as Property),
      },
      required: [
        // comment for backup
        // "observation",
        "thinking",
        "userSidePrompt",
        "toolCall",
      ],
    };
    return definition;
  }

  private unwrapToolCall(toolCall: ToolCall) {
    const result = {
      observation: toolCall.input.observation as string | undefined,
      thinking: toolCall.input.thinking as string | undefined,
      userSidePrompt: toolCall.input.userSidePrompt as string | undefined,
      toolCall: {
        id: toolCall.id,
        name: toolCall.name,
        input: toolCall.input.toolCall,
      } as ToolCall,
    }
    return result;
  }
}
