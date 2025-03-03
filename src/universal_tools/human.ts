import { 
  HumanInputTextInput,
  HumanInputTextResult,
  HumanInputSingleChoiceInput,
  HumanInputSingleChoiceResult,
  HumanInputMultipleChoiceInput,
  HumanInputMultipleChoiceResult,
} from '../types/tools.types';
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
      return {status: "Error: Cannot get user's answer.", answer: ""};
    } else {
      console.log("answer: " + answer);
      return {status: "OK", answer: answer};
    }
  }
}

export class HumanInputSingleChoice implements Tool<HumanInputSingleChoiceInput, HumanInputSingleChoiceResult> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'human_input_single_choice';
    this.description = 'When you are unsure about the details of your next action, invoke me and ask the user for details in the "question" field with at least 2 choices. The user will provide you with ONE choice as an answer.';
    this.input_schema = {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Ask the user here.',
        },
        choices: {
          type: 'array',
          description: 'All of the choices.',
        }
      },
      required: ['question', 'choices'],
    };
  }

  async execute(context: ExecutionContext, params: HumanInputSingleChoiceInput): Promise<HumanInputSingleChoiceResult> {
    if (typeof params !== 'object' || params === null || !params.question || !params.choices) {
      throw new Error('Invalid parameters. Expected an object with a "question" and "choices" property.');
    }
    const question = params.question;
    const choices = params.choices;
    console.log("question: " + question);
    console.log("choices: " + choices);
    let answer = await context.callback?.hooks.onHumanInputSingleChoice(question, choices);
    if (!answer) {
      console.error("Cannot get user's answer.");
      return {status: "Error: Cannot get user's answer.", answer: ""};
    } else {
      console.log("answer: " + answer);
      return {status: "OK", answer: answer};
    }
  }
}

export class HumanInputMultipleChoice implements Tool<HumanInputMultipleChoiceInput, HumanInputMultipleChoiceResult> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'human_input_multiple_choice';
    this.description = 'When you are unsure about the details of your next action, invoke me and ask the user for details in the "question" field with at least 2 choices. The user will provide you with ONE or MANY choice as an answer.';
    this.input_schema = {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Ask the user here.',
        },
        choices: {
          type: 'array',
          description: 'All of the choices.',
        }
      },
      required: ['question', 'choices'],
    };
  }

  async execute(context: ExecutionContext, params: HumanInputMultipleChoiceInput): Promise<HumanInputMultipleChoiceResult> {
    if (typeof params !== 'object' || params === null || !params.question || !params.choices) {
      throw new Error('Invalid parameters. Expected an object with a "question" and "choices" property.');
    }
    const question = params.question;
    const choices = params.choices;
    console.log("question: " + question);
    console.log("choices: " + choices);
    let answer = await context.callback?.hooks.onHumanInputMultipleChoice(question, choices);
    if (!answer) {
      console.error("Cannot get user's answer.");
      return {status: "Error: Cannot get user's answer.", answer: []};
    } else {
      console.log("answer: " + answer);
      return {status: "OK", answer: answer};
    }
  }
}
