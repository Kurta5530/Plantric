import { Tool, InputSchema, ExecutionContext } from "../../types/action.types";

/**
 * Computer Use for fellou
 */
export class ComputerUse implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor(computer_screen_size: [number, number]) {
    // TODO The screenshot is of the screen, but the plugin returns the relative position of the browser, not the screen, there is a problem!
    this.name = "computer_use";
    this.description = `Use a mouse and keyboard to interact with a computer, and take screenshots.
* This is a browser GUI interface where you do not have access to the address bar or bookmarks. You must operate the browser using inputs like screenshots, mouse, keyboard, etc.
* Some operations may take time to process, so you may need to wait and take successive screenshots to see the results of your actions. E.g. if you clicked submit button, but it didn't work, try taking another screenshot.
* The screen's resolution is ${computer_screen_size[0]}x${computer_screen_size[1]}.
* Whenever you intend to move the cursor to click on an element, you should consult a screenshot to determine the coordinates of the element before moving the cursor.
* If you tried clicking on a button or link but it failed to load, even after waiting, try adjusting your cursor position so that the tip of the cursor visually falls on the element that you want to click.
* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element.`;
    this.input_schema = {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: `The action to perform. The available actions are:
* \`key\`: Press a key or key-combination on the keyboard.
- This supports pyautogui hotkey syntax.
- Multiple keys are combined using the "+" symbol.
- Examples: "a", "enter", "ctrl+s", "command+shift+a", "num0".
* \`type\`: Type a string of text on the keyboard.
* \`cursor_position\`: Get the current (x, y) pixel coordinate of the cursor on the screen.
* \`mouse_move\`: Move the cursor to a specified (x, y) pixel coordinate on the screen.
* \`left_click\`: Click the left mouse button.
* \`left_click_drag\`: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
* \`right_click\`: Click the right mouse button.
* \`double_click\`: Double-click the left mouse button.
* \`screenshot\`: Take a screenshot of the screen.
* \`scroll\`: Performs a scroll of the mouse scroll wheel, The coordinate parameter is ineffective, each time a scroll operation is performed.`,
          enum: [
            "key",
            "type",
            "mouse_move",
            "left_click",
            "left_click_drag",
            "right_click",
            "double_click",
            "screenshot",
            "cursor_position",
            "scroll",
          ],
        },
        coordinate: {
          type: "array",
          description:
            "(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to move the mouse to.",
        },
        text: {
          type: "string",
          description: "Required only by `action=type` and `action=key`",
        },
      },
      required: ["action"],
    };
  }

  /**
   * computer
   *
   * @param {*} params { action: 'mouse_move', coordinate: [100, 200] }
   * @returns { success: true, coordinate?: [], image?: { type: 'base64', media_type: 'image/jpeg', data: '/9j...' } }
   */
  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    if (
      typeof params !== "object" ||
      params === null ||
      !("action" in params)
    ) {
      throw new Error(
        'Invalid parameters. Expected an object with a "action" property.'
      );
    }
    let { action, coordinate, text } = params as any;
    let result;
    switch (action as string) {
      case "key":
        result = await key(text, coordinate);
        break;
      case "type":
        result = await type(text, coordinate);
        break;
      case "mouse_move":
        result = await mouse_move(coordinate);
        break;
      case "left_click":
        result = await left_click(coordinate);
        break;
      case "left_click_drag":
        result = await left_click_drag(coordinate);
        break;
      case "right_click":
        result = await right_click(coordinate);
        break;
      case "double_click":
        result = await double_click(coordinate);
        break;
      case "screenshot":
        result = await screenshot();
        break;
      case "cursor_position":
        result = await cursor_position();
        break;
      case "scroll":
        result = await scroll(coordinate);
        break;
      default:
        throw Error(
          `Invalid parameters. The "${action}" value is not included in the "action" enumeration.`
        );
    }
    return { success: true, ...result };
  }

}

export async function key(
  key: string,
  coordinate?: [number, number]
) {
  if (!coordinate) {
    coordinate = (await cursor_position()).coordinate;
  }
  await mouse_move(coordinate);
  let mapping: { [key: string]: string } = {
    space: " ",
    escape: "esc",
    return: "enter",
    page_up: "pageup",
    page_down: "pagedown",
    back_space: "backspace",
  };
  let keys = key.replace(/\s+/g, " ").split(" ");
  for (let i = 0; i < keys.length; i++) {
    let _key = keys[i];
    if (_key.indexOf("+") > -1) {
      let mapped_keys = _key.split("+").map((k) => mapping[k] || k);
      await runComputeruseCommand("hotkey", mapped_keys);
    } else {
      let mapped_key = mapping[_key] || _key;
      await runComputeruseCommand("press", [mapped_key]);
    }
    await new Promise((resolve: any) => setTimeout(() => resolve(), 100));
  }
}

export async function type(
  text: string,
  coordinate?: [number, number]
) {
  if (coordinate) {
    await mouse_move(coordinate);
  }
  await runComputeruseCommand("write", [text]);
}

export async function mouse_move(coordinate: [number, number]) {
  await runComputeruseCommand("moveTo", coordinate);
}

export async function left_click(coordinate?: [number, number]) {
  if (!coordinate) {
    coordinate = (await cursor_position()).coordinate;
  }
  await runComputeruseCommand("click", [
    coordinate[0],
    coordinate[1],
    1,
    0,
    "left",
  ]);
}

export async function left_click_drag(
  coordinate: [number, number]
) {
  await runComputeruseCommand("dragTo", [coordinate[0], coordinate[1], 0]);
}

export async function right_click(
  coordinate?: [number, number]
) {
  if (!coordinate) {
    coordinate = (await cursor_position()).coordinate;
  }
  await runComputeruseCommand("click", [
    coordinate[0],
    coordinate[1],
    1,
    0,
    "right",
  ]);
}

export async function double_click(
  coordinate?: [number, number]
) {
  if (!coordinate) {
    coordinate = (await cursor_position()).coordinate;
  }
  await runComputeruseCommand("click", [
    coordinate[0],
    coordinate[1],
    2,
    0,
    "left",
  ]);
}

export async function screenshot(windowId?: number): Promise<{
  image: {
    type: "base64";
    media_type: "image/png" | "image/jpeg";
    data: string;
  };
}> {
  let screenshot = (await runComputeruseCommand("screenshot")).result;
  let dataUrl = screenshot.startsWith("data:")
    ? screenshot
    : "data:image/png;base64," + screenshot;
  let data = dataUrl.substring(dataUrl.indexOf("base64,") + 7);
  return {
    image: {
      type: "base64",
      media_type: dataUrl.indexOf("png") > -1 ? "image/png" : "image/jpeg",
      data: data,
    },
  };
}

export async function cursor_position(): Promise<{
  coordinate: [number, number];
}> {
  let response = await runComputeruseCommand("position");
  return response.result;
}

export async function size(): Promise<[number, number]> {
  let response = await runComputeruseCommand("size");
  return response.result;
}

export async function scroll(coordinate?: [number, number]) {
  await runComputeruseCommand("scroll", [2]);
}

export async function runComputeruseCommand(
  func: string,
  args?: Array<any>
): Promise<{ result: any }> {
  return (await (window as any).fellou.ai.computeruse.runCommand({
    func,
    args,
  })) as any as { result: any };
}
