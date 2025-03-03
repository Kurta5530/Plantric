import { HumanInputTextInput, HumanInputTextResult } from '../types/tools.types';
import { Tool, InputSchema, ExecutionContext } from '../types/action.types';

export class HumanInputText implements Tool<HumanInputTextInput, HumanInputTextResult> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'human_input_text';
    this.description = 'When you are unsure about the details of your next action, invoke me and ask the user for details in the "question" field. The user will provide you with a text as an answer.';
    this.input_schema = {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Ask the user here.',
        },
      },
      required: ['question'],
    };
  }

  async execute(context: ExecutionContext, params: HumanInputTextInput): Promise<HumanInputTextResult> {
    if (typeof params !== 'object' || params === null || !params.question) {
      throw new Error('Invalid parameters. Expected an object with a "question" property.');
    }
    const question = params.question;
    console.log("question: " + question);
    let answer = await context.callback?.hooks.onHumanInputText(question);
    if (!answer) {
      console.error("Cannot get user's answer.");
      return {status: "Error: Cannot get user's answer.", answer: ""} as HumanInputTextResult;
    } else {
      console.log("answer: " + answer);
      return {status: "OK", answer: answer} as HumanInputTextResult;
    }
  }
}
