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

export async function screenshot(windowId: number, compress?: boolean): Promise<ScreenshotResult> {
  let dataUrl;
  if (compress) {
    dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, {
      format: 'jpeg',
      quality: 60, // 0-100
    });
    dataUrl = await compress_image(dataUrl, 0.7, 1);
  } else {
    dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, {
      format: 'jpeg',
      quality: 50,
    });
  }
  let data = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
  return {
    image: {
      type: 'base64',
      media_type: dataUrl.indexOf('image/png') > -1 ? 'image/png' : 'image/jpeg',
      data: data,
    },
  };
}

export async function compress_image(
  dataUrl: string,
  scale: number = 0.8,
  quality: number = 0.8
): Promise<string> {
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
  let width = bitmap.width * scale;
  let height = bitmap.height * scale;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d') as any;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: quality,
  });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
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
