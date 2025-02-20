import { ScreenshotResult } from '../../types/tools.types';
import { getPageSize } from '../utils';

export async function type(
  tabId: number,
  text: string,
  coordinate?: [number, number]
): Promise<any> {
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

export async function type_by(tabId: number, text: string, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:type',
    text,
    xpath,
    highlightIndex,
  });
}

export async function clear_input(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  await mouse_move(tabId, coordinate);
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:type',
    text: '',
    coordinate,
  });
}

export async function clear_input_by(tabId: number, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:type',
    text: '',
    xpath,
    highlightIndex,
  });
}

export async function mouse_move(tabId: number, coordinate: [number, number]): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:mouse_move',
    coordinate,
  });
}

export async function left_click(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:left_click',
    coordinate,
  });
}

export async function left_click_by(tabId: number, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:left_click',
    xpath,
    highlightIndex,
  });
}

export async function right_click(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:right_click',
    coordinate,
  });
}

export async function right_click_by(tabId: number, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:right_click',
    xpath,
    highlightIndex,
  });
}

export async function double_click(tabId: number, coordinate?: [number, number]): Promise<any> {
  if (!coordinate) {
    coordinate = (await cursor_position(tabId)).coordinate;
  }
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:double_click',
    coordinate,
  });
}

export async function double_click_by(tabId: number, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:double_click',
    xpath,
    highlightIndex,
  });
}

export async function screenshot(windowId: number): Promise<ScreenshotResult> {
  let dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, {
    format: 'jpeg', // jpeg / png
    quality: 50, // 0-100
  });
  let data = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
  return {
    image: {
      type: 'base64',
      media_type: dataUrl.indexOf('image/png') > -1 ? 'image/png' : 'image/jpeg',
      data: data,
    },
  };
}

export async function scroll_to(tabId: number, coordinate: [number, number]): Promise<any> {
  let from_coordinate = (await cursor_position(tabId)).coordinate;
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:scroll_to',
    from_coordinate,
    to_coordinate: coordinate,
  });
}

export async function scroll_to_by(tabId: number, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:scroll_to',
    xpath,
    highlightIndex,
  });
}

export async function get_dropdown_options(tabId: number, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:get_dropdown_options',
    xpath,
    highlightIndex,
  });
}

export async function select_dropdown_option(tabId: number, text: string, xpath?: string, highlightIndex?: number): Promise<any> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'computer:select_dropdown_option',
    text,
    xpath,
    highlightIndex,
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
