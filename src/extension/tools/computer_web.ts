import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getCurrentTabId, getPageSize, sleep } from '../utils';

/**
 * Computer Web for general
 */
export class ComputerWeb implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor(size: [number, number]) {
    this.name = 'computer_web';
    this.description = `Use a mouse and keyboard to interact with a computer, and take screenshots.
* This is a browser GUI interface where you do not have access to the address bar or bookmarks. You must operate the browser using inputs like screenshots, mouse, keyboard, etc.
* Some operations may take time to process, so you may need to wait and take successive screenshots to see the results of your actions. E.g. if you clicked submit button, but it didn't work, try taking another screenshot.
* The screen's resolution is ${size[0]}x${size[1]}.
* Whenever you intend to move the cursor to click on an element, you should consult a screenshot to determine the coordinates of the element before moving the cursor.
* If you tried clicking on a button or link but it failed to load, even after waiting, try adjusting your cursor position so that the tip of the cursor visually falls on the element that you want to click.
* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element.`;
    this.input_schema = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: `The action to perform. The available actions are:
* \`key\`: Press a key or key-combination on the keyboard.
- This supports js KeyboardEvent syntax.
- Multiple keys are combined using the "+" symbol.
- Examples: "a", "Enter", "Ctrl+s", "Meta+Shift+a", "Delete", "0".
* \`type\`: Type a string of text on the keyboard.
* \`cursor_position\`: Get the current (x, y) pixel coordinate of the cursor on the screen.
* \`mouse_move\`: Move the cursor to a specified (x, y) pixel coordinate on the screen.
* \`left_click\`: Click the left mouse button.
* \`left_click_drag\`: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
* \`right_click\`: Click the right mouse button.
* \`double_click\`: Double-click the left mouse button.
* \`screenshot\`: Take a screenshot of the screen.
* \`scroll_to\`: Scroll to the specified (x, y) pixel coordinate.`,
          enum: [
            'key',
            'type',
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
          description: 'Required only by `action=type` and `action=key`',
        },
      },
      required: ['action'],
    };
  }

  /**
   * computer
   *
   * @param {*} params { action: 'mouse_move', coordinate: [100, 200] }
   * @returns { success: true, coordinate?: [], image?: { type: 'base64', media_type: 'image/jpeg', data: '/9j...' } }
   */
  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    if (typeof params !== 'object' || params === null || !('action' in params)) {
      throw new Error('Invalid parameters. Expected an object with a "action" property.');
    }
    let { action, coordinate, text } = params as any;
    let windowId = context.variables.get('windowId') as any
    let tabId = await this.getTabId(context);
    let result;
    switch (action as string) {
      case 'key':
        result = await key(tabId, text, coordinate);
        break;
      case 'type':
        result = await type(tabId, text, coordinate);
        break;
      case 'mouse_move':
        result = await mouse_move(tabId, coordinate);
        break;
      case 'left_click':
        result = await left_click(tabId, coordinate);
        break;
      case 'left_click_drag':
        result = await left_click_drag(tabId, coordinate);
        break;
      case 'right_click':
        result = await right_click(tabId, coordinate);
        break;
      case 'double_click':
        result = await double_click(tabId, coordinate);
        break;
      case 'screenshot':
        result = await screenshot(windowId);
        break;
      case 'cursor_position':
        result = await cursor_position(tabId);
        break;
      case 'scroll_to':
        result = await scroll_to(tabId, coordinate);
        break;
      default:
        throw Error(
          `Invalid parameters. The "${action}" value is not included in the "action" enumeration.`
        );
    }
    return { success: true, ...result };
  }

  async getTabId(context: ExecutionContext): Promise<number> {
    let tabId = context.variables.get('tabId') as any
    if (!tabId) {
      tabId = await getCurrentTabId();
    }
    return tabId as number;
  }
}

export async function key(tabId: number, key: string, coordinate?: [number, number]) {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  await mouse_move(tabId, coordinate);
  let mapping: { [key: string]: string } = {};
  let keys = key.replace(/\s+/g, ' ').split(' ');
  for (let i = 0; i < keys.length; i++) {
    let _key = keys[i];
    let keyEvents = {
      key: '',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    };
    if (_key.indexOf('+') > -1) {
      let mapped_keys = _key.split('+').map((k) => mapping[k] || k);
      for (let i = 0; i < mapped_keys.length - 1; i++) {
        let k = mapped_keys[i].toLowerCase();
        if (k == 'ctrl' || k == 'control') {
          keyEvents.ctrlKey = true;
        } else if (k == 'alt' || k == 'option') {
          keyEvents.altKey = true;
        } else if (k == 'shift') {
          keyEvents.shiftKey = true;
        } else if (k == 'meta' || k == 'command') {
          keyEvents.metaKey = true;
        } else {
          console.log('Unknown Key: ' + k);
        }
      }
      keyEvents.key = mapped_keys[mapped_keys.length - 1];
    } else {
      keyEvents.key = mapping[_key] || _key;
    }
    if (!keyEvents.key) {
      continue;
    }
    await chrome.tabs.sendMessage(tabId, {
      type: 'computer:key',
      coordinate,
      ...keyEvents,
    });
    await sleep(100);
  }
}

export async function type(tabId: number, text: string, coordinate?: [number, number]) {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  await mouse_move(tabId, coordinate);
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:type',
    text,
    coordinate,
  });
}

export async function mouse_move(tabId: number, coordinate: [number, number]) {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:mouse_move',
    coordinate,
  });
}

export async function left_click(tabId: number, coordinate?: [number, number]) {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:left_click',
    coordinate,
  });
}

export async function left_click_drag(tabId: number, coordinate: [number, number]) {
  let from_coordinate = (await cursor_position(tabId)).coordinate;
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:left_click_drag',
    from_coordinate,
    to_coordinate: coordinate,
  });
}

export async function right_click(tabId: number, coordinate?: [number, number]) {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:right_click',
    coordinate,
  });
}

export async function double_click(tabId: number, coordinate?: [number, number]) {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:double_click',
    coordinate,
  });
}

export async function screenshot(windowId?: number): Promise<{
  image: {
    type: 'base64';
    media_type: 'image/png' | 'image/jpeg';
    data: string;
  };
}> {
  if (!windowId) {
    const window = await chrome.windows.getCurrent();
    windowId = window.id;
  }
  let dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, {
    format: 'jpeg', // jpeg / png
    quality: 80, // 0-100
  });
  let data = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
  return {
    image: {
      type: 'base64',
      media_type: dataUrl.indexOf('png') > -1 ? 'image/png' : 'image/jpeg',
      data: data,
    },
  };
}

export async function scroll_to(tabId: number, coordinate: [number, number]) {
  let from_coordinate = (await cursor_position(tabId)).coordinate;
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:scroll_to',
    from_coordinate,
    to_coordinate: coordinate,
  });
}

export async function cursor_position(tabId: number): Promise<{
  coordinate: [number, number];
}> {
  let result: any = await chrome.tabs.sendMessage(tabId, {
    type: 'computer:cursor_position',
  });
  return { coordinate: result.coordinate as [number, number] };
}

export async function size(tabId?: number): Promise<[number, number]> {
  return await getPageSize(tabId);
}
