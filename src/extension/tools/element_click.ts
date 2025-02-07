import { Tool, InputSchema, ExecutionContext } from "../../types/action.types";

/**
 * Element click
 */
export class ElementClick implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = "element_click";
    this.description = "click element";
    this.input_schema = {
      type: "object",
      properties: {
        element: {
          type: "string",
          description: "Element title",
        },
      },
      required: ["element"],
    };
  }

  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
      if (
        typeof params !== "object" ||
        params === null ||
        !("content" in params)
      ) {
        throw new Error(
          'Invalid parameters. Expected an object with a "content" property.'
        );
      }
      // TODO ....
      throw new Error('Not implemented')
    }
}