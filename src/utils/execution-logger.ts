import { Message } from '../types/llm.types';
import { ExecutionContext } from '../types/action.types';

export interface LogOptions {
  maxHistoryLength?: number; // Maximum number of messages to keep in history
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp?: boolean;
}

/**
 * Manages logging for action execution, providing a cleaner view of the execution
 * flow while maintaining important context and history.
 */
export class ExecutionLogger {
  private history: Message[] = [];
  private readonly maxHistoryLength: number;
  private readonly logLevel: string;
  private readonly includeTimestamp: boolean;

  constructor(options: LogOptions = {}) {
    this.maxHistoryLength = options.maxHistoryLength || 10;
    this.logLevel = options.logLevel || 'info';
    this.includeTimestamp = options.includeTimestamp ?? true;
  }

  /**
   * Logs a message with execution context
   */
  log(level: string, message: string, context?: ExecutionContext) {
    if (this.shouldLog(level)) {
      const timestamp = this.includeTimestamp ? new Date().toISOString() : '';
      const contextSummary = this.summarizeContext(context);
      console.log(`${timestamp} [${level.toUpperCase()}] ${message}${contextSummary}`);
    }
  }

  /**
   * Updates conversation history while maintaining size limit
   */
  updateHistory(messages: Message[]) {
    // Keep system messages and last N messages
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const recentMessages = nonSystemMessages.slice(-this.maxHistoryLength);
    this.history = [...systemMessages, ...recentMessages];
  }

  /**
   * Gets current conversation history
   */
  getHistory(): Message[] {
    return this.history;
  }

  /**
   * Summarizes the execution context for logging
   */
  private summarizeContext(context?: ExecutionContext): string {
    if (!context) return '';

    const summary = {
      variables: Object.fromEntries(context.variables),
      tools: context.tools ? Array.from(context.tools.keys()) : [],
    };

    return `\nContext: ${JSON.stringify(summary, null, 2)}`;
  }

  /**
   * Checks if message should be logged based on log level
   */
  private shouldLog(level: string): boolean {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    } as Record<string, number>;

    return levels[level] <= levels[this.logLevel];
  }

  /**
   * Logs the start of an action execution
   */
  logActionStart(actionName: string, input: unknown, context?: ExecutionContext) {
    this.log('info', `Starting action: ${actionName}`, context);
    this.log('info', `Input: ${JSON.stringify(input, null, 2)}`);
  }

  /**
   * Logs the completion of an action execution
   */
  logActionComplete(actionName: string, result: unknown, context?: ExecutionContext) {
    this.log('info', `Completed action: ${actionName}`, context);
    this.log('info', `Result: ${JSON.stringify(result, null, 2)}`);
  }

  /**
   * Logs a tool execution
   */
  logToolExecution(toolName: string, input: unknown, context?: ExecutionContext) {
    this.log('info', `Executing tool: ${toolName}`);
    this.log('info', `Tool input: ${JSON.stringify(input, null, 2)}`);
  }

  /**
   * Logs a tool result
   */
  logToolResult(toolName: string, result: unknown, context?: ExecutionContext) {
    this.log('info', `Tool executed: ${toolName}`);
    this.log('info', `Tool result: ${JSON.stringify(result, null, 2)}`);
  }

  /**
   * Logs an error that occurred during execution
   */
  logError(error: Error, context?: ExecutionContext) {
    this.log('error', `Error occurred: ${error.message}`, context);
    if (error.stack) {
      this.log('debug', `Stack trace: ${error.stack}`);
    }
  }
}
