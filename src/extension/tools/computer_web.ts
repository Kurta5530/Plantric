import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getWindowId, getTabId, sleep } from '../utils';
import * as computer from './computer';

/**
 * Computer Web for general
 */
export class ComputerWeb implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor(window_page_size: [number, number]) {
    this.name = 'computer_web';
    this.description = `Use a mouse and keyboard to interact with a computer, and take screenshots.
* This is a browser GUI interface where you do not have access to the address bar or bookmarks. You must operate the browser using inputs like screenshots, mouse, keyboard, etc.
* Some operations may take time to process, so you may need to wait and take successive screenshots to see the results of your actions. E.g. if you clicked submit button, but it didn't work, try taking another screenshot.
* The screen's resolution is ${window_page_size[0]}x${window_page_size[1]}.
* Whenever you intend to move the cursor to click on an element, you should consult a screenshot to determine the coordinates of the element before moving the cursor.
* If you tried clicking on a button or link but it failed to load, even after waiting, try adjusting your cursor position so that the tip of the cursor visually falls on the element that you want to click.
* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element.`;
    this.input_schema = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: `The action to perform. The available actions are:
* \`type\`: Type a string of text on the keyboard.
* \`clear_input\`: Clear the value in the input box.
* \`cursor_position\`: Get the current (x, y) pixel coordinate of the cursor on the screen.
* \`mouse_move\`: Move the cursor to a specified (x, y) pixel coordinate on the screen.
* \`left_click\`: Click the left mouse button.
* \`left_click_drag\`: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
* \`right_click\`: Click the right mouse button.
* \`double_click\`: Double-click the left mouse button.
* \`screenshot\`: Take a screenshot of the screen.
* \`scroll_to\`: Scroll to the specified (x, y) pixel coordinate.`,
          enum: [
            'type',
            'clear_input',
            'mouse_move',
            'left_click',
            'left_click_drag',
            'right_click',
            'double_click',
            'screenshot',
            'cursor_position',
            'scroll_to',
          ],
        },
        coordinate: {
          type: 'array',
          description:
            '(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to move the mouse to.',
        },
        text: {
          type: 'string',
          description: 'Required only by `action=type`',
        },
      },
      required: ['action'],
    };
  }

  /**
   * computer
   *
   * @param {*} params { action: 'mouse_move', coordinate: [100, 200] }
   * @returns > { success: true, coordinate?: [], image?: { type: 'base64', media_type: 'image/jpeg', data: '/9j...' } }
   */
  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    if (typeof params !== 'object' || params === null || !('action' in params)) {
      throw new Error('Invalid parameters. Expected an object with a "action" property.');
    }
    let { action, coordinate, text } = params as any;
    let tabId = await getTabId(context);
    let windowId = await getWindowId(context);
    let result;
    switch (action as string) {
      case 'key':
        result = await computer.key(tabId, text, coordinate);
        break;
      case 'type':
        result = await computer.type(tabId, text, coordinate);
        break;
      case 'clear_input':
        result = await computer.clear_input(tabId, coordinate);
        break;
      case 'mouse_move':
        result = await computer.mouse_move(tabId, coordinate);
        break;
      case 'left_click':
        result = await computer.left_click(tabId, coordinate);
        break;
      case 'left_click_drag':
        result = await computer.left_click_drag(tabId, coordinate);
        break;
      case 'right_click':
        result = await computer.right_click(tabId, coordinate);
        break;
      case 'double_click':
        result = await computer.double_click(tabId, coordinate);
        break;
      case 'screenshot':
        result = await computer.screenshot(windowId);
        break;
      case 'cursor_position':
        result = await computer.cursor_position(tabId);
        break;
      case 'scroll_to':
        result = await computer.scroll_to(tabId, coordinate);
        await sleep(1000);
        break;
      default:
        throw Error(
          `Invalid parameters. The "${action}" value is not included in the "action" enumeration.`
        );
    }
    return { success: true, ...result };
  }
}
